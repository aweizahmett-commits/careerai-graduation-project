"""
URL configuration for robust Job Search API
"""

from django.urls import path
from . import job_search_views

app_name = 'job_search'

urlpatterns = [
    # Main job search endpoint
    path('search/', job_search_views.search_jobs, name='search_jobs'),
    
    # Preload popular searches
    path('preload/', job_search_views.preload_jobs, name='preload_jobs'),
    
    # Health check
    path('health/', job_search_views.job_search_health, name='job_search_health'),
]
