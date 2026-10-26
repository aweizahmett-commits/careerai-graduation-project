from django.urls import path
from .views import JobListView
from .api_views import (
    TestView, ResumeUploadView, ResumeAnalysisView, JobRecommendationsView, PublicJobPostsView,
    JobApplicationViewSet, EmployerJobManagementView, EmployerApplicationsView
)
from .assessment_views import AssessmentGenerateView, AssessmentSubmitView

urlpatterns = [
    # Test endpoint
    path('test/', TestView.as_view(), name='test'),

    # Legacy endpoints
    path('search/', JobListView.as_view(), name='job_search'),
    path('jobs/', JobListView.as_view(), name='job_list'),

    # Resume Upload (simple)
    path('upload/', ResumeUploadView.as_view(), name='resume_upload'),

    # Resume Analysis — full AI analysis (primary_field, recommended_jobs, etc.)
    path('resume/analyze/', ResumeAnalysisView.as_view(), name='resume_analyze'),

    # Assessment pipeline
    path('assessment/generate/', AssessmentGenerateView.as_view(), name='assessment_generate'),
    path('assessment/submit/',   AssessmentSubmitView.as_view(),   name='assessment_submit'),
    
    # AI Job Matching
    path('recommendations/', JobRecommendationsView.as_view(), name='job_recommendations'),
    
    # Public Job Posts (for students)
    path('public/active/', PublicJobPostsView.as_view(), name='public_job_posts'),
    
    # Job Application Management
    path('job-applications/', JobApplicationViewSet.as_view(), name='job_applications'),
    path('job-applications/my-applications/', JobApplicationViewSet.as_view(), name='my_applications'),
    
    # Employer Job Management
    path('create/', EmployerJobManagementView.as_view(), name='employer_job_create'),
    path('my-jobs/', EmployerJobManagementView.as_view(), name='employer_my_jobs'),
    path('<int:pk>/', EmployerJobManagementView.as_view(), name='employer_job_detail'),
    
    # Employer Applications
    path('job-applications/employer/', EmployerApplicationsView.as_view(), name='employer_applications'),
]
