from django.urls import path
from . import views

urlpatterns = [
    path('chat-sessions/', views.user_sessions, name='chatbot_sessions'),
    path('chat-sessions/create/', views.create_chat_session, name='create_chat_session'),
    path('chat-sessions/<str:session_id>/', views.chat_message, name='chat_message'),
    path('chat-sessions/<str:session_id>/history/', views.chat_history, name='chat_history'),
    path('chat-sessions/<str:session_id>/delete/', views.delete_session, name='delete_chat_session'),
]
