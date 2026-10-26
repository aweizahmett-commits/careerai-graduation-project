"""
Job aggregation services for fetching jobs from external APIs
"""
import requests
import logging
from typing import List, Dict, Optional
from django.core.cache import cache
from django.conf import settings
from django.db import models
from .models import AggregatedJob

logger = logging.getLogger(__name__)


class JobAggregatorService:
    """Service for aggregating jobs from multiple external APIs"""
    
    def __init__(self):
        self.remotive_url = "https://remotive.com/api/remote-jobs"
        self.arbeitnow_url = "https://www.arbeitnow.com/api/job-board-api"
        self.cache_timeout = 1800  # 30 minutes
        
    def fetch_remotive_jobs(self) -> List[Dict]:
        """Fetch jobs from Remotive API"""
        try:
            cache_key = "remotive_jobs"
            cached_data = cache.get(cache_key)
            if cached_data:
                logger.info("Using cached Remotive jobs")
                return cached_data
                
            response = requests.get(self.remotive_url, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            jobs = []
            
            for job in data.get('jobs', []):
                normalized_job = self._normalize_remotive_job(job)
                if normalized_job:
                    jobs.append(normalized_job)
            
            cache.set(cache_key, jobs, self.cache_timeout)
            logger.info(f"Fetched {len(jobs)} jobs from Remotive API")
            return jobs
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Remotive API error: {e}")
            return []
        except Exception as e:
            logger.error(f"Remotive API unexpected error: {e}")
            return []
    
    def fetch_arbeitnow_jobs(self) -> List[Dict]:
        """Fetch jobs from Arbeitnow API"""
        try:
            cache_key = "arbeitnow_jobs"
            cached_data = cache.get(cache_key)
            if cached_data:
                logger.info("Using cached Arbeitnow jobs")
                return cached_data
                
            response = requests.get(self.arbeitnow_url, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            jobs = []
            
            for job in data.get('data', []):
                normalized_job = self._normalize_arbeitnow_job(job)
                if normalized_job:
                    jobs.append(normalized_job)
            
            cache.set(cache_key, jobs, self.cache_timeout)
            logger.info(f"Fetched {len(jobs)} jobs from Arbeitnow API")
            return jobs
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Arbeitnow API error: {e}")
            return []
        except Exception as e:
            logger.error(f"Arbeitnow API unexpected error: {e}")
            return []
    
    def _normalize_remotive_job(self, job: Dict) -> Optional[Dict]:
        """Normalize Remotive job data to standard format"""
        try:
            return {
                'title': job.get('title', '').strip(),
                'company': job.get('company_name', '').strip(),
                'location': job.get('candidate_required_location', 'Remote').strip(),
                'apply_url': job.get('url', '').strip(),
                'description': job.get('description', '').strip(),
                'source': 'Remotive',
                'external_id': str(job.get('id', '')),
                'salary': job.get('salary', '').strip(),
                'job_type': job.get('job_type', '').strip(),
                'remote_type': job.get('remote_type', '').strip(),
            }
        except Exception as e:
            logger.error(f"Error normalizing Remotive job: {e}")
            return None
    
    def _normalize_arbeitnow_job(self, job: Dict) -> Optional[Dict]:
        """Normalize Arbeitnow job data to standard format"""
        try:
            return {
                'title': job.get('title', '').strip(),
                'company': job.get('company_name', '').strip(),
                'location': job.get('location', 'Remote').strip(),
                'apply_url': job.get('url', '').strip(),
                'description': job.get('description', '').strip(),
                'source': 'Arbeitnow',
                'external_id': str(job.get('id', '')),
                'salary': job.get('salary', '').strip(),
                'job_type': job.get('employment_type', '').strip(),
                'remote_type': 'remote' if job.get('is_remote', False) else '',
            }
        except Exception as e:
            logger.error(f"Error normalizing Arbeitnow job: {e}")
            return None
    
    def fetch_all_jobs(self) -> List[Dict]:
        """Fetch jobs from all sources and merge them"""
        all_jobs = []
        
        # Fetch from Remotive
        remotive_jobs = self.fetch_remotive_jobs()
        all_jobs.extend(remotive_jobs)
        
        # Fetch from Arbeitnow
        arbeitnow_jobs = self.fetch_arbeitnow_jobs()
        all_jobs.extend(arbeitnow_jobs)
        
        # Remove duplicates based on title + company
        unique_jobs = self._remove_duplicates(all_jobs)
        
        logger.info(f"Total unique jobs from all sources: {len(unique_jobs)}")
        return unique_jobs
    
    def _remove_duplicates(self, jobs: List[Dict]) -> List[Dict]:
        """Remove duplicate jobs based on title + company"""
        seen = set()
        unique_jobs = []
        
        for job in jobs:
            key = (job['title'].lower(), job['company'].lower())
            if key not in seen:
                seen.add(key)
                unique_jobs.append(job)
        
        return unique_jobs
    
    def sync_jobs_to_database(self) -> Dict[str, int]:
        """Sync jobs from APIs to database"""
        stats = {
            'remotive': 0,
            'arbeitnow': 0,
            'updated': 0,
            'created': 0,
            'total': 0
        }
        
        try:
            # Fetch all jobs
            all_jobs = self.fetch_all_jobs()
            
            for job_data in all_jobs:
                source = job_data['source']
                
                # Check if job already exists
                existing_job = AggregatedJob.objects.filter(
                    title=job_data['title'],
                    company=job_data['company'],
                    apply_url=job_data['apply_url']
                ).first()
                
                if existing_job:
                    # Update existing job
                    for field, value in job_data.items():
                        if hasattr(existing_job, field):
                            setattr(existing_job, field, value)
                    existing_job.save()
                    stats['updated'] += 1
                else:
                    # Create new job
                    AggregatedJob.objects.create(**job_data)
                    stats['created'] += 1
                
                stats[source] += 1
                stats['total'] += 1
            
            logger.info(f"Job sync completed: {stats}")
            return stats
            
        except Exception as e:
            logger.error(f"Error syncing jobs to database: {e}")
            return stats


class JobSearchService:
    """Service for searching and filtering jobs"""
    
    def search_jobs(self, query: str = None, company: str = None, 
                   source: str = None, location: str = None,
                   page: int = 1, page_size: int = 20) -> Dict:
        """Search jobs with filters and pagination"""
        try:
            queryset = AggregatedJob.objects.filter(is_active=True)
            
            # Apply filters
            if query:
                queryset = queryset.filter(
                    models.Q(title__icontains=query) |
                    models.Q(description__icontains=query)
                )
            
            if company:
                queryset = queryset.filter(company__icontains=company)
            
            if source:
                queryset = queryset.filter(source=source)
            
            if location:
                queryset = queryset.filter(location__icontains=location)
            
            # Get total count
            total_count = queryset.count()
            
            # Apply pagination
            offset = (page - 1) * page_size
            jobs = queryset[offset:offset + page_size]
            
            # Serialize jobs
            job_list = []
            for job in jobs:
                job_list.append({
                    'id': job.id,
                    'title': job.title,
                    'company': job.company,
                    'location': job.location,
                    'apply_url': job.apply_url,
                    'description': job.description,
                    'source': job.source,
                    'salary': job.salary,
                    'job_type': job.job_type,
                    'remote_type': job.remote_type,
                    'created_at': job.created_at.isoformat(),
                })
            
            return {
                'count': total_count,
                'results': job_list,
                'page': page,
                'page_size': page_size,
                'total_pages': (total_count + page_size - 1) // page_size,
            }
            
        except Exception as e:
            logger.error(f"Error searching jobs: {e}")
            return {
                'count': 0,
                'results': [],
                'page': page,
                'page_size': page_size,
                'total_pages': 0,
            }
