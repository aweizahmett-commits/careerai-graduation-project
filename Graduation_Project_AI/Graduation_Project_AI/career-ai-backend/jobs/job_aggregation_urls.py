"""
URL patterns for job aggregation API
"""
from django.urls import path
from . import job_aggregation_views

urlpatterns = [
    # Job aggregation endpoints
    path('jobs/', job_aggregation_views.get_jobs, name='get_jobs'),
    path('jobs/sync/', job_aggregation_views.sync_jobs, name='sync_jobs'),
    path('jobs/sources/', job_aggregation_views.get_job_sources, name='get_job_sources'),
    path('jobs/statistics/', job_aggregation_views.get_job_statistics, name='get_job_statistics'),
]
