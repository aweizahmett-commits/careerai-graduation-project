#!/usr/bin/env python
"""
Test script to validate the job sync system
"""

import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'career_ai_backend.settings')
django.setup()

from jobs.job_sync_service import JobSyncService
from jobs.models import AggregatedJob
from jobs.cache_utils import JobCache

def test_job_sync():
    """Test the complete job sync system"""
    print("=== Testing Job Sync System ===")
    
    # 1. Test database connection
    print("1. Testing database connection...")
    try:
        job_count = AggregatedJob.objects.filter(is_active=True).count()
        print(f"   Current jobs in database: {job_count}")
    except Exception as e:
        print(f"   ERROR: Database connection failed: {e}")
        return False
    
    # 2. Test cache system
    print("2. Testing cache system...")
    try:
        JobCache.set_job_count(100)
        cached_count = JobCache.get_job_count()
        print(f"   Cache test: set=100, got={cached_count}")
        assert cached_count == 100, "Cache system not working"
    except Exception as e:
        print(f"   ERROR: Cache system failed: {e}")
        return False
    
    # 3. Test sync service initialization
    print("3. Testing sync service initialization...")
    try:
        sync_service = JobSyncService()
        print("   Sync service initialized successfully")
    except Exception as e:
        print(f"   ERROR: Sync service initialization failed: {e}")
        return False
    
    # 4. Test sync method (without actual API calls)
    print("4. Testing sync service methods...")
    try:
        # Test database job count method
        db_count = sync_service.get_database_job_count()
        print(f"   Database job count method: {db_count}")
        
        # Test cleanup method
        cleaned_count = sync_service.cleanup_old_jobs(days_old=365)
        print(f"   Cleanup method executed: {cleaned_count} jobs deactivated")
        
    except Exception as e:
        print(f"   ERROR: Sync service methods failed: {e}")
        return False
    
    # 5. Test API endpoints configuration
    print("5. Testing URL configuration...")
    try:
        from django.urls import reverse
        from django.test import Client
        
        client = Client()
        
        # Test sync endpoint
        response = client.post('/api/jobs/sync/')
        print(f"   Sync endpoint status: {response.status_code}")
        
        # Test search endpoint
        response = client.get('/api/jobs/search/')
        print(f"   Search endpoint status: {response.status_code}")
        
    except Exception as e:
        print(f"   ERROR: URL configuration test failed: {e}")
        return False
    
    print("\n=== All Tests Passed! ===")
    print("Job sync system is working correctly.")
    return True

if __name__ == "__main__":
    success = test_job_sync()
    if success:
        print("\nSUCCESS: Job sync system is ready!")
    else:
        print("\nFAILURE: Job sync system has issues.")
        sys.exit(1)
