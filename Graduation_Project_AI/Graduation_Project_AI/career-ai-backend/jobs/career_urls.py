from django.urls import path
from . import career_views

app_name = 'career'

urlpatterns = [
    # Resume upload
    path('upload-resume/', career_views.upload_resume, name='upload_resume'),
    
    # Assessment
    path('assessment/submit/', career_views.submit_assessment, name='submit_assessment'),
    
    # Career matches
    path('career-matches/', career_views.get_career_matches, name='get_career_matches'),
    
    # Jobs with career-based filtering
    path('jobs/', career_views.get_filtered_jobs, name='get_filtered_jobs'),
    
    # User progress
    path('progress/', career_views.get_user_progress, name='get_user_progress'),
]
