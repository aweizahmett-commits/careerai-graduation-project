#!/usr/bin/env python3
"""
Real Job Fetcher - Integrates with Indeed, LinkedIn, and Glassdoor APIs
"""

import requests
import json
import time
import os
from datetime import datetime
from urllib.parse import urlencode
import logging

logger = logging.getLogger(__name__)

class RealJobFetcher:
    def __init__(self):
        self.indeed_api_key = os.getenv('INDEED_API_KEY')
        self.linkedin_api_key = os.getenv('LINKEDIN_API_KEY')
        self.glassdoor_api_key = os.getenv('GLASSDOOR_API_KEY')
        self.jsearch_api_key = os.getenv('JSEARCH_API_KEY')
        self.jsearch_host = os.getenv('JSEARCH_HOST')
        
        # Debug logging
        logger.info(f"JSearch API Key loaded: {bool(self.jsearch_api_key)}")
        logger.info(f"JSearch Host: {self.jsearch_host}")
        logger.info(f"JSearch API Key value: {self.jsearch_api_key[:10]}..." if self.jsearch_api_key else "None")
        
    def fetch_indeed_jobs(self, query, location="remote", limit=10):
        """Fetch jobs from Indeed API"""
        try:
            # Indeed API endpoint
            url = "https://api.indeed.com/ads/apisearch"
            
            params = {
                'publisher': self.indeed_api_key,
                'q': query,
                'l': location,
                'sort': 'date',
                'limit': limit,
                'format': 'json',
                'v': '2'
            }
            
            response = requests.get(url, params=params, timeout=15)
            response.raise_for_status()
            
            data = response.json()
            
            if 'results' in data:
                jobs = []
                for result in data['results']:
                    job = {
                        'title': result.get('jobtitle', 'Unknown Position'),
                        'company': result.get('company', 'Unknown Company'),
                        'location': result.get('formattedLocation', 'Remote'),
                        'salary': self._format_indeed_salary(result),
                        'apply_link': result.get('url', '#'),
                        'description': result.get('snippet', 'No description available.'),
                        'source': 'Indeed',
                        'logo': self._get_company_logo(result.get('company', '')),
                        'job_type': 'Full-time',
                        'posted_date': int(time.time()),
                        'is_remote': 'remote' in result.get('formattedLocation', '').lower()
                    }
                    jobs.append(job)
                
                logger.info(f"Indeed API success: found {len(jobs)} jobs")
                return jobs
            else:
                logger.error(f"Indeed API invalid response format: {data}")
                return []
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Indeed API request failed: {e}")
            return []
        except Exception as e:
            logger.error(f"Indeed API unexpected error: {e}")
            return []
    
    def fetch_linkedin_jobs(self, query, location="remote", limit=10):
        """Fetch jobs from LinkedIn API"""
        try:
            # LinkedIn API endpoint (using LinkedIn Job Search API)
            url = "https://api.linkedin.com/v2/jobSearch"
            
            headers = {
                'Authorization': f'Bearer {self.linkedin_api_key}',
                'Content-Type': 'application/json'
            }
            
            params = {
                'keywords': query,
                'location': location,
                'count': limit
            }
            
            response = requests.get(url, headers=headers, params=params, timeout=15)
            response.raise_for_status()
            
            data = response.json()
            
            if 'elements' in data:
                jobs = []
                for element in data['elements']:
                    job = {
                        'title': element.get('title', 'Unknown Position'),
                        'company': element.get('companyName', 'Unknown Company'),
                        'location': element.get('formattedLocation', 'Remote'),
                        'salary': self._format_linkedin_salary(element),
                        'apply_link': element.get('applyMethod', {}).get('companyApplyUrl', '#'),
                        'description': element.get('description', {}).get('text', 'No description available.'),
                        'source': 'LinkedIn',
                        'logo': self._get_company_logo(element.get('companyName', '')),
                        'job_type': 'Full-time',
                        'posted_date': int(time.time()),
                        'is_remote': 'remote' in element.get('formattedLocation', '').lower()
                    }
                    jobs.append(job)
                
                logger.info(f"LinkedIn API success: found {len(jobs)} jobs")
                return jobs
            else:
                logger.error(f"LinkedIn API invalid response format: {data}")
                return []
                
        except requests.exceptions.RequestException as e:
            logger.error(f"LinkedIn API request failed: {e}")
            return []
        except Exception as e:
            logger.error(f"LinkedIn API unexpected error: {e}")
            return []
    
    def fetch_jsearch_jobs(self, query, location="remote", limit=10):
        """Fetch jobs from JSearch API using RapidAPI"""
        try:
            # JSearch API endpoint
            url = "https://jsearch.p.rapidapi.com/search"
            
            headers = {
                "X-RapidAPI-Key": self.jsearch_api_key,
                "X-RapidAPI-Host": self.jsearch_host
            }
            
            params = {
                "query": query,
                "page": "1",
                "num_pages": "1",
                "date_posted": "all",
                "remote_jobs_only": "true"
            }
            
            response = requests.get(url, headers=headers, params=params, timeout=15)
            response.raise_for_status()
            
            data = response.json()
            
            if 'data' in data and isinstance(data['data'], list):
                jobs = []
                for job in data['data']:
                    job_data = {
                        'title': job.get('job_title', 'Unknown Position'),
                        'company': job.get('employer_name', 'Unknown Company'),
                        'location': job.get('job_location', 'Remote'),
                        'salary': job.get('job_salary', 'Competitive salary'),
                        'apply_link': job.get('job_apply_link', '#'),
                        'description': job.get('job_description', 'No description available.'),
                        'source': 'JSearch API',
                        'logo': job.get('employer_logo', '') or self._get_company_logo(job.get('employer_name', '')),
                        'job_type': job.get('job_employment_type', 'Full-time'),
                        'posted_date': int(time.time()),
                        'is_remote': job.get('job_is_remote', False)
                    }
                    jobs.append(job_data)
                
                logger.info(f"JSearch API success: found {len(jobs)} jobs")
                return jobs
            else:
                logger.error(f"JSearch API invalid response format: {data}")
                return []
                
        except requests.exceptions.RequestException as e:
            logger.error(f"JSearch API request failed: {e}")
            return []
        except Exception as e:
            logger.error(f"JSearch API unexpected error: {e}")
            return []
    
    def fetch_glassdoor_jobs(self, query, location="remote", limit=10):
        """Fetch jobs from Glassdoor API"""
        try:
            # Glassdoor API endpoint
            url = "https://api.glassdoor.com/api/api.htm"
            
            params = {
                't.p': self.glassdoor_api_key,
                't.k': os.getenv('GLASSDOOR_PARTNER_ID'),
                'userip': '127.0.0.1',
                'useragent': 'CareerAI/1.0',
                'action': 'jobs-search',
                'q': query,
                'l': location,
                'pn': 1,
                'ps': limit
            }
            
            response = requests.get(url, params=params, timeout=15)
            response.raise_for_status()
            
            data = response.json()
            
            if 'response' in data and 'jobs' in data['response']:
                jobs = []
                for job_data in data['response']['jobs']:
                    job = {
                        'title': job_data.get('jobTitle', 'Unknown Position'),
                        'company': job_data.get('employer', {}).get('name', 'Unknown Company'),
                        'location': job_data.get('location', 'Remote'),
                        'salary': self._format_glassdoor_salary(job_data),
                        'apply_link': job_data.get('jobUrl', '#'),
                        'description': job_data.get('jobDescription', 'No description available.'),
                        'source': 'Glassdoor',
                        'logo': self._get_company_logo(job_data.get('employer', {}).get('name', '')),
                        'job_type': job_data.get('jobType', 'Full-time'),
                        'posted_date': int(time.time()),
                        'is_remote': 'remote' in job_data.get('location', '').lower()
                    }
                    jobs.append(job)
                
                logger.info(f"Glassdoor API success: found {len(jobs)} jobs")
                return jobs
            else:
                logger.error(f"Glassdoor API invalid response format: {data}")
                return []
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Glassdoor API request failed: {e}")
            return []
        except Exception as e:
            logger.error(f"Glassdoor API unexpected error: {e}")
            return []
    
    def fetch_all_jobs(self, query, location="remote", limit=10):
        """Fetch jobs from all available APIs"""
        all_jobs = []
        
        # Prioritize JSearch API with provided RapidAPI key
        if self.jsearch_api_key and self.jsearch_api_key != 'your-jsearch-api-key-here' and len(self.jsearch_api_key) > 10:
            jsearch_jobs = self.fetch_jsearch_jobs(query, location, limit)
            all_jobs.extend(jsearch_jobs)
            if jsearch_jobs:
                logger.info(f"JSearch API provided {len(jsearch_jobs)} jobs")
                return jsearch_jobs[:limit]  # Return JSearch jobs immediately if available
        
        # Fetch from Indeed
        if self.indeed_api_key and self.indeed_api_key != 'your-indeed-publisher-id-here':
            indeed_jobs = self.fetch_indeed_jobs(query, location, limit)
            all_jobs.extend(indeed_jobs)
        
        # Fetch from LinkedIn
        if self.linkedin_api_key and self.linkedin_api_key != 'your-linkedin-api-key-here':
            linkedin_jobs = self.fetch_linkedin_jobs(query, location, limit)
            all_jobs.extend(linkedin_jobs)
        
        # Fetch from Glassdoor
        if self.glassdoor_api_key and self.glassdoor_api_key != 'your-glassdoor-api-key-here':
            glassdoor_jobs = self.fetch_glassdoor_jobs(query, location, limit)
            all_jobs.extend(glassdoor_jobs)
        
        # Remove duplicates based on title and company
        unique_jobs = []
        seen = set()
        for job in all_jobs:
            key = (job['title'].lower(), job['company'].lower())
            if key not in seen:
                seen.add(key)
                unique_jobs.append(job)
        
        logger.info(f"Total unique jobs from all APIs: {len(unique_jobs)}")
        return unique_jobs[:limit]  # Return only the requested number of jobs
    
    def _format_indeed_salary(self, job_data):
        """Format salary from Indeed API response"""
        salary = job_data.get('formattedSalary', '')
        if not salary:
            # Try to extract from snippet
            snippet = job_data.get('snippet', '')
            if '$' in snippet:
                # Simple extraction - look for salary patterns
                import re
                salary_match = re.search(r'\$[\d,]+(?:\s*-\s*\$[\d,]+)?', snippet)
                if salary_match:
                    salary = salary_match.group()
        return salary if salary else 'Competitive salary'
    
    def _format_linkedin_salary(self, job_data):
        """Format salary from LinkedIn API response"""
        # LinkedIn salary information might be in different fields
        salary = job_data.get('salary', '')
        return salary if salary else 'Competitive salary'
    
    def _format_glassdoor_salary(self, job_data):
        """Format salary from Glassdoor API response"""
        salary = job_data.get('salaryText', '')
        return salary if salary else 'Competitive salary'
    
    def _get_company_logo(self, company_name):
        """Get company logo URL"""
        if not company_name:
            return ''
        # Use Clearbit API for company logos
        return f"https://logo.clearbit.com/{company_name.lower().replace(' ', '')}.com"

