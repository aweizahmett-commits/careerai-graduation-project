import logging
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from .models import JobListing, AggregatedJob
from .serializers import JobListingSerializer, JobSearchSerializer
from .services.jsearch_service import fetch_jobs
from .job_sync_service import JobSyncService

logger = logging.getLogger(__name__)


class JobPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class JobSearchView(APIView):
    permission_classes = []  # Temporarily remove auth for testing

    @swagger_auto_schema(
        operation_description="Search jobs from database with filters. Returns persistent job listings from multiple sources.",
        operation_summary="Search jobs from database",
        tags=["Job Search"],
        manual_parameters=[
            openapi.Parameter(
                'keyword',
                openapi.IN_QUERY,
                description="Search keyword for job title, description, or requirements",
                type=openapi.TYPE_STRING,
                required=False
            ),
            openapi.Parameter(
                'location',
                openapi.IN_QUERY,
                description="Filter by job location",
                type=openapi.TYPE_STRING,
                required=False
            ),
            openapi.Parameter(
                'source',
                openapi.IN_QUERY,
                description="Filter by job source (jsearch, remotive, arbeitnow)",
                type=openapi.TYPE_STRING,
                required=False
            ),
            openapi.Parameter(
                'page_size',
                openapi.IN_QUERY,
                description="Number of items per page",
                type=openapi.TYPE_INTEGER,
                required=False
            )
        ],
        responses={
            200: openapi.Response(
                description="Successful job search response from database",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'count': openapi.Schema(type=openapi.TYPE_INTEGER, description='Total number of jobs found'),
                        'next': openapi.Schema(type=openapi.TYPE_STRING, description='Next page URL'),
                        'previous': openapi.Schema(type=openapi.TYPE_STRING, description='Previous page URL'),
                        'results': openapi.Schema(
                            type=openapi.TYPE_ARRAY,
                            items=openapi.Schema(
                                type=openapi.TYPE_OBJECT,
                                properties={
                                    'title': openapi.Schema(type=openapi.TYPE_STRING, description='Job title'),
                                    'company': openapi.Schema(type=openapi.TYPE_STRING, description='Company name'),
                                    'location': openapi.Schema(type=openapi.TYPE_STRING, description='Job location'),
                                    'salary': openapi.Schema(type=openapi.TYPE_STRING, description='Salary range'),
                                    'url': openapi.Schema(type=openapi.TYPE_STRING, description='Application link'),
                                    'description': openapi.Schema(type=openapi.TYPE_STRING, description='Job description'),
                                    'source': openapi.Schema(type=openapi.TYPE_STRING, description='Job source'),
                                }
                            )
                        )
                    }
                )
            ),
            400: openapi.Response(description="Bad request - invalid parameters"),
            500: openapi.Response(description="Server error")
        }
    )
    def get(self, request):
        try:
            # Get query parameters
            keyword = request.query_params.get('keyword', '')
            location = request.query_params.get('location', '')
            source = request.query_params.get('source', '')
            page_size = int(request.query_params.get('page_size', 20))
            
            # Check if database has jobs
            job_count = AggregatedJob.objects.filter(is_active=True).count()
            
            # If database is empty, trigger sync and wait for results
            if job_count == 0:
                sync_service = JobSyncService()
                sync_service.sync_all_sources()
                # Wait a moment for jobs to be saved
                import time
                time.sleep(2)
            
            # Build database query
            queryset = AggregatedJob.objects.filter(is_active=True)
            
            # Apply filters
            if keyword:
                queryset = queryset.filter(
                    Q(title__icontains=keyword) | 
                    Q(description__icontains=keyword) |
                    Q(company__icontains=keyword)
                )
            
            if location:
                queryset = queryset.filter(location__icontains=location)
            
            if source:
                queryset = queryset.filter(source=source)
            
            # Order by most recent
            queryset = queryset.order_by('-created_at')
            
            # Apply pagination
            paginator = JobPagination()
            paginated_queryset = paginator.paginate_queryset(queryset, request)
            
            # Format response data
            jobs_data = []
            for job in paginated_queryset:
                jobs_data.append({
                    'title': job.title,
                    'company': job.company,
                    'location': job.location,
                    'salary': job.salary,
                    'url': job.url,
                    'description': job.description,
                    'source': job.source,
                    'job_type': job.job_type,
                    'remote_type': job.remote_type,
                    'posted_date': job.created_at.isoformat()
                })
            
            return paginator.get_paginated_response(jobs_data)
            
        except Exception as e:
            logger.error(f"Error in JobSearchView: {e}")
            # Return empty response with proper structure
            return Response({
                'count': 0,
                'next': None,
                'previous': None,
                'results': []
            })
    
        
    class JobSyncView(APIView):
    """Endpoint to sync jobs from external APIs"""
    permission_classes = []  # Allow anyone to trigger sync for now
    
    @swagger_auto_schema(
        operation_description="Sync jobs from external APIs (JSearch, Remotive, Arbeitnow) into database",
        operation_summary="Sync jobs from external sources",
        tags=["Job Sync"],
        responses={
            200: openapi.Response(
                description="Sync completed successfully",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'total_jobs_added': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'total_jobs_updated': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'sources': openapi.Schema(type=openapi.TYPE_OBJECT)
                    }
                )
            ),
            500: openapi.Response(description="Server error during sync")
        }
    )
    def post(self, request):
        try:
            sync_service = JobSyncService()
            results = sync_service.sync_all_sources()
            
            return Response({
                'message': 'Job sync completed',
                'total_jobs_added': results['total_jobs_added'],
                'total_jobs_updated': results['total_jobs_updated'],
                'sources': results['sources'],
                'total_jobs_in_db': sync_service.get_database_job_count()
            })
            
        except Exception as e:
            logger.error(f"Error during job sync: {e}")
            return Response({
                'error': 'Sync failed',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get(self, request):
        """Get sync status and database statistics"""
        try:
            sync_service = JobSyncService()
            
            # Get job counts by source
            source_counts = {}
            for source in ['jsearch', 'remotive', 'arbeitnow']:
                count = AggregatedJob.objects.filter(source=source, is_active=True).count()
                source_counts[source] = count
            
            return Response({
                'total_jobs_in_db': sync_service.get_database_job_count(),
                'jobs_by_source': source_counts,
                'last_sync': 'Not available'  # TODO: Add last sync timestamp
            })
            
        except Exception as e:
            logger.error(f"Error getting sync status: {e}")
            return Response({
                'error': 'Failed to get status',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
