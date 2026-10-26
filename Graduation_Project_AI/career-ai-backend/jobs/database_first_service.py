"""
Database-first job search service - always returns database results first
"""
import logging
from typing import List, Dict, Optional
from django.db.models import Q
from django.core.cache import cache
from .models import AggregatedJob

logger = logging.getLogger(__name__)


class DatabaseFirstJobService:
    """Job service that prioritizes database results over external APIs"""
    
    def __init__(self):
        self.cache_timeout = 1800  # 30 minutes
        
    def search_jobs(self, query: str = None, company: str = None, 
                   source: str = None, location: str = None,
                   page: int = 1, page_size: int = 20) -> Dict:
        """
        Search jobs from database only - no external API calls
        This ensures all job responses come from database first
        """
        try:
            # Always query database first
            queryset = AggregatedJob.objects.filter(is_active=True)
            
            # Apply filters
            if query:
                queryset = queryset.filter(
                    Q(title__icontains=query) |
                    Q(description__icontains=query) |
                    Q(company__icontains=query)
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
            
            # Serialize jobs with required fields
            job_list = []
            for job in jobs:
                job_list.append({
                    'id': job.id,
                    'title': job.title,
                    'company': job.company,
                    'location': job.location,
                    'description': job.description,
                    'salary': job.salary,
                    'apply_url': job.apply_url,
                    'source': job.source,
                    'created_at': job.created_at.isoformat(),
                })
            
            return {
                'count': total_count,
                'results': job_list,
                'page': page,
                'page_size': page_size,
                'total_pages': (total_count + page_size - 1) // page_size,
                'source': 'database',
                'message': 'Results from permanent database storage'
            }
            
        except Exception as e:
            logger.error(f"Error searching jobs from database: {e}")
            return {
                'count': 0,
                'results': [],
                'page': page,
                'page_size': page_size,
                'total_pages': 0,
                'source': 'database_error',
                'error': 'Database search failed'
            }
    
    def get_job_by_id(self, job_id: int) -> Optional[Dict]:
        """Get a specific job by ID from database"""
        try:
            job = AggregatedJob.objects.filter(id=job_id, is_active=True).first()
            if not job:
                return None
                
            return {
                'id': job.id,
                'title': job.title,
                'company': job.company,
                'location': job.location,
                'description': job.description,
                'salary': job.salary,
                'apply_url': job.apply_url,
                'source': job.source,
                'created_at': job.created_at.isoformat(),
            }
            
        except Exception as e:
            logger.error(f"Error getting job {job_id} from database: {e}")
            return None
    
    def get_recent_jobs(self, limit: int = 20) -> Dict:
        """Get most recent jobs from database"""
        try:
            jobs = AggregatedJob.objects.filter(is_active=True).order_by('-created_at')[:limit]
            
            job_list = []
            for job in jobs:
                job_list.append({
                    'id': job.id,
                    'title': job.title,
                    'company': job.company,
                    'location': job.location,
                    'description': job.description,
                    'salary': job.salary,
                    'apply_url': job.apply_url,
                    'source': job.source,
                    'created_at': job.created_at.isoformat(),
                })
            
            return {
                'count': len(job_list),
                'results': job_list,
                'source': 'database',
                'message': 'Recent jobs from permanent database storage'
            }
            
        except Exception as e:
            logger.error(f"Error getting recent jobs from database: {e}")
            return {
                'count': 0,
                'results': [],
                'source': 'database_error',
                'error': 'Failed to get recent jobs'
            }
    
    def get_jobs_by_source(self, source: str, limit: int = 20) -> Dict:
        """Get jobs from a specific source"""
        try:
            jobs = AggregatedJob.objects.filter(
                is_active=True, 
                source=source
            ).order_by('-created_at')[:limit]
            
            job_list = []
            for job in jobs:
                job_list.append({
                    'id': job.id,
                    'title': job.title,
                    'company': job.company,
                    'location': job.location,
                    'description': job.description,
                    'salary': job.salary,
                    'apply_url': job.apply_url,
                    'source': job.source,
                    'created_at': job.created_at.isoformat(),
                })
            
            return {
                'count': len(job_list),
                'results': job_list,
                'source': 'database',
                'message': f'Jobs from {source} in permanent database storage'
            }
            
        except Exception as e:
            logger.error(f"Error getting jobs from source {source}: {e}")
            return {
                'count': 0,
                'results': [],
                'source': 'database_error',
                'error': f'Failed to get jobs from {source}'
            }
    
    def get_database_statistics(self) -> Dict:
        """Get database job statistics"""
        try:
            from django.db.models import Count
            
            # Total jobs
            total_jobs = AggregatedJob.objects.filter(is_active=True).count()
            
            # Jobs by source
            jobs_by_source = AggregatedJob.objects.filter(is_active=True).values('source').annotate(
                count=Count('id')
            ).order_by('-count')
            
            # Jobs by location (top 10)
            jobs_by_location = AggregatedJob.objects.filter(is_active=True).values('location').annotate(
                count=Count('id')
            ).order_by('-count')[:10]
            
            # Recent jobs (last 24 hours)
            from django.utils import timezone
            from datetime import timedelta
            yesterday = timezone.now() - timedelta(days=1)
            recent_jobs = AggregatedJob.objects.filter(
                is_active=True,
                created_at__gte=yesterday
            ).count()
            
            return {
                'total_jobs': total_jobs,
                'recent_jobs_24h': recent_jobs,
                'jobs_by_source': list(jobs_by_source),
                'top_locations': list(jobs_by_location),
                'source': 'database',
                'message': 'Statistics from permanent database storage'
            }
            
        except Exception as e:
            logger.error(f"Error getting database statistics: {e}")
            return {
                'total_jobs': 0,
                'recent_jobs_24h': 0,
                'jobs_by_source': [],
                'top_locations': [],
                'source': 'database_error',
                'error': 'Failed to get statistics'
            }