# Fallback to demo data if no API keys are configured
def get_demo_jobs(query, limit=10):
    """Get demo jobs for testing when API keys are not configured"""
    demo_jobs = [
        {
            "title": "Senior Software Engineer",
            "company": "Google",
            "location": "Mountain View, CA",
            "salary": "$180,000 - $250,000",
            "apply_link": "https://careers.google.com/jobs",
            "description": "Join Google's world-class engineering team to build innovative products and services that impact billions of users worldwide.",
            "source": "Google Careers",
            "logo": "https://logo.clearbit.com/google.com",
            "job_type": "Full-time",
            "posted_date": int(time.time()),
            "is_remote": True
        },
        {
            "title": "Frontend Developer",
            "company": "Meta",
            "location": "Menlo Park, CA",
            "salary": "$140,000 - $200,000",
            "apply_link": "https://www.metacareers.com/jobs",
            "description": "Build engaging user experiences for billions of users across Facebook, Instagram, WhatsApp, and Oculus platforms.",
            "source": "Meta Careers",
            "logo": "https://logo.clearbit.com/meta.com",
            "job_type": "Full-time",
            "posted_date": int(time.time()),
            "is_remote": True
        },
        {
            "title": "Data Scientist",
            "company": "Amazon",
            "location": "Seattle, WA",
            "salary": "$160,000 - $220,000",
            "apply_link": "https://www.amazon.jobs/en",
            "description": "Apply machine learning and statistical analysis to solve complex business problems and improve customer experience.",
            "source": "Amazon Jobs",
            "logo": "https://logo.clearbit.com/amazon.com",
            "job_type": "Full-time",
            "posted_date": int(time.time()),
            "is_remote": True
        },
        {
            "title": "Backend Developer",
            "company": "Microsoft",
            "location": "Redmond, WA",
            "salary": "$150,000 - $210,000",
            "apply_link": "https://careers.microsoft.com/us/en",
            "description": "Design and implement scalable backend services for Azure cloud platform and Microsoft products.",
            "source": "Microsoft Careers",
            "logo": "https://logo.clearbit.com/microsoft.com",
            "job_type": "Full-time",
            "posted_date": int(time.time()),
            "is_remote": True
        },
        {
            "title": "Full Stack Developer",
            "company": "Apple",
            "location": "Cupertino, CA",
            "salary": "$155,000 - $215,000",
            "apply_link": "https://jobs.apple.com/en-us",
            "description": "Work on cutting-edge products that combine hardware and software innovation for millions of customers worldwide.",
            "source": "Apple Jobs",
            "logo": "https://logo.clearbit.com/apple.com",
            "job_type": "Full-time",
            "posted_date": int(time.time()),
            "is_remote": True
        }
    ]
    
    # Filter demo jobs based on query
    query_lower = query.lower()
    filtered_jobs = []
    
    for job in demo_jobs:
        job_title = job['title'].lower()
        job_company = job['company'].lower()
        
        if (query_lower in job_title or 
            query_lower in job_company or
            any(keyword in job_title for keyword in ['software', 'engineer', 'developer', 'data', 'product', 'design', 'devops', 'ui', 'ux'] if keyword in query_lower)):
            filtered_jobs.append(job.copy())
    
    return filtered_jobs[:limit]
