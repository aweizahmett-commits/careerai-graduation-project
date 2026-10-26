from django.urls import path
from .views import (
    CareerQuestionsView, 
    QuestionnaireAnswerView, 
    CareerListView,
    CareerDetailView,
    SavedCareerListView,
    SaveCareerView,
    UnsaveCareerView
)
from .interview_views import (
    InterviewSessionListView,
    InterviewSessionDetailView,
    SubmitAnswerView,
    CompleteSessionView,
    SavedAnswerListView,
    TranscribeAudioView,
)

urlpatterns = [
    path('career_questions/', CareerQuestionsView.as_view(), name='career_questions'),
    path('questionnaire/answer/', QuestionnaireAnswerView.as_view(), name='questionnaire_answer'),
    
    # Career Library endpoints
    path('careers/', CareerListView.as_view(), name='career_list'),
    path('careers/<int:pk>/', CareerDetailView.as_view(), name='career_detail'),
    
    # Saved Careers endpoints
    path('saved_careers/', SavedCareerListView.as_view(), name='saved_career_list'),
    path('saved_careers/save/', SaveCareerView.as_view(), name='save_career'),
    path('saved_careers/<int:id>/', UnsaveCareerView.as_view(), name='unsave_career'),

    # Mock Interview endpoints
    path('interview/sessions/', InterviewSessionListView.as_view(), name='interview_sessions'),
    path('interview/sessions/<str:session_id>/', InterviewSessionDetailView.as_view(), name='interview_session_detail'),
    path('interview/sessions/<str:session_id>/submit/', SubmitAnswerView.as_view(), name='interview_submit'),
    path('interview/sessions/<str:session_id>/complete/', CompleteSessionView.as_view(), name='interview_complete'),
    path('interview/saved-answers/', SavedAnswerListView.as_view(), name='interview_saved_answers'),
    path('interview/transcribe/', TranscribeAudioView.as_view(), name='interview_transcribe'),
]
