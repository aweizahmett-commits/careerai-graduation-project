import requests
import logging
from datetime import datetime, timedelta
from django.utils import timezone
from django.conf import settings
from typing import Dict, Any, List, Tuple
from jobs.models import AggregatedJob

logger = logging.getLogger(__name__)

class JobSyncService:
    """Service for syncing jobs from multiple APIs"""
    
    def __init__(self):
        self.api_endpoints = {
            'adzuna': {
                'url': f"https://api.adzuna.com/v1/api/jobs/gb/search/1?app_id={getattr(settings, 'ADZUNA_APP_ID', '')}&app_key={getattr(settings, 'ADZUNA_APP_KEY', '')}&results_per_page=50",
                'headers': {}
            },
            'remotive': {
                'url': 'https://remotive.com/api/remote-jobs',
                'headers': {}
            },
            'arbeitnow': {
                'url': 'https://arbeitnow.com/api/job-board-api',
                'headers': {}
            }
        }
    
    def sync_all_sources(self) -> Dict[str, Any]:
        """Sync jobs from all sources"""
        results = {}
        
        for source_name in self.api_endpoints.keys():
            try:
                result = self.sync_source(source_name)
                results[source_name] = result
            except Exception as e:
                logger.error(f"Error syncing {source_name}: {str(e)}")
                results[source_name] = {'success': False, 'error': str(e)}
        
        return results
    
    def sync_source(self, source_name: str) -> Dict[str, Any]:
        """Sync jobs from a specific source"""
        if source_name == 'adzuna':
            return self._sync_adzuna()
        elif source_name == 'remotive':
            return self._sync_remotive()
        elif source_name == 'arbeitnow':
            return self._sync_arbeitnow()
        else:
            raise ValueError(f"Unknown source: {source_name}")
    
    def _sync_adzuna(self) -> Dict[str, Any]:
        """Sync jobs from Adzuna API"""
        jobs_added = 0
        jobs_updated = 0
        jobs_skipped = 0
        
        try:
            response = requests.get(
                self.api_endpoints['adzuna']['url'],
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                jobs = data.get('results', [])
                
                for job_data in jobs:
                    # Extract apply_url from redirect_url
                    apply_url = job_data.get('redirect_url', '')
                    
                    # Validate apply_url
                    if not self._is_valid_apply_url(apply_url):
                        jobs_skipped += 1
                        continue
                    
                    added, updated = self._save_job_to_database(job_data, 'adzuna')
                    jobs_added += added
                    jobs_updated += updated
                    
            else:
                logger.warning(f"Adzuna API returned status {response.status_code}")
                
        except Exception as e:
            logger.error(f"Error syncing Adzuna: {str(e)}")
        
        return {
            'jobs_added': jobs_added, 
            'jobs_updated': jobs_updated, 
            'jobs_skipped': jobs_skipped
        }
    
    def _sync_remotive(self) -> Dict[str, Any]:
        """Sync jobs from Remotive API"""
        jobs_added = 0
        jobs_updated = 0
        jobs_skipped = 0
        
        try:
            response = requests.get(
                self.api_endpoints['remotive']['url'],
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                jobs = data.get('jobs', [])
                
                for job_data in jobs:
                    # Extract apply_url from url
                    apply_url = job_data.get('url', '')
                    
                    # Validate apply_url
                    if not self._is_valid_apply_url(apply_url):
                        jobs_skipped += 1
                        continue
                    
                    added, updated = self._save_job_to_database(job_data, 'remotive')
                    jobs_added += added
                    jobs_updated += updated
                    
            else:
                logger.warning(f"Remotive API returned status {response.status_code}")
                
        except Exception as e:
            logger.error(f"Error syncing Remotive: {str(e)}")
        
        return {
            'jobs_added': jobs_added, 
            'jobs_updated': jobs_updated, 
            'jobs_skipped': jobs_skipped
        }
    
    def _sync_arbeitnow(self) -> Dict[str, Any]:
        """Sync jobs from Arbeitnow API"""
        jobs_added = 0
        jobs_updated = 0
        jobs_skipped = 0
        
        try:
            response = requests.get(
                self.api_endpoints['arbeitnow']['url'],
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                jobs = data.get('data', [])
                
                for job_data in jobs:
                    # Extract apply_url from url
                    apply_url = job_data.get('url', '')
                    
                    # Validate apply_url
                    if not self._is_valid_apply_url(apply_url):
                        jobs_skipped += 1
                        continue
                    
                    added, updated = self._save_job_to_database(job_data, 'arbeitnow')
                    jobs_added += added
                    jobs_updated += updated
                    
            else:
                logger.warning(f"Arbeitnow API returned status {response.status_code}")
                
        except Exception as e:
            logger.error(f"Error syncing Arbeitnow: {str(e)}")
        
        return {
            'jobs_added': jobs_added, 
            'jobs_updated': jobs_updated, 
            'jobs_skipped': jobs_skipped
        }
    
    def _save_job_to_database(self, job_data: Dict[str, Any], source: str) -> Tuple[int, int]:
        """Save job to database, updating if it exists (only if apply_url is valid)"""
        try:
            # Normalize job data
            normalized_data = self._normalize_job_data(job_data, source)
            
            # Check if job already exists
            existing_job = AggregatedJob.objects.filter(
                title__iexact=normalized_data['title'],
                company__iexact=normalized_data['company'],
                source=source,
                external_id=normalized_data['external_id']
            ).first()
            
            if existing_job:
                # Update existing job
                for key, value in normalized_data.items():
                    if hasattr(existing_job, key):
                        setattr(existing_job, key, value)
                existing_job.updated_at = timezone.now()
                existing_job.save()
                return (0, 1)
            else:
                # Create new job
                AggregatedJob.objects.create(**normalized_data)
                return (1, 0)
                
        except Exception as e:
            logger.error(f"Error saving job to database: {str(e)}")
            return (0, 0)
    
    def _is_valid_apply_url(self, apply_url: str) -> bool:
        """Check if apply_url is valid for saving"""
        if not apply_url or not isinstance(apply_url, str):
            return False
        
        # Remove whitespace
        apply_url = apply_url.strip()
        
        # Check for truly invalid patterns
        if apply_url in ['', '#', 'null', 'undefined']:
            return False
        
        # Check for localhost/internal IPs
        if any(pattern in apply_url.lower() for pattern in ['localhost', '127.0.0.1', '0.0.0.0', '192.168.', '10.0.']):
            return False
        
        # Check if it starts with http/https
        if not (apply_url.startswith('http://') or apply_url.startswith('https://')):
            return False
        
        try:
            from urllib.parse import urlparse
            parsed = urlparse(apply_url)
            
            # Basic validation - just check if it's a proper URL
            return bool(parsed.netloc) and bool(parsed.scheme) and len(parsed.netloc) > 3
        except:
            return False
    
    def _normalize_job_data(self, job_data: Dict[str, Any], source: str) -> Dict[str, Any]:
        """Normalize job data from different APIs to common schema"""
        
        if source == 'adzuna':
            return {
                'title': job_data.get('title', ''),
                'company': job_data.get('company', {}).get('display_name', ''),
                'location': job_data.get('location', {}).get('display_name', ''),
                'apply_url': job_data.get('redirect_url', ''),
                'description': job_data.get('description', ''),
                'source': 'adzuna',
                'external_id': f"adzuna_{job_data.get('id', '')}",
                'salary': self._format_salary(job_data.get('salary_min', 0), job_data.get('salary_max', 0), job_data.get('salary_currency', 'USD')),
                'job_type': job_data.get('contract_type', '').lower(),
                'remote_type': 'remote' if 'remote' in job_data.get('title', '').lower() else '',
                'is_active': True,
            }
        
        elif source == 'remotive':
            return {
                'title': job_data.get('title', ''),
                'company': job_data.get('company_name', ''),
                'location': job_data.get('candidate_required_location', 'Remote'),
                'apply_url': job_data.get('url', ''),
                'description': job_data.get('description', ''),
                'source': 'remotive',
                'external_id': str(job_data.get('id', '')),
                'salary': job_data.get('salary', ''),
                'job_type': job_data.get('job_type', ''),
                'remote_type': 'remote' if job_data.get('remote') else '',
                'is_active': True,
            }
        
        elif source == 'arbeitnow':
            return {
                'title': job_data.get('title', ''),
                'company': job_data.get('company_name', ''),
                'location': job_data.get('location', 'Remote'),
                'apply_url': job_data.get('url', ''),
                'description': job_data.get('description', ''),
                'source': 'arbeitnow',
                'external_id': str(job_data.get('id', '')),
                'salary': job_data.get('salary', ''),
                'job_type': job_data.get('type', ''),
                'remote_type': job_data.get('remote', ''),
                'is_active': True,
            }
        
        else:
            # Default fallback
            return {
                'title': job_data.get('title', ''),
                'company': job_data.get('company', ''),
                'location': job_data.get('location', 'Remote'),
                'apply_url': job_data.get('url', ''),
                'description': job_data.get('description', ''),
                'source': source,
                'external_id': '',
                'salary': '',
                'job_type': '',
                'remote_type': '',
                'is_active': True,
            }
    
    def _format_salary(self, salary_min: int, salary_max: int, currency: str) -> str:
        """Format salary range"""
        if salary_min and salary_max:
            return f"{currency} {salary_min:,} - {salary_max:,}"
        elif salary_min:
            return f"{currency} {salary_min:,}+"
        elif salary_max:
            return f"Up to {currency} {salary_max:,}"
        else:
            return ""


def sync_jobs():
    """Main sync function for management command"""
    service = JobSyncService()
    return service.sync_all_sources()
