from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.core.files.uploadedfile import UploadedFile
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from .models import ResumeUpload
from .serializers import (
    ResumeUploadRequestSerializer,
    ResumeUploadSerializer, 
    ResumeUploadResponseSerializer,
    AIRecommendationsResponseSerializer
)
from .services import CareerRecommendationEngine
from careers.models import QuestionnaireAnswer, CareerRecommendation
from users.models import UserProfile
import json


class ResumeUploadView(APIView):
    permission_classes = [permissions.AllowAny]  # Temporarily allow anyone for testing

    @swagger_auto_schema(
        operation_description="Upload and process a resume file (PDF or DOCX)",
        tags=["3. Resume Processing"],
        request_body=ResumeUploadRequestSerializer,
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
    def post(self, request):
        # Validate using serializer
        serializer = ResumeUploadRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
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
        # Handle case where user might be None or Anonymous (for testing)
        if request.user is None or not request.user.is_authenticated:
            # Create a default user for testing
            from django.contrib.auth.models import User
            default_user, created = User.objects.get_or_create(
                username='anonymous_user',
                defaults={'email': 'anonymous@test.com', 'first_name': 'Anonymous', 'last_name': 'User'}
            )
            user = default_user
        else:
            user = request.user
            
        resume_upload = self._process_resume_upload(user, file)
        
        response_serializer = ResumeUploadResponseSerializer(resume_upload)
        
        # Enhanced response with analysis results
        skills_detected = resume_upload.extracted_skills if resume_upload.processed else []
        experience_years = self._estimate_experience_years(resume_upload.extracted_text) if resume_upload.processed else 0
        recommended_careers = self._generate_career_recommendations(skills_detected) if resume_upload.processed else []
        
        return Response({
            'message': 'Resume uploaded and processed successfully',
            'resume': response_serializer.data,
            'skills_detected': skills_detected,
            'experience_years': experience_years,
            'recommended_careers': recommended_careers
        }, status=status.HTTP_201_CREATED)
    
    def _estimate_experience_years(self, extracted_text):
        """Estimate years of experience from resume text"""
        import re
        
        # Look for patterns like "5 years of experience", "5+ years", etc.
        experience_patterns = [
            r'(\d+)\+?\s*years?\s*(?:of\s*)?experience',
            r'experience\s*(?:of\s*)?(\d+)\+?\s*years?',
            r'(\d+)\+?\s*years?\s*(?:of\s*)?(?:work|professional)',
        ]
        
        total_years = 0
        for pattern in experience_patterns:
            matches = re.findall(pattern, extracted_text.lower())
            for match in matches:
                try:
                    years = int(match)
                    total_years = max(total_years, years)
                except ValueError:
                    continue
        
        return total_years
    
    def _generate_career_recommendations(self, skills):
        """Generate career recommendations based on detected skills"""
        from careers.models import Career
        
        if not skills:
            return []
        
        # Get all careers and match skills
        careers = Career.objects.filter(is_active=True)
        recommendations = []
        
        for career in careers[:5]:  # Limit to top 5
            career_skills = set(career.required_skills or [])
            user_skills = set(skills)
            
            # Calculate match percentage
            if career_skills:
                matched_skills = user_skills.intersection(career_skills)
                match_percentage = len(matched_skills) / len(career_skills) * 100
                
                if match_percentage > 20:  # Only show careers with some match
                    recommendations.append({
                        'career_title': career.title,
                        'match_score': round(match_percentage, 1),
                        'reason': f"Based on your skills, you match {len(matched_skills)} out of {len(career_skills)} required skills for this career.",
                        'skills_matched': list(matched_skills)
                    })
        
        # Sort by match score
        recommendations.sort(key=lambda x: x['match_score'], reverse=True)
        return recommendations[:3]  # Return top 3
    
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


class AIRecommendationsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Get AI-powered career recommendations based on user skills and questionnaire answers",
        tags=["5. AI Career Recommendations"],
        responses={
            200: openapi.Response(
                description="Career recommendations generated successfully",
                schema=AIRecommendationsResponseSerializer,
                examples={
                    "application/json": {
                        "message": "Career recommendations generated successfully",
                        "user_skills": ["Python", "Django", "SQL", "JavaScript"],
                        "questionnaire_completed": True,
                        "recommendations": [
                            {
                                "id": 1,
                                "career_name": "Software Developer",
                                "score": 85.5,
                                "reasoning": "Based on your skills in Python, Django, SQL, JavaScript and interests, Software Developer is a strong match with a compatibility score of 85.5%.",
                                "created_at": "2024-01-01T00:00:00Z"
                            }
                        ]
                    }
                }
            ),
            401: "Unauthorized"
        }
    )
    def get(self, request):
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
        
        # Serialize and return recommendations with enhanced format
        enhanced_recommendations = []
        for rec in saved_recommendations:
            enhanced_recommendations.append({
                'career_title': rec.career_name,
                'match_score': rec.score,
                'reason': rec.reasoning,
                'skills_matched': self._get_matched_skills(user_skills, rec.career_name)
            })
        
        response_data = {
            'message': 'Career recommendations generated successfully',
            'user_skills': user_skills,
            'questionnaire_completed': len(questionnaire_answers) > 0,
            'recommendations': enhanced_recommendations
        }
        
        response_serializer = AIRecommendationsResponseSerializer(data=response_data)
        if response_serializer.is_valid():
            return Response(response_serializer.data, status=status.HTTP_200_OK)
        
        return Response(response_data, status=status.HTTP_200_OK)
    
    def _get_matched_skills(self, user_skills, career_name):
        """Get matched skills for a career"""
        from careers.models import Career
        
        try:
            career = Career.objects.get(title=career_name, is_active=True)
            career_skills = set(career.required_skills or [])
            user_skills_set = set(user_skills)
            matched_skills = user_skills_set.intersection(career_skills)
            return list(matched_skills)
        except Career.DoesNotExist:
            return []
