from django.urls import path
from .assessment_views import AssessmentGenerateView, AssessmentSubmitView

urlpatterns = [
    path('assessment/generate/', AssessmentGenerateView.as_view(), name='assessment_generate'),
    path('assessment/submit/',   AssessmentSubmitView.as_view(),   name='assessment_submit'),
]
