from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.generics import ListAPIView
from rest_framework.pagination import PageNumberPagination
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from .models import JobListing
from .serializers import JobListingSerializer, JobSearchSerializer


class JobPagination(PageNumberPagination):
    """Custom pagination for job listings"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class JobSearchView(ListAPIView):
    """Search jobs with filters"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = JobListingSerializer
    pagination_class = JobPagination
    queryset = JobListing.objects.all()

    @swagger_auto_schema(
        operation_description="Search jobs with filters",
        manual_parameters=[
            openapi.Parameter(
                'keyword',
                openapi.IN_QUERY,
                description="Search keyword for job titles or descriptions",
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
                'salary_min',
                openapi.IN_QUERY,
                description="Minimum salary filter",
                type=openapi.TYPE_INTEGER,
                required=False
            ),
            openapi.Parameter(
                'job_type',
                openapi.IN_QUERY,
                description="Job type filter (full-time, part-time, contract)",
                type=openapi.TYPE_STRING,
                required=False
            )
        ],
        responses={
            200: JobListingSerializer(many=True),
            401: "Unauthorized"
        }
    )
    def get_queryset(self):
        queryset = JobListing.objects.all()
        
        # Apply filters
        keyword = self.request.query_params.get('keyword', '')
        if keyword:
            queryset = queryset.filter(
                title__icontains=keyword
            ).distinct()
        
        location = self.request.query_params.get('location', '')
        if location:
            queryset = queryset.filter(
                location__icontains=location
            )
        
        salary_min = self.request.query_params.get('salary_min')
        if salary_min:
            try:
                salary_min = int(salary_min)
                queryset = queryset.filter(
                    salary_min__gte=salary_min
                )
            except ValueError:
                pass
        
        job_type = self.request.query_params.get('job_type', '')
        if job_type:
            queryset = queryset.filter(
                job_type__iexact=job_type
            )
        
        return queryset


class JobListView(ListAPIView):
    """Get all job listings with pagination"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = JobListingSerializer
    pagination_class = JobPagination
    queryset = JobListing.objects.all()

    @swagger_auto_schema(
        operation_description="Get all job listings with pagination",
        manual_parameters=[
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
                description="Number of items per page",
                type=openapi.TYPE_INTEGER,
                required=False
            )
        ],
        responses={
            200: JobListingSerializer(many=True),
            401: "Unauthorized"
        }
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
