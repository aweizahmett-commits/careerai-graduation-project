"""career_ai_backend URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.shortcuts import redirect
from django.http import JsonResponse
from datetime import datetime
from simple_views import health_check, simple_job_search

def home(request):
    return JsonResponse({'message': 'Career AI Connected Backend is Running'})

urlpatterns = [
    path('', home),
    path('admin/', admin.site.urls),
    
    # Simple job search endpoint without REST Framework
    path('api/search/', simple_job_search, name='simple_job_search'),
    
    # Health check endpoint
    path('api/health/', health_check, name='health_check'),
    
    # Users endpoints (authentication, registration, profile)
    path('api/', include('users.urls')),
    
    # Career pipeline endpoints
    path('api/', include('jobs.career_urls')),
    
    # Mock Interview & Career Library
    path('api/', include('careers.urls')),
    
    # Assessment pipeline  →  /api/assessment/generate/  &  /api/assessment/submit/
    path('api/', include('jobs.assessment_urls')),

    # Jobs endpoints
    path('api/jobs/', include('jobs.urls')),

    # Community endpoints
    path('api/', include('community.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
