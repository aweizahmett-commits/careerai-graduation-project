from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth.models import User
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from .models import ResumeUpload
from .serializers import (
    ResumeUploadRequestSerializer,
    ResumeUploadResponseSerializer,
    AIRecommendationsResponseSerializer
)
from .services import CareerRecommendationEngine
from careers.models import QuestionnaireAnswer, CareerRecommendation
from users.models import UserProfile
import json


class ResumeUploadView(APIView):
    """Upload and process a resume file (PDF or DOCX)"""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    serializer_class = ResumeUploadRequestSerializer

    @swagger_auto_schema(
        operation_description="Upload and process a resume file (PDF or DOCX)",
        manual_parameters=[
            openapi.Parameter(
                'file',
                openapi.IN_FORM,
                type=openapi.TYPE_FILE,
                required=True,
                description='Resume file (PDF or DOCX format, max 10MB)'
            )
        ],
        consumes=['multipart/form-data'],
        responses={
            201: openapi.Response(
                description="Resume uploaded and processed successfully",
                schema=ResumeUploadResponseSerializer,
                examples={
                    "application/json": {
                        "message": "Resume uploaded and processed successfully",
                        "resume": {
                            "id": 1,
                            "original_filename": "resume.pdf",
                            "file_size": 1024000,
                            "file_type": "pdf",
                            "processed": True,
                            "extracted_skills": ["Python", "Django", "SQL", "JavaScript"],
                            "created_at": "2024-01-01T00:00:00Z"
                        }
                    }
                }
            ),
            400: "Bad Request - Invalid file or file type",
            401: "Unauthorized"
        }
    )
    def post(self, request, *args, **kwargs):
        # Validate using serializer
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        file = serializer.validated_data['file']
        
        # Validate file type
        allowed_types = ['pdf', 'docx', 'doc']
        file_extension = file.name.split('.')[-1].lower()
        if file_extension not in allowed_types:
            return Response({
                'error': f'File type {file_extension} not supported. Please upload PDF or DOCX files.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate file size (10MB limit)
        if file.size > 10 * 1024 * 1024:
            return Response({
                'error': 'File size too large. Maximum size is 10MB.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create upload record
        resume_upload = self._process_resume_upload(request.user, file)
        
        response_serializer = ResumeUploadResponseSerializer(resume_upload)
        return Response({
            'message': 'Resume uploaded and processed successfully',
            'resume': response_serializer.data
        }, status=status.HTTP_201_CREATED)
    
    def _process_resume_upload(self, user, file):
        """Process uploaded resume file"""
        from .services import ResumeProcessor
        
        # Get file information
        original_filename = file.name
        file_size = file.size
        file_type = original_filename.split('.')[-1].lower()
        
        # Create resume upload record
        resume_upload = ResumeUpload.objects.create(
            user=user,
            file=file,
            original_filename=original_filename,
            file_size=file_size,
            file_type=file_type
        )
        
        # Process resume
        try:
            # Extract text based on file type
            if file_type == 'pdf':
                text = ResumeProcessor.extract_text_from_pdf(resume_upload.file.path)
            elif file_type in ['docx', 'doc']:
                text = ResumeProcessor.extract_text_from_docx(resume_upload.file.path)
            else:
                raise ValueError("Unsupported file type")
            
            # Extract skills
            skills = ResumeProcessor.extract_skills(text)
            
            # Update the record
            resume_upload.extracted_text = text
            resume_upload.extracted_skills = skills
            resume_upload.processed = True
            resume_upload.save()
            
            # Update user profile with extracted skills
            user_profile, created = UserProfile.objects.get_or_create(user=user)
            user_profile.extracted_skills = json.dumps(skills)
            user_profile.save()
            
        except Exception as e:
            # If processing fails, still save the record but mark as unprocessed
            resume_upload.save()
        
        return resume_upload


class AIRecommendationsView(ListAPIView):
    """Get AI-powered career recommendations based on user skills and questionnaire answers"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AIRecommendationsResponseSerializer

    @swagger_auto_schema(
        operation_description="Get AI-powered career recommendations based on user skills and questionnaire answers",
        responses={
            200: AIRecommendationsResponseSerializer,
            401: "Unauthorized"
        }
    )
    def get(self, request, *args, **kwargs):
        user = request.user
        
        # Get user's extracted skills from profile
        try:
            profile = user.userprofile
            user_skills = []
            if profile.extracted_skills:
                try:
                    user_skills = json.loads(profile.extracted_skills)
                except json.JSONDecodeError:
                    user_skills = []
        except UserProfile.DoesNotExist:
            user_skills = []
        
        # Get questionnaire answers
        questionnaire_answers = []
        answers = QuestionnaireAnswer.objects.filter(user=user)
        for answer in answers:
            questionnaire_answers.append({
                'question_id': answer.question.id,
                'question_text': answer.question.question_text,
                'answer': answer.answer
            })
        
        # Generate recommendations
        if not user_skills and not questionnaire_answers:
            return Response({
                'message': 'No data available for recommendations. Please upload a resume and complete the questionnaire.',
                'user_skills': [],
                'questionnaire_completed': False,
                'recommendations': []
            }, status=status.HTTP_200_OK)
        
        # Clear previous recommendations for this user
        CareerRecommendation.objects.filter(user=user).delete()
        
        # Generate new recommendations
        recommendations_data = CareerRecommendationEngine.generate_recommendations(
            user_skills, questionnaire_answers
        )
        
        # Save recommendations to database
        saved_recommendations = []
        for rec_data in recommendations_data:
            recommendation = CareerRecommendation.objects.create(
                user=user,
                career_name=rec_data['career_name'],
                score=rec_data['score'],
                reasoning=rec_data['reasoning']
            )
            saved_recommendations.append(recommendation)
        
        # Serialize and return recommendations
        response_data = {
            'message': 'Career recommendations generated successfully',
            'user_skills': user_skills,
            'questionnaire_completed': len(questionnaire_answers) > 0,
            'recommendations': saved_recommendations
        }
        
        serializer = self.get_serializer(data=response_data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
