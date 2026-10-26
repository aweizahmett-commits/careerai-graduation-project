import requests
import logging
from datetime import datetime, timedelta
from django.conf import settings
from ..models import AggregatedJob

logger = logging.getLogger(__name__)

class AdzunaService:
    """Service for fetching jobs from Adzuna API"""
    
    def __init__(self):
        self.base_url = "https://api.adzuna.com/v1/api/jobs"
        self.app_id = getattr(settings, 'ADZUNA_APP_ID', 'your_app_id')
        self.app_key = getattr(settings, 'ADZUNA_APP_KEY', 'your_app_key')
        self.countries = ['us', 'gb', 'ca', 'au']  # US, UK, Canada, Australia
        
    def fetch_jobs(self, keywords="", location="", results_per_page=50):
        """
        Fetch jobs from Adzuna API for multiple countries
        """
        total_jobs_saved = 0
        total_jobs_updated = 0
        total_found = 0
        
        try:
            # Fetch jobs from each country
            for country in self.countries:
                try:
                    country_result = self._fetch_country_jobs(country, keywords, location, results_per_page // len(self.countries))
                    if country_result['success']:
                        total_jobs_saved += country_result['jobs_saved']
                        total_jobs_updated += country_result['jobs_updated']
                        total_found += country_result['total_found']
                        logger.info(f"Adzuna {country.upper()}: {country_result['jobs_saved']} new, {country_result['jobs_updated']} updated")
                    else:
                        logger.warning(f"Adzuna {country.upper()} failed: {country_result.get('error', 'Unknown error')}")
                except Exception as e:
                    logger.error(f"Error fetching from Adzuna {country.upper()}: {str(e)}")
                    continue
                        
            logger.info(f"Adzuna multi-country sync completed: {total_jobs_saved} new jobs, {total_jobs_updated} updated jobs, {total_found} total found")
            return {
                'success': True,
                'jobs_saved': total_jobs_saved,
                'jobs_updated': total_jobs_updated,
                'total_found': total_found
            }
            
        except Exception as e:
            logger.error(f"Unexpected error in Adzuna multi-country service: {str(e)}")
            return {
                'success': False,
                'error': f"Unexpected error: {str(e)}",
                'jobs_saved': 0,
                'jobs_updated': 0
            }
    
    def _fetch_country_jobs(self, country, keywords="", location="", results_per_page=20):
        """
        Fetch jobs from a specific country
        """
        try:
            # Build API URL
            url = f"{self.base_url}/{country}/search/1"
            
            # Parameters
            params = {
                'app_id': self.app_id,
                'app_key': self.app_key,
                'results_per_page': min(results_per_page, 50),  # Adzuna limit
                'content-type': 'application/json',
            }
            
            # Add optional parameters
            if keywords:
                params['what'] = keywords
            if location:
                params['where'] = location
                
            # Add date filter for recent jobs (last 30 days)
            thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
            params['max_days_old'] = 30
            
            logger.info(f"Fetching jobs from Adzuna {country.upper()}: {url} with params: {params}")
            
            # Make API request
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            logger.info(f"Adzuna {country.upper()} API response: {data.get('count', 0)} jobs found")
            
            # Process and save jobs
            jobs_saved = 0
            jobs_updated = 0
            
            if 'results' in data:
                for job_data in data['results']:
                    try:
                        # Check if job already exists
                        existing_job = AggregatedJob.objects.filter(
                            title__iexact=job_data.get('title', ''),
                            company__iexact=job_data.get('company', {}).get('display_name', ''),
                            source='adzuna',
                            external_id=f"adzuna_{country}_{job_data.get('id', '')}"
                        ).first()
                        
                        # Normalize location
                        job_location = job_data.get('location', {}).get('display_name', '')
                        if job_location:
                            # Add country prefix if not present
                            if country.upper() not in job_location.upper():
                                job_location = f"{job_location}, {country.upper()}"
                        
                        job_info = {
                            'title': job_data.get('title', ''),
                            'company': job_data.get('company', {}).get('display_name', ''),
                            'location': job_location,
                            'description': self._clean_description(job_data.get('description', '')),
                            'salary': self._format_salary(job_data.get('salary_min', 0), job_data.get('salary_max', 0), job_data.get('salary_currency', 'USD')),
                            'apply_url': job_data.get('redirect_url', ''),
                            'source': 'adzuna',
                            'external_id': f"adzuna_{country}_{job_data.get('id', '')}",
                            'job_type': job_data.get('contract_type', '').lower(),
                            'remote_type': 'remote' if 'remote' in job_data.get('title', '').lower() else '',
                            'is_active': True,
                        }
                        
                        if existing_job:
                            # Update existing job
                            for key, value in job_info.items():
                                setattr(existing_job, key, value)
                            existing_job.save()
                            jobs_updated += 1
                            logger.debug(f"Updated existing job: {job_info['title']}")
                        else:
                            # Create new job
                            AggregatedJob.objects.create(**job_info)
                            jobs_saved += 1
                            logger.debug(f"Created new job: {job_info['title']}")
                            
                    except Exception as e:
                        logger.error(f"Error processing Adzuna job: {str(e)}")
                        continue
                        
            return {
                'success': True,
                'jobs_saved': jobs_saved,
                'jobs_updated': jobs_updated,
                'total_found': data.get('count', 0)
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Adzuna {country.upper()} API request failed: {str(e)}")
            return {
                'success': False,
                'error': f"API request failed: {str(e)}",
                'jobs_saved': 0,
                'jobs_updated': 0
            }
        except Exception as e:
            logger.error(f"Unexpected error in Adzuna {country.upper()} service: {str(e)}")
            return {
                'success': False,
                'error': f"Unexpected error: {str(e)}",
                'jobs_saved': 0,
                'jobs_updated': 0
            }
    
    def _clean_description(self, description):
        """Clean and format job description"""
        if not description:
            return "No description available"
        
        # Remove HTML tags
        import re
        clean_desc = re.sub(r'<[^>]+>', '', description)
        
        # Clean up whitespace
        clean_desc = re.sub(r'\s+', ' ', clean_desc).strip()
        
        # Limit length
        if len(clean_desc) > 2000:
            clean_desc = clean_desc[:2000] + '...'
            
        return clean_desc
    
    def _format_salary(self, salary_min, salary_max, currency):
        """Format salary information"""
        if salary_min and salary_max:
            if salary_min == salary_max:
                return f"{currency} {salary_min:,.0f}"
            else:
                return f"{currency} {salary_min:,.0f} - {salary_max:,.0f}"
        elif salary_max:
            return f"Up to {currency} {salary_max:,.0f}"
        elif salary_min:
            return f"From {currency} {salary_min:,.0f}"
        else:
            return "Salary not specified"

# Convenience function for easy import
def fetch_adzuna_jobs(keywords="", location="", results_per_page=50):
    """Convenience function to fetch jobs from Adzuna"""
    service = AdzunaService()
    return service.fetch_jobs(keywords, location, results_per_page)
