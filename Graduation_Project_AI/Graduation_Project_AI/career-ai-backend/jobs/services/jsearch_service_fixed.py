import requests
import logging
from django.conf import settings
from datetime import datetime, timedelta
from ..models import AggregatedJob
from .data_normalizer import normalize_job_data

logger = logging.getLogger(__name__)

class JSearchService:
    """
    Enhanced JSearch API service for fetching jobs from LinkedIn, Indeed, Glassdoor
    """
    
    def __init__(self):
        self.base_url = "https://jsearch.p.rapidapi.com/search"
        self.api_key = getattr(settings, 'RAPIDAPI_KEY', '')
        self.api_host = "jsearch.p.rapidapi.com"
        
        # Validate API key
        if not self.api_key:
            logger.error("RAPIDAPI_KEY not configured in settings")
            raise ValueError("RAPIDAPI_KEY is required for JSearch API")
    
    def fetch_jobs(self, query="software developer", page=1, num_pages=1):
        """
        Fetch jobs from JSearch API with proper error handling
        """
        jobs_saved = 0
        jobs_updated = 0
        total_jobs_found = 0
        
        try:
            logger.info(f"Starting JSearch API fetch with query: '{query}'")
            
            # Prepare headers
            headers = {
                "x-rapidapi-key": self.api_key,
                "x-rapidapi-host": self.api_host,
                "content-type": "application/json"
            }
            
            # Prepare parameters
            params = {
                "query": query,
                "page": str(page),
                "num_pages": str(num_pages),
                "date_posted": "all",
                "remote_jobs_only": "false"
            }
            
            logger.info(f"JSearch API request - URL: {self.base_url}, Params: {params}")
            
            # Make API request with timeout
            response = requests.get(
                self.base_url,
                headers=headers,
                params=params,
                timeout=30
            )
            
            # Log response details for debugging
            logger.info(f"JSearch API response - Status: {response.status_code}")
            logger.info(f"JSearch API response - Headers: {dict(response.headers)}")
            
            # Handle different response statuses
            if response.status_code == 403:
                logger.error("JSearch API authentication failed (403) - Check API key")
                return {
                    'success': False,
                    'error': 'API authentication failed - Invalid API key or subscription',
                    'jobs_saved': 0,
                    'jobs_updated': 0,
                    'total_found': 0
                }
            elif response.status_code == 429:
                logger.error("JSearch API rate limit exceeded (429)")
                return {
                    'success': False,
                    'error': 'API rate limit exceeded - Too many requests',
                    'jobs_saved': 0,
                    'jobs_updated': 0,
                    'total_found': 0
                }
            elif response.status_code != 200:
                logger.error(f"JSearch API error - Status: {response.status_code}, Response: {response.text[:500]}")
                return {
                    'success': False,
                    'error': f'API request failed with status {response.status_code}',
                    'jobs_saved': 0,
                    'jobs_updated': 0,
                    'total_found': 0
                }
            
            # Parse JSON response
            try:
                data = response.json()
                logger.info(f"JSearch API response structure keys: {list(data.keys())}")
            except ValueError as e:
                logger.error(f"JSearch API response parsing failed: {str(e)}")
                return {
                    'success': False,
                    'error': 'Invalid JSON response from API',
                    'jobs_saved': 0,
                    'jobs_updated': 0,
                    'total_found': 0
                }
            
            # Validate response structure
            if "data" not in data:
                logger.error(f"JSearch API missing 'data' field. Response: {data}")
                return {
                    'success': False,
                    'error': 'Invalid response structure - missing data field',
                    'jobs_saved': 0,
                    'jobs_updated': 0,
                    'total_found': 0
                }
            
            jobs_data = data.get("data", [])
            total_jobs_found = len(jobs_data)
            logger.info(f"JSearch API returned {total_jobs_found} jobs")
            
            # Process each job
            for i, job_data in enumerate(jobs_data):
                try:
                    logger.debug(f"Processing job {i+1}/{total_jobs_found}: {job_data.get('job_title', 'Unknown')}")
                    
                    # Extract and validate fields
                    job_info = self._extract_job_fields(job_data)
                    
                    # Only save jobs with valid apply_url
                    if not job_info['apply_url'] or job_info['apply_url'] == '#':
                        logger.warning(f"Skipping job without valid apply_url: {job_info['title']} at {job_info['company']}")
                        continue
                    
                    # Check if job already exists
                    existing_job = AggregatedJob.objects.filter(
                        title__iexact=job_info['title'],
                        company__iexact=job_info['company'],
                        source='jsearch',
                        external_id=job_info['external_id']
                    ).first()
                    
                    if existing_job:
                        # Update existing job
                        for key, value in job_info.items():
                            if hasattr(existing_job, key):
                                setattr(existing_job, key, value)
                        existing_job.updated_at = datetime.now()
                        existing_job.save()
                        jobs_updated += 1
                        logger.debug(f"Updated existing job: {job_info['title']} at {job_info['company']}")
                    else:
                        # Create new job
                        AggregatedJob.objects.create(**job_info)
                        jobs_saved += 1
                        logger.debug(f"Created new job: {job_info['title']} at {job_info['company']}")
                        
                except Exception as e:
                    logger.error(f"Error processing job {i+1}: {str(e)}")
                    continue
            
            logger.info(f"JSearch sync completed: {jobs_saved} new jobs, {jobs_updated} updated jobs")
            
            return {
                'success': True,
                'jobs_saved': jobs_saved,
                'jobs_updated': jobs_updated,
                'total_found': total_jobs_found
            }
            
        except requests.exceptions.Timeout:
            logger.error("JSearch API request timed out")
            return {
                'success': False,
                'error': 'API request timed out',
                'jobs_saved': 0,
                'jobs_updated': 0,
                'total_found': 0
            }
        except requests.exceptions.ConnectionError:
            logger.error("JSearch API connection failed")
            return {
                'success': False,
                'error': 'API connection failed',
                'jobs_saved': 0,
                'jobs_updated': 0,
                'total_found': 0
            }
        except requests.exceptions.RequestException as e:
            logger.error(f"JSearch API request failed: {str(e)}")
            return {
                'success': False,
                'error': f'API request failed: {str(e)}',
                'jobs_saved': 0,
                'jobs_updated': 0,
                'total_found': 0
            }
        except Exception as e:
            logger.error(f"Unexpected error in JSearch service: {str(e)}")
            return {
                'success': False,
                'error': f'Unexpected error: {str(e)}',
                'jobs_saved': 0,
                'jobs_updated': 0,
                'total_found': 0
            }
    
    def _extract_job_fields(self, job_data):
        """
        Extract and normalize job fields from JSearch API response
        """
        # Extract basic fields
        title = job_data.get("job_title", "").strip()
        company = job_data.get("employer_name", "").strip()
        
        # Extract apply URL with fallback
        apply_url = job_data.get("job_apply_link", "").strip()
        if not apply_url:
            apply_url = job_data.get("job_link", "").strip()
        
        # Extract and normalize location
        location_parts = []
        if job_data.get("job_city"):
            location_parts.append(job_data.get("job_city").strip())
        if job_data.get("job_state"):
            location_parts.append(job_data.get("job_state").strip())
        if job_data.get("job_country"):
            location_parts.append(job_data.get("job_country").strip())
        
        location = ", ".join(location_parts) if location_parts else "Remote"
        
        # Extract salary information
        salary_parts = []
        if job_data.get("job_min_salary"):
            salary_parts.append(f"From ${job_data.get('job_min_salary'):,}")
        if job_data.get("job_max_salary"):
            salary_parts.append(f"To ${job_data.get('job_max_salary'):,}")
        if job_data.get("job_salary_currency"):
            salary_parts.append(job_data.get("job_salary_currency").upper())
        
        salary = " - ".join(salary_parts) if salary_parts else ""
        
        # Extract description
        description = job_data.get("job_description", "").strip()
        
        # Determine source from publisher or job source
        publisher = job_data.get("job_publisher", "").strip().lower()
        job_source = job_data.get("job_source", "").strip().lower()
        
        # Map to known sources
        source_mapping = {
            'linkedin': 'LinkedIn',
            'indeed': 'Indeed',
            'glassdoor': 'Glassdoor',
            'ziprecruiter': 'ZipRecruiter',
            'careerbuilder': 'CareerBuilder',
            'monster': 'Monster',
            'simplyhired': 'SimplyHired',
            'adzuna': 'Adzuna'
        }
        
        # Try to determine source
        determined_source = 'JSearch'
        for key, value in source_mapping.items():
            if key in publisher or key in job_source:
                determined_source = value
                break
        
        # Create job info dictionary
        job_info = {
            'title': title,
            'company': company,
            'location': location,
            'description': description,
            'salary': salary,
            'apply_url': apply_url,
            'source': 'jsearch',
            'external_id': str(job_data.get("job_id", "")),
            'job_type': job_data.get("job_employment_type", "").lower(),
            'remote_type': 'remote' if job_data.get("job_is_remote", False) else '',
            'is_active': True,
        }
        
        # Add publisher info for debugging
        job_info['publisher'] = publisher
        job_info['job_source'] = job_source
        job_info['determined_source'] = determined_source
        
        # Normalize the job data
        normalized_job_info = normalize_job_data(job_info, 'jsearch')
        
        # Override source with determined source
        normalized_job_info['source'] = determined_source
        
        logger.debug(f"Extracted job: {title} at {company} from {determined_source}")
        logger.debug(f"Apply URL: {apply_url}")
        logger.debug(f"Publisher: {publisher}, Job Source: {job_source}")
        
        return normalized_job_info
    
    def test_api_connection(self):
        """
        Test API connection with a simple request
        """
        try:
            headers = {
                "x-rapidapi-key": self.api_key,
                "x-rapidapi-host": self.api_host,
            }
            
            params = {
                "query": "test",
                "page": "1",
                "num_pages": "1"
            }
            
            response = requests.get(
                self.base_url,
                headers=headers,
                params=params,
                timeout=10
            )
            
            logger.info(f"API test response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'success': True,
                    'status': response.status_code,
                    'message': 'API connection successful',
                    'data_keys': list(data.keys()) if isinstance(data, dict) else 'non-dict response'
                }
            else:
                return {
                    'success': False,
                    'status': response.status_code,
                    'message': f'API test failed: {response.text[:200]}'
                }
                
        except Exception as e:
            logger.error(f"API test failed: {str(e)}")
            return {
                'success': False,
                'message': f'API test failed: {str(e)}'
            }


# Convenience function for easy import
def fetch_jsearch_jobs(query="software developer", page=1, num_pages=1):
    """
    Convenience function to fetch jobs from JSearch API
    """
    try:
        service = JSearchService()
        return service.fetch_jobs(query, page, num_pages)
    except ValueError as e:
        logger.error(f"JSearch service initialization failed: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'jobs_saved': 0,
            'jobs_updated': 0,
            'total_found': 0
        }
    except Exception as e:
        logger.error(f"JSearch fetch failed: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'jobs_saved': 0,
            'jobs_updated': 0,
            'total_found': 0
        }
