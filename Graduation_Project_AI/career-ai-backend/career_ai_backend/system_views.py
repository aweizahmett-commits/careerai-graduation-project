from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
@swagger_auto_schema(
    operation_description="Get API system information",
    tags=["7. System Root"],
    responses={
        200: openapi.Response(
            description="System information",
            examples={
                "application/json": {
                    "message": "AI Career Recommendation System API",
                    "version": "v1",
                    "endpoints": {
                        "authentication": "/api/register/, /api/login/",
                        "user_profile": "/api/profile/",
                        "resume_processing": "/api/upload_resume/",
                        "career_questionnaire": "/api/career_questions/, /api/questionnaire/answer/",
                        "ai_recommendations": "/api/ai_recommendations/",
                        "job_search": "/api/jobs/, /api/jobs/search/"
                    },
                    "documentation": "/swagger/",
                    "status": "active"
                }
            }
        )
    }
)
def system_root(request):
    """System root endpoint with API information"""
    return Response({
        "message": "AI Career Recommendation System API",
        "version": "v1",
        "endpoints": {
            "authentication": "/api/register/, /api/login/",
            "user_profile": "/api/profile/",
            "resume_processing": "/api/upload_resume/",
            "career_questionnaire": "/api/career_questions/, /api/questionnaire/answer/",
            "ai_recommendations": "/api/ai_recommendations/",
            "job_search": "/api/jobs/, /api/jobs/search/"
        },
        "documentation": "/swagger/",
        "status": "active"
    }, status=status.HTTP_200_OK)
