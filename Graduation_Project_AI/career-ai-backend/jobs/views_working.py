import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)

class JobListView(APIView):
    """
    Minimal API endpoint to test basic functionality
    GET /api/jobs/
    """
    permission_classes = []  # Allow public access
    
    def get(self, request):
        """Test endpoint with parameter parsing"""
        try:
            # Test parameter parsing
            if hasattr(request, 'query_params'):
                search = request.query_params.get('search', '').strip()
                job_role = request.query_params.get('job_role', '').strip()
                company = request.query_params.get('company', '').strip()
                location = request.query_params.get('location', '').strip()
                skills = request.query_params.get('skills', '').strip()
                source = request.query_params.get('source', '').strip()
            else:
                search = request.GET.get('search', '').strip()
                job_role = request.GET.get('job_role', '').strip()
                company = request.GET.get('company', '').strip()
                location = request.GET.get('location', '').strip()
                skills = request.GET.get('skills', '').strip()
                source = request.GET.get('source', '').strip()
            
            logger.info(f"Parameters parsed successfully: search='{search}', company='{company}'")
            
            # Test database query
            from jobs.models import AggregatedJob
            queryset = AggregatedJob.objects.filter(is_active=True)
            total_count = queryset.count()
            
            logger.info(f"Database query successful: {total_count} jobs found")
            
            # Test production quality service
            from .services.production_quality import ProductionQualityService
            quality_service = ProductionQualityService()
            
            # Test get_production_quality_jobs method
            quality_jobs = quality_service.get_production_quality_jobs(
                search_query=search,
                skills=skills,
                location=location,
                recent_only=False
            )
            
            logger.info(f"Production quality service successful: {len(quality_jobs)} jobs")
            
            # Test pagination
            from .generic_views import JobPagination
            paginator = JobPagination()
            paginated_queryset = paginator.paginate_queryset(quality_jobs, request)
            
            # Test serializer with paginated jobs
            from jobs.serializers import AggregatedJobSerializer
            serializer = AggregatedJobSerializer(paginated_queryset, many=True)
            
            logger.info(f"Pagination successful: {len(serializer.data)} jobs paginated")
            
            # Test the actual paginated response
            response = paginator.get_paginated_response(serializer.data)
            
            logger.info(f"Full API response successful")
            
            return response
        except Exception as e:
            logger.error(f"Error in JobListView with parameters: {str(e)}")
            return Response({
                'error': 'Failed to fetch jobs',
                'details': str(e),
                'test': False
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
