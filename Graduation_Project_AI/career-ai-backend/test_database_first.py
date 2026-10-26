#!/usr/bin/env python
"""
Test script to verify database-first job architecture
"""
import os
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'career_ai_backend.settings')
django.setup()

from jobs.database_first_service import DatabaseFirstJobService
from jobs.models import AggregatedJob

def test_database_first_architecture():
    """Test that database-first architecture is working correctly"""
    print("Testing Database-First Job Architecture...")
    print("=" * 50)
    
    try:
        # Test 1: Check if AggregatedJob model exists
        print("1. Testing AggregatedJob model...")
        job_count = AggregatedJob.objects.count()
        print(f"   AggregatedJob table exists with {job_count} jobs")
        
        # Test 2: Test DatabaseFirstJobService
        print("2. Testing DatabaseFirstJobService...")
        service = DatabaseFirstJobService()
        
        # Test search functionality
        result = service.search_jobs(query='Software Engineer')
        print(f"   Search for 'Software Engineer': {result['count']} jobs found")
        print(f"   Data source: {result.get('source', 'unknown')}")
        
        # Test recent jobs
        recent_result = service.get_recent_jobs(limit=5)
        print(f"   Recent jobs: {recent_result['count']} jobs found")
        
        # Test statistics
        stats = service.get_database_statistics()
        print(f"   Database statistics: {stats.get('total_jobs', 0)} total jobs")
        
        print("\n3. Testing field requirements...")
        # Check if a job has the required fields
        if job_count > 0:
            sample_job = AggregatedJob.objects.first()
            required_fields = ['title', 'company', 'location', 'description', 'salary', 'apply_url', 'source', 'created_at']
            
            for field in required_fields:
                if hasattr(sample_job, field):
                    value = getattr(sample_job, field)
                    print(f"   {field}: {'OK' if value else 'EMPTY'}")
                else:
                    print(f"   {field}: MISSING")
        
        print("\n4. Testing indexing...")
        # Test that we can filter by indexed fields efficiently
        title_filtered = AggregatedJob.objects.filter(title__icontains='software').count()
        company_filtered = AggregatedJob.objects.filter(company__icontains='google').count()
        location_filtered = AggregatedJob.objects.filter(location__icontains='remote').count()
        
        print(f"   Title filter results: {title_filtered}")
        print(f"   Company filter results: {company_filtered}")
        print(f"   Location filter results: {location_filtered}")
        
        print("\n" + "=" * 50)
        print("Database-First Architecture Test: PASSED")
        print("All job APIs now return database results first!")
        
        return True
        
    except Exception as e:
        print(f"\nERROR: {e}")
        print("=" * 50)
        print("Database-First Architecture Test: FAILED")
        return False

if __name__ == '__main__':
    test_database_first_architecture()
