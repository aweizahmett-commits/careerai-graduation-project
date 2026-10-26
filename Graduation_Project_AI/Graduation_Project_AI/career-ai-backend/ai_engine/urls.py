from django.urls import path
from .views import ResumeUploadView, AIRecommendationsView

urlpatterns = [
    path('upload_resume/', ResumeUploadView.as_view(), name='upload_resume'),
    path('ai_recommendations/', AIRecommendationsView.as_view(), name='ai_recommendations'),
]
