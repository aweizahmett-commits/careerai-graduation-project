import json
import time
from typing import Any, Optional
from django.core.cache import cache
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class JobCache:
    """Simple caching utility for job data"""
    
    CACHE_TIMEOUT = 30 * 60  # 30 minutes
    SYNC_STATUS_KEY = 'job_sync_status'
    JOB_COUNT_KEY = 'job_count'
    
    @classmethod
    def get_cached_jobs(cls, cache_key: str) -> Optional[Any]:
        """Get cached job data"""
        try:
            return cache.get(cache_key)
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return None
    
    @classmethod
    def cache_jobs(cls, cache_key: str, data: Any, timeout: int = None) -> bool:
        """Cache job data"""
        try:
            timeout = timeout or cls.CACHE_TIMEOUT
            cache.set(cache_key, data, timeout)
            return True
        except Exception as e:
            logger.error(f"Cache set error: {e}")
            return False
    
    @classmethod
    def invalidate_job_cache(cls, pattern: str = None) -> bool:
        """Invalidate job cache entries"""
        try:
            if pattern:
                # Delete all keys matching pattern
                keys = cache.keys(f"*{pattern}*")
                cache.delete_many(keys)
            else:
                # Delete all job-related cache
                keys = cache.keys("job_*")
                cache.delete_many(keys)
            return True
        except Exception as e:
            logger.error(f"Cache invalidation error: {e}")
            return False
    
    @classmethod
    def get_sync_status(cls) -> dict:
        """Get cached sync status"""
        return cls.get_cached_jobs(cls.SYNC_STATUS_KEY) or {
            'last_sync': None,
            'total_jobs': 0,
            'is_syncing': False
        }
    
    @classmethod
    def set_sync_status(cls, status: dict) -> bool:
        """Set sync status"""
        return cls.cache_jobs(cls.SYNC_STATUS_KEY, status, timeout=60)  # 1 minute
    
    @classmethod
    def get_job_count(cls) -> int:
        """Get cached job count"""
        count = cls.get_cached_jobs(cls.JOB_COUNT_KEY)
        return count if count is not None else 0
    
    @classmethod
    def set_job_count(cls, count: int) -> bool:
        """Set job count"""
        return cls.cache_jobs(cls.JOB_COUNT_KEY, count, timeout=5 * 60)  # 5 minutes
    
    @classmethod
    def generate_cache_key(cls, prefix: str, **kwargs) -> str:
        """Generate cache key from parameters"""
        key_parts = [prefix]
        for k, v in sorted(kwargs.items()):
            if v is not None:
                key_parts.append(f"{k}:{v}")
        return "_".join(key_parts)
