import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.db.models import Q

logger = logging.getLogger(__name__)

# Import the correct pagination class
from .generic_views import JobPagination
from .models import AggregatedJob
from .serializers import AggregatedJobSerializer


class JobListView(APIView):
    """
    Enhanced API endpoint to list aggregated jobs from external APIs
    GET /api/jobs/
    """
    permission_classes = []  # Allow public access
    
    @swagger_auto_schema(
        operation_description="List jobs from external APIs with enhanced search and filtering",
        operation_summary="List aggregated jobs",
        tags=["Job Listings"],
        manual_parameters=[
            openapi.Parameter(
                'search',
                openapi.IN_QUERY,
                description="Search keyword for job title, company, or description",
                type=openapi.TYPE_STRING,
                required=False
            ),
            openapi.Parameter(
                'job_role',
                openapi.IN_QUERY,
                description="Filter by job role (search in title)",
                type=openapi.TYPE_STRING,
                required=False
            ),
            openapi.Parameter(
                'company',
                openapi.IN_QUERY,
                description="Filter by company name",
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
                'skills',
                openapi.IN_QUERY,
                description="Filter by skills (search in description)",
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
                'page',
                openapi.IN_QUERY,
                description="Page number for pagination",
                type=openapi.TYPE_INTEGER,
                required=False
            ),
            openapi.Parameter(
                'page_size',
                openapi.IN_QUERY,
                description="Number of results per page",
                type=openapi.TYPE_INTEGER,
                required=False
            ),
        ],
        responses={
            200: AggregatedJobSerializer(many=True),
            400: "Bad request",
            500: "Server error"
        }
    )
    def get(self, request):
        try:
            # Get query parameters - handle both DRF and regular Django requests
            if hasattr(request, 'query_params'):
                # DRF request
                search = request.query_params.get('search', '').strip()
                job_role = request.query_params.get('job_role', '').strip()
                company = request.query_params.get('company', '').strip()
                location = request.query_params.get('location', '').strip()
                skills = request.query_params.get('skills', '').strip()
                source = request.query_params.get('source', '').strip()
            else:
                # Regular Django request
                search = request.GET.get('search', '').strip()
                job_role = request.GET.get('job_role', '').strip()
                company = request.GET.get('company', '').strip()
                location = request.GET.get('location', '').strip()
                skills = request.GET.get('skills', '').strip()
                source = request.GET.get('source', '').strip()
            
            logger.info(f"Job search request - search: '{search}', job_role: '{job_role}', company: '{company}', location: '{location}', skills: '{skills}', source: '{source}'")
            
            # Initialize has_filters
            has_filters = bool(search or job_role or company or location or skills or source)
            
            # Use production quality service for better filtering and scoring
            try:
                from .services.production_quality import ProductionQualityService
                
                quality_service = ProductionQualityService()
                
                # Check if recent_only filter is requested
                recent_only = False
                if hasattr(request, 'query_params'):
                    recent_only = request.query_params.get('recent_only', '').lower() == 'true'
                else:
                    recent_only = request.GET.get('recent_only', '').lower() == 'true'
                
                # Get production quality jobs with all filters and scoring
                queryset = quality_service.get_production_quality_jobs(
                    search_query=search,
                    skills=skills,
                    location=location,
                    recent_only=recent_only
                )
                
                logger.info(f"Using production quality service with {len(queryset)} jobs")
                
            except Exception as quality_error:
                logger.warning(f"Production quality service failed: {str(quality_error)}")
                # Fallback to original logic
                queryset = AggregatedJob.objects.filter(is_active=True)
                
                # Apply filters
                if search:
                    queryset = queryset.filter(
                        Q(title__icontains=search) |
                        Q(description__icontains=search) |
                        Q(company__icontains=search)
                    )
                
                if job_role:
                    queryset = queryset.filter(title__icontains=job_role)
                
                if company:
                    queryset = queryset.filter(company__icontains=company)
                
                if location:
                    queryset = queryset.filter(location__icontains=location)
                
                if skills:
                    queryset = queryset.filter(description__icontains=skills)
                
                if source:
                    queryset = queryset.filter(source__iexact=source)
                
                # Order by most recent
                queryset = queryset.order_by('-created_at')
                
                logger.info(f"Using fallback logic with {len(queryset)} jobs")
            
            # Get count before pagination
            total_count = queryset.count()
            logger.info(f"Found {total_count} jobs matching filters")
            
            # Apply pagination - FIXED: Use correct import path
            paginator = JobPagination()
            paginated_queryset = paginator.paginate_queryset(queryset, request)
            
            # Serialize data
            serializer = AggregatedJobSerializer(paginated_queryset, many=True)
            
            # Check if we have results
            if not serializer.data and has_filters:
                logger.info("No jobs found with exact match, trying keyword splitting")
                
                # Try keyword splitting fallback
                keyword_fallback_results = self._try_keyword_fallback(search, skills, job_role, company, location, source)
                
                if keyword_fallback_results:
                    logger.info(f"Keyword fallback returned {len(keyword_fallback_results)} jobs")
                    fallback_serializer = AggregatedJobSerializer(keyword_fallback_results, many=True)
                    
                    response_data = {
                        'count': len(keyword_fallback_results),
                        'next': None,
                        'previous': None,
                        'results': fallback_serializer.data,
                        'message': 'Showing similar opportunities',
                        'fallback': True,
                        'fallback_type': 'keyword_splitting'
                    }
                    
                    return Response(response_data)
                
                logger.info("No results from keyword splitting, trying random jobs")
                
                # Final fallback: return random 20 jobs
                random_fallback_results = self._get_random_jobs(20)
                
                if random_fallback_results:
                    logger.info(f"Random fallback returned {len(random_fallback_results)} jobs")
                    fallback_serializer = AggregatedJobSerializer(random_fallback_results, many=True)
                    
                    response_data = {
                        'count': len(random_fallback_results),
                        'next': None,
                        'previous': None,
                        'results': fallback_serializer.data,
                        'message': 'Showing similar opportunities',
                        'fallback': True,
                        'fallback_type': 'random_selection'
                    }
                    
                    return Response(response_data)
            
            # Return successful response
            return paginator.get_paginated_response(serializer.data)
            
        except Exception as e:
            logger.error(f"Unexpected error in JobListView: {str(e)}")
            return Response({
                'error': 'Failed to fetch jobs',
                'details': str(e),
                'results': [],
                'count': 0,
                'fallback': True,
                'fallback_type': 'error_fallback'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _try_keyword_fallback(self, search, skills, job_role, company, location, source):
        """Try keyword splitting fallback for better search results"""
        try:
            queryset = AggregatedJob.objects.filter(is_active=True)
            
            # Split search terms and try individual matches
            if search:
                search_terms = search.split()
                for term in search_terms:
                    if len(term) > 2:
                        queryset = queryset.filter(
                            Q(title__icontains=term) |
                            Q(description__icontains=term) |
                            Q(company__icontains=term)
                        )
            
            if job_role:
                queryset = queryset.filter(title__icontains=job_role)
            
            if company:
                queryset = queryset.filter(company__icontains=company)
            
            if location:
                queryset = queryset.filter(location__icontains=location)
            
            if skills:
                queryset = queryset.filter(description__icontains=skills)
            
            if source:
                queryset = queryset.filter(source__iexact=source)
            
            return list(queryset.order_by('-created_at')[:20])
            
        except Exception as e:
            logger.error(f"Error in keyword fallback: {str(e)}")
            return []
    
    def _get_random_jobs(self, count):
        """Get random jobs as fallback"""
        try:
            import random
            
            # Get total count of active jobs
            total_jobs = AggregatedJob.objects.filter(
                is_active=True,
                apply_url__isnull=False
            ).exclude(apply_url='#').count()
            
            if total_jobs == 0:
                logger.warning("No active jobs found for random selection")
                return []
            
            # Calculate random offset
            if total_jobs <= count:
                # If we have fewer jobs than requested, return all
                random_offset = 0
                random_count = total_jobs
            else:
                random_offset = random.randint(0, total_jobs - count)
                random_count = count
            
            logger.info(f"Getting {random_count} random jobs from offset {random_offset}")
            
            # Get random jobs
            random_jobs = list(
                AggregatedJob.objects.filter(
                    is_active=True,
                    apply_url__isnull=False
                ).exclude(apply_url='#')[random_offset:random_offset + random_count]
            )
            
            # Shuffle for randomness
            random.shuffle(random_jobs)
            
            return random_jobs[:count]
            
        except Exception as e:
            logger.error(f"Error getting random jobs: {str(e)}")
            return []
