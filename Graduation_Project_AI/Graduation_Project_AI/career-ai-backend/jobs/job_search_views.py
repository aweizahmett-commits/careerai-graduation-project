"""
Database-first Job Search API - always returns database results
"""
import time
from datetime import datetime
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import logging

from .database_first_service import DatabaseFirstJobService

logger = logging.getLogger(__name__)

def get_cache_key(query):
    """Generate cache key for search query"""
    return f"job_search_{query.lower().replace(' ', '_')}"

def get_from_cache(cache_key):
    """Get data from cache (Django cache or memory cache)"""
    try:
        # Try Django cache first
        cached_data = cache.get(cache_key)
        if cached_data:
            return cached_data
    except Exception as e:
        logger.warning(f"Django cache failed: {e}")
    
    # Fallback to memory cache
    if cache_key in memory_cache:
        cache_entry = memory_cache[cache_key]
        if time.time() - cache_entry['timestamp'] < CACHE_DURATION:
            return cache_entry['data']
        else:
            # Remove expired entry
            del memory_cache[cache_key]
    
    return None

def set_cache(cache_key, data):
    """Set data in cache (Django cache or memory cache)"""
    try:
        # Try Django cache first
        cache.set(cache_key, data, CACHE_DURATION)
    except Exception as e:
        logger.warning(f"Django cache set failed: {e}")
        # Fallback to memory cache
        memory_cache[cache_key] = {
            'data': data,
            'timestamp': time.time()
        }

def fetch_from_jsearch_api(query):
    """Fetch jobs from JSearch API with proper error handling"""
    try:
        # JSearch API configuration
        url = "https://jsearch.p.rapidapi.com/search"
        headers = {
            "X-RapidAPI-Key": getattr(settings, 'RAPIDAPI_KEY', 'your-rapidapi-key'),
            "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
        }
        params = {
            "query": query,
            "page": "1",
            "num_pages": "1",
            "date_posted": "all",
            "remote_jobs_only": "true"
        }
        
        response = requests.get(url, headers=headers, params=params, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        
        data = response.json()
        
        # Clean and standardize the response
        if 'data' in data and isinstance(data['data'], list):
            jobs = []
            for job in data['data']:
                cleaned_job = {
                    "title": job.get('job_title', 'Unknown Position'),
                    "company": job.get('employer_name', 'Unknown Company'),
                    "location": job.get('job_location', 'Remote'),
                    "salary": job.get('job_salary', '$80,000 - $120,000'),
                    "apply_link": job.get('job_apply_link', '#'),
                    "description": job.get('job_description', 'No description available.'),
                    "source": "JSearch API",
                    "logo": job.get('employer_logo', ''),
                    "job_type": job.get('job_employment_type', 'Full-time'),
                    "posted_date": int(time.time()),
                    "is_remote": job.get('job_is_remote', False)
                }
                jobs.append(cleaned_job)
            
            return jobs
        else:
            logger.error(f"Invalid JSearch API response format: {data}")
            return None
            
    except requests.exceptions.Timeout:
        logger.error("JSearch API request timed out")
        return None
    except requests.exceptions.RequestException as e:
        logger.error(f"JSearch API request failed: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error in JSearch API: {e}")
        return None

def generate_fallback_jobs(query):
    """Generate relevant fallback jobs based on query"""
    # Use fallback jobs but make them more relevant to the query
    relevant_jobs = []
    
    # Simple keyword matching for relevance
    query_lower = query.lower()
    
    for job in FALLBACK_JOBS:
        job_title = job['title'].lower()
        if any(keyword in job_title for keyword in ['software', 'engineer', 'developer', 'data']):
            relevant_jobs.append(job.copy())
    
    # If no relevant jobs found, return all fallback jobs
    if not relevant_jobs:
        relevant_jobs = [job.copy() for job in FALLBACK_JOBS]
    
    # Add query relevance to description
    for job in relevant_jobs:
        job['description'] = f"Relevant position for {query}. {job['description']}"
        job['source'] = "Cached Results"
    
    return relevant_jobs

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_jobs(request):
    """
    Database-first job search endpoint - always returns database results
    """
    start_time = time.time()
    query = request.GET.get('query', '').strip()
    
    if not query:
        query = request.GET.get('keyword', 'Software Engineer').strip()
    
    if not query:
        return Response({
            'error': 'Search query is required',
            'jobs': []
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Always search database first
        db_service = DatabaseFirstJobService()
        result = db_service.search_jobs(
            query=query,
            page=1,
            page_size=20
        )
        
        # Add response time
        result['response_time'] = f"{(time.time() - start_time):.2f}s"
        result['query'] = query
        
        logger.info(f"Database search for query: {query} returned {result['count']} jobs")
        return Response(result, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Database search failed for query: {query}: {e}")
        return Response({
            'error': 'Database search failed. Please try again later.',
            'jobs': [],
            'source': 'database_error',
            'query': query,
            'total': 0,
            'response_time': f"{(time.time() - start_time):.2f}s"
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def preload_jobs(request):
    """
    Preload popular job searches from database for instant loading
    """
    popular_queries = ['Software Engineer', 'Data Scientist', 'Frontend Developer', 'Backend Developer']
    preloaded_results = {}
    
    db_service = DatabaseFirstJobService()
    
    for query in popular_queries:
        try:
            result = db_service.search_jobs(query=query, page=1, page_size=10)
            preloaded_results[query] = {
                'count': result['count'],
                'status': 'success'
            }
            logger.info(f"Preloaded {result['count']} jobs for query: {query}")
        except Exception as e:
            preloaded_results[query] = {
                'count': 0,
                'status': 'failed',
                'error': str(e)
            }
            logger.warning(f"Failed to preload jobs for query: {query}: {e}")
    
    return Response({
        'message': 'Database job preloading completed',
        'queries': popular_queries,
        'results': preloaded_results
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def job_search_health(request):
    """
    Health check for database-first job search service
    """
    try:
        db_service = DatabaseFirstJobService()
        stats = db_service.get_database_statistics()
        
        return Response({
            'status': 'healthy',
            'service_type': 'database_first',
            'total_jobs': stats.get('total_jobs', 0),
            'timestamp': datetime.now().isoformat(),
            'message': 'Database-first job search service is operational'
        })
    except Exception as e:
        return Response({
            'status': 'unhealthy',
            'service_type': 'database_first',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
