from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
import logging

from .services import career_ai_chatbot
from .models import ChatSession

logger = logging.getLogger(__name__)


@swagger_auto_schema(
    method='POST',
    operation_description="Create a new chat session",
    tags=["AI Chatbot"],
    responses={
        201: openapi.Response(
            description="Chat session created successfully",
            examples={
                "application/json": {
                    "session_id": "uuid-string",
                    "message": "Chat session created successfully"
                }
            }
        ),
        401: "Unauthorized"
    }
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_chat_session(request):
    """Create a new chat session"""
    try:
        session_id = career_ai_chatbot.create_session(request.user)
        
        return Response({
            'session_id': session_id,
            'message': 'Chat session created successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Error creating chat session: {str(e)}")
        return Response({
            'error': 'Failed to create chat session',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@swagger_auto_schema(
    method='POST',
    operation_description="Send a message to the AI chatbot",
    tags=["AI Chatbot"],
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'message': openapi.Schema(type=openapi.TYPE_STRING, description='User message')
        },
        required=['message']
    ),
    responses={
        200: openapi.Response(
            description="Chatbot response",
            examples={
                "application/json": {
                    "response": "I can help you with your career questions...",
                    "intent": "career_advice",
                    "confidence": 0.85,
                    "suggestions": ["Tell me more", "Analyze my resume"]
                }
            }
        ),
        400: "Bad Request",
        401: "Unauthorized",
        404: "Session not found"
    }
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat_message(request, session_id):
    """Send a message to the chatbot"""
    try:
        message = request.data.get('message')
        if not message:
            return Response({
                'error': 'Message is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        response_data = career_ai_chatbot.process_message(session_id, message)
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except ChatSession.DoesNotExist:
        return Response({
            'error': 'Chat session not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error processing chat message: {str(e)}")
        return Response({
            'error': 'Failed to process message',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@swagger_auto_schema(
    method='GET',
    operation_description="Get chat history for a session",
    tags=["AI Chatbot"],
    responses={
        200: openapi.Response(
            description="Chat history retrieved successfully",
            examples={
                "application/json": {
                    "history": [
                        {
                            "role": "user",
                            "content": "Hello",
                            "timestamp": "2023-01-01T12:00:00Z",
                            "metadata": {}
                        },
                        {
                            "role": "assistant",
                            "content": "Hello! How can I help you today?",
                            "timestamp": "2023-01-01T12:00:01Z",
                            "metadata": {"intent": "greeting"}
                        }
                    ]
                }
            }
        ),
        401: "Unauthorized",
        404: "Session not found"
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def chat_history(request, session_id):
    """Get chat history for a session"""
    try:
        from .models import ChatMessage
        session = ChatSession.objects.get(session_id=session_id, user=request.user, is_active=True)
        messages = ChatMessage.objects.filter(session=session).order_by('created_at')
        
        history = []
        for message in messages:
            history.append({
                'role': message.role,
                'content': message.content,
                'timestamp': message.created_at.isoformat(),
                'metadata': message.metadata
            })
        
        return Response({
            'history': history
        }, status=status.HTTP_200_OK)
        
    except ChatSession.DoesNotExist:
        return Response({
            'error': 'Chat session not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error getting chat history: {str(e)}")
        return Response({
            'error': 'Failed to get chat history',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@swagger_auto_schema(
    method='GET',
    operation_description="Get all chat sessions for the user",
    tags=["AI Chatbot"],
    responses={
        200: openapi.Response(
            description="User sessions retrieved successfully",
            examples={
                "application/json": {
                    "sessions": [
                        {
                            "session_id": "uuid-string",
                            "title": "Career Advice",
                            "created_at": "2023-01-01T12:00:00Z",
                            "updated_at": "2023-01-01T12:30:00Z",
                            "message_count": 15
                        }
                    ]
                }
            }
        ),
        401: "Unauthorized"
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_sessions(request):
    """Get all chat sessions for the user"""
    try:
        sessions = ChatSession.objects.filter(user=request.user, is_active=True).order_by('-updated_at')
        
        session_list = []
        for session in sessions:
            session_list.append({
                'session_id': session.session_id,
                'title': session.title or f"Chat {session.created_at.strftime('%b %d, %Y')}",
                'created_at': session.created_at.isoformat(),
                'updated_at': session.updated_at.isoformat(),
                'message_count': session.messages.count()
            })
        
        return Response({
            'sessions': session_list
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting user sessions: {str(e)}")
        return Response({
            'error': 'Failed to get user sessions',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@swagger_auto_schema(
    method='DELETE',
    operation_description="Delete a chat session",
    tags=["AI Chatbot"],
    responses={
        200: "Session deleted successfully",
        401: "Unauthorized",
        404: "Session not found"
    }
)
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_session(request, session_id):
    """Delete a chat session"""
    try:
        session = ChatSession.objects.get(session_id=session_id, user=request.user)
        session.is_active = False
        session.save()
        
        return Response({
            'message': 'Chat session deleted successfully'
        }, status=status.HTTP_200_OK)
        
    except ChatSession.DoesNotExist:
        return Response({
            'error': 'Chat session not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error deleting chat session: {str(e)}")
        return Response({
            'error': 'Failed to delete chat session',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
