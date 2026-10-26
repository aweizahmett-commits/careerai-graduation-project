"""
API views for job aggregation system
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import logging

from .database_first_service import DatabaseFirstJobService
from .job_aggregation_services import JobAggregatorService

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_jobs(request):
    """Get all jobs with search and filtering"""
    try:
        # Get query parameters
        query = request.GET.get('search', '').strip()
        company = request.GET.get('company', '').strip()
        source = request.GET.get('source', '').strip()
        location = request.GET.get('location', '').strip()
        
        # Pagination
        page = int(request.GET.get('page', 1))
        page_size = min(int(request.GET.get('page_size', 20)), 100)  # Max 100 per page
        
        # Validate source
        valid_sources = ['JSearch', 'Remotive', 'Arbeitnow']
        if source and source not in valid_sources:
            return Response(
                {'error': f'Invalid source. Valid sources: {valid_sources}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Search jobs from database only
        db_service = DatabaseFirstJobService()
        result = db_service.search_jobs(
            query=query,
            company=company,
            source=source,
            location=location,
            page=page,
            page_size=page_size
        )
        
        return Response(result, status=status.HTTP_200_OK)
        
    except ValueError as e:
        return Response(
            {'error': 'Invalid pagination parameters'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error in get_jobs: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@csrf_exempt
@require_http_methods(["POST"])
@api_view(['POST'])
@permission_classes([AllowAny])
def sync_jobs(request):
    """Sync jobs from external APIs to database"""
    try:
        aggregator = JobAggregatorService()
        stats = aggregator.sync_jobs_to_database()
        
        return Response({
            'message': 'Jobs synced successfully',
            'stats': stats
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in sync_jobs: {e}")
        return Response(
            {'error': 'Failed to sync jobs'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def get_job_sources(request):
    """Get available job sources with counts"""
    try:
        from django.db.models import Count
        from .models import AggregatedJob
        
        sources = AggregatedJob.objects.filter(is_active=True).values('source').annotate(
            count=Count('id')
        ).order_by('-count')
        
        source_data = []
        for source in sources:
            source_data.append({
                'source': source['source'],
                'count': source['count']
            })
        
        return Response({
            'sources': source_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in get_job_sources: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def get_job_statistics(request):
    """Get job statistics from database"""
    try:
        db_service = DatabaseFirstJobService()
        result = db_service.get_database_statistics()
        
        return Response(result, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in get_job_statistics: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
