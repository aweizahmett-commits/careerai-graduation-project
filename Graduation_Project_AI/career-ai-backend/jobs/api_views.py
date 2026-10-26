from rest_framework import status, permissions, parsers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.db.models import Q, Avg, Count
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
import json
import logging

from users.models import UserProfile
from .models import JobRecommendation, UserProfileSkill, JobMatchingCriteria, MatchingFeedback, JobPost, JobApplication
# from .services import AIJobMatchingEngine  # Temporarily commented out
# from .linkedin_integration import JobAggregatorService, JobApplicationTracker  # Temporarily commented out
from ai_engine.models import ResumeUpload
from ai_engine.services import AdvancedResumeProcessor
from .serializers import JobPostSerializer, JobPostCreateSerializer, JobApplicationSerializer, JobApplicationCreateSerializer, JobApplicationUpdateSerializer

logger = logging.getLogger(__name__)


class TestView(APIView):
    """Simple test endpoint"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        return Response({
            'message': 'Backend is working!',
            'status': 'OK'
        })
    
    def post(self, request):
        return Response({
            'message': 'POST request received',
            'data': request.data
        })


class ResumeUploadView(APIView):
    """Simple resume upload without analysis"""
    permission_classes = [permissions.AllowAny]  # Temporarily AllowAny for testing
    parser_classes = [MultiPartParser, FormParser]

    @swagger_auto_schema(
        operation_description="Upload resume file",
        tags=["Resume Upload"],
        manual_parameters=[
            openapi.Parameter(
                'file',
                openapi.IN_FORM,
                description="Resume file (PDF or DOCX)",
                type=openapi.TYPE_FILE,
                required=True
            )
        ],
        consumes=['multipart/form-data'],
        responses={
            200: openapi.Response(
                description="Resume uploaded successfully",
                examples={
                    "application/json": {
                        "message": "Resume uploaded successfully",
                        "id": 123
                    }
                }
            ),
            400: "Bad Request - Invalid file",
            401: "Unauthorized"
        }
    )
    def post(self, request, *args, **kwargs):
        try:
            file = request.FILES.get('file')
            if not file:
                return Response({
                    'error': 'No file provided'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate file type
            allowed_types = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
            if file.content_type not in allowed_types:
                return Response({
                    'error': 'Only PDF and DOCX files are supported'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create resume upload record (without analysis)
            resume = ResumeUpload.objects.create(
                user=request.user,
                file=file,
                original_filename=file.name,
                file_size=file.size,
                file_type='pdf' if file.content_type == 'application/pdf' else 'docx',
                processed=False
            )
            
            return Response({
                'message': 'Resume uploaded successfully',
                'id': resume.id
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error uploading resume: {str(e)}")
            return Response({
                'error': 'Resume upload failed',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ResumeAnalysisView(APIView):
    """Analyze uploaded resume with AI"""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    @swagger_auto_schema(
        operation_description="Analyze uploaded resume with AI",
        tags=["AI Resume Analysis"],
        manual_parameters=[
            openapi.Parameter(
                'resume_id',
                openapi.IN_FORM,
                description="Resume ID to analyze",
                type=openapi.TYPE_INTEGER,
                required=False
            ),
            openapi.Parameter(
                'file',
                openapi.IN_FORM,
                description="Resume file (PDF or DOCX) - optional if resume_id provided",
                type=openapi.TYPE_FILE,
                required=False
            )
        ],
        consumes=['multipart/form-data', 'application/json'],
        responses={
            200: openapi.Response(
                description="Resume analyzed successfully",
                examples={
                    "application/json": {
                        "message": "Resume analyzed successfully",
                        "analysis": {
                            "skills": ["python", "react", "aws"],
                            "experience_years": 5.0,
                            "education_level": "Bachelors",
                            "job_titles": ["Software Engineer", "Frontend Developer"],
                            "skill_categories": {
                                "programming": ["python", "javascript"],
                                "web_development": ["react", "html"]
                            },
                            "career_suggestions": [
                                {
                                    "title": "Full Stack Developer",
                                    "match_score": 85.5,
                                    "matched_skills": ["python", "react"],
                                    "missing_skills": ["docker"]
                                }
                            ],
                            "confidence_score": 0.92
                        }
                    }
                }
            ),
            400: "Bad Request - Invalid file or resume_id",
            401: "Unauthorized"
        }
    )
    def post(self, request, *args, **kwargs):
        try:
            # Check if resume_id is provided (for analysis of existing upload)
            if 'resume_id' in request.data:
                resume_id = request.data.get('resume_id')
                resume = get_object_or_404(ResumeUpload, id=resume_id, user=request.user)
                
                if resume.processed:
                    return Response({
                        'error': 'Resume has already been analyzed'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
            # Check if file is provided (for upload + analysis)
            elif 'file' in request.FILES:
                file = request.FILES.get('file')
                if not file:
                    return Response({
                        'error': 'No file provided'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Validate file type
                allowed_types = [
                    'application/pdf',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/msword',  # legacy .doc format
                ]
                # Also allow by extension when content_type is generic
                name_lower = file.name.lower()
                by_extension = name_lower.endswith('.pdf') or name_lower.endswith('.docx') or name_lower.endswith('.doc')
                if file.content_type not in allowed_types and not by_extension:
                    return Response({
                        'error': 'Only PDF and Word documents (.doc, .docx) are supported'
                    }, status=status.HTTP_400_BAD_REQUEST)

                if file.content_type == 'application/pdf' or name_lower.endswith('.pdf'):
                    file_type = 'pdf'
                else:
                    file_type = 'docx'

                # Create resume upload record
                resume = ResumeUpload.objects.create(
                    user=request.user,
                    file=file,
                    original_filename=file.name,
                    file_size=file.size,
                    file_type=file_type,
                    processed=False
                )
            else:
                return Response({
                    'error': 'Either resume_id or file must be provided'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Process resume with AI
            processor = AdvancedResumeProcessor()
            analysis_result = processor.analyze_resume(resume.file.path, resume.file_type)
            
            # Update resume with analysis results
            resume.extracted_text = analysis_result.get('extracted_text', '')
            resume.extracted_skills = analysis_result.get('skills', [])
            resume.skill_categories = analysis_result.get('skill_categories', {})
            resume.experience_years = analysis_result.get('experience', {}).get('total_years')
            resume.education_level = analysis_result.get('education', {}).get('highest_level')
            resume.job_titles = analysis_result.get('job_titles', [])
            resume.companies = analysis_result.get('companies', [])
            resume.certifications = analysis_result.get('certifications', [])
            resume.languages = analysis_result.get('languages', [])
            resume.projects = analysis_result.get('projects', [])
            resume.career_suggestions = analysis_result.get('career_suggestions', [])
            resume.processing_time = analysis_result.get('processing_time')
            resume.ai_confidence_score = analysis_result.get('confidence_score')
            resume.processed = True
            resume.save()
            
            # Create user skills from analysis
            self._create_user_skills(request.user, analysis_result.get('skills', []))
            
            return Response({
                'message': 'Resume analyzed successfully',
                'analysis': analysis_result,
                'resume_id': resume.id
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error analyzing resume: {str(e)}")
            return Response({
                'error': 'Resume analysis failed',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _create_user_skills(self, user, skills):
        """Create user skills from resume analysis"""
        skill_categories = {
            'programming': ['python', 'java', 'javascript', 'typescript', 'c++', 'c#'],
            'web_development': ['react', 'angular', 'vue.js', 'html', 'css', 'node.js'],
            'data_science': ['machine learning', 'data science', 'tensorflow', 'pandas'],
            'cloud_devops': ['aws', 'docker', 'kubernetes', 'jenkins'],
            'databases': ['sql', 'postgresql', 'mongodb', 'mysql'],
            'mobile': ['ios', 'android', 'react native', 'flutter'],
            'tools_software': ['git', 'jira', 'slack', 'excel'],
            'methodologies': ['agile', 'scrum', 'devops']
        }
        
        for skill in skills:
            # Determine category
            category = 'tools_software'  # default
            for cat_name, cat_skills in skill_categories.items():
                if any(cat_skill in skill.lower() for cat_skill in cat_skills):
                    category = cat_name
                    break
            
            # Create or update skill
            user_skill, created = UserProfileSkill.objects.get_or_create(
                user=user,
                skill_name=skill,
                defaults={
                    'proficiency_level': 3,  # Default to intermediate
                    'category': category
                }
            )


class JobRecommendationsView(APIView):
    """Get AI-powered job recommendations"""
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Get personalized job recommendations",
        tags=["Job Matching"],
        responses={
            200: openapi.Response(
                description="Job recommendations retrieved successfully",
                examples={
                    "application/json": {
                        "recommendations": [
                            {
                                "id": 1,
                                "title": "Senior Software Engineer",
                                "company": "Tech Corp",
                                "location": "San Francisco, CA",
                                "match_score": 92.5,
                                "skill_match_score": 95.0,
                                "matched_skills": ["python", "react", "aws"],
                                "missing_skills": ["kubernetes"],
                                "salary_range": "$120k-$150k",
                                "job_type": "full_time",
                                "source": "linkedin",
                                "application_url": "https://linkedin.com/jobs/123"
                            }
                        ],
                        "total_count": 15
                    }
                }
            ),
            401: "Unauthorized"
        }
    )
    def get(self, request, *args, **kwargs):
        try:
            # Get recommendations from aggregator service
            aggregator = JobAggregatorService()
            recommendations = aggregator.get_jobs_for_user(request.user, limit=20)
            
            # Serialize recommendations
            serialized_recommendations = []
            for rec in recommendations:
                serialized_recommendations.append({
                    'id': rec.id,
                    'title': rec.title,
                    'company': rec.company,
                    'location': rec.location,
                    'description': rec.description,
                    'requirements': rec.requirements,
                    'salary_range': rec.salary_range,
                    'job_type': rec.job_type,
                    'match_score': rec.match_score,
                    'skill_match_score': rec.skill_match_score,
                    'matched_skills': rec.matched_skills,
                    'missing_skills': rec.missing_skills,
                    'match_reasons': rec.match_reasons,
                    'improvement_suggestions': rec.improvement_suggestions,
                    'source': rec.source,
                    'application_url': rec.application_url,
                    'is_saved': rec.is_saved,
                    'is_applied': rec.is_applied,
                    'is_viewed': rec.is_viewed,
                    'posted_date': rec.posted_date.isoformat() if rec.posted_date else None
                })
            
            return Response({
                'recommendations': serialized_recommendations,
                'total_count': len(serialized_recommendations)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error getting job recommendations: {str(e)}")
            return Response({
                'error': 'Failed to get job recommendations',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RefreshRecommendationsView(APIView):
    """Refresh job recommendations"""
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Refresh job recommendations from external sources",
        tags=["Job Matching"],
        responses={
            200: openapi.Response(
                description="Recommendations refreshed successfully"
            ),
            401: "Unauthorized"
        }
    )
    def post(self, request, *args, **kwargs):
        try:
            aggregator = JobAggregatorService()
            recommendations = aggregator.refresh_job_listings(request.user)
            
            return Response({
                'message': 'Job recommendations refreshed successfully',
                'new_recommendations_count': len(recommendations)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error refreshing recommendations: {str(e)}")
            return Response({
                'error': 'Failed to refresh recommendations',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class JobFeedbackView(APIView):
    """Provide feedback on job recommendations"""
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Provide feedback on job recommendations for AI learning",
        tags=["Job Matching"],
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'recommendation_id': openapi.Schema(type=openapi.TYPE_INTEGER),
                'feedback_type': openapi.Schema(type=openapi.TYPE_STRING, enum=['liked', 'disliked', 'saved', 'applied', 'not_interested']),
                'feedback_score': openapi.Schema(type=openapi.TYPE_INTEGER, minimum=1, maximum=5),
                'feedback_text': openapi.Schema(type=openapi.TYPE_STRING),
                'relevant_factors': openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Schema(type=openapi.TYPE_STRING))
            }
        ),
        responses={
            200: "Feedback recorded successfully",
            400: "Bad Request",
            401: "Unauthorized"
        }
    )
    def post(self, request, *args, **kwargs):
        try:
            recommendation_id = request.data.get('recommendation_id')
            feedback_type = request.data.get('feedback_type')
            feedback_score = request.data.get('feedback_score')
            feedback_text = request.data.get('feedback_text', '')
            relevant_factors = request.data.get('relevant_factors', [])
            
            if not recommendation_id or not feedback_type:
                return Response({
                    'error': 'recommendation_id and feedback_type are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get recommendation
            recommendation = get_object_or_404(JobRecommendation, id=recommendation_id, user=request.user)
            
            # Create or update feedback
            feedback, created = MatchingFeedback.objects.get_or_create(
                user=request.user,
                recommendation=recommendation,
                defaults={
                    'feedback_type': feedback_type,
                    'feedback_score': feedback_score,
                    'feedback_text': feedback_text,
                    'relevant_factors': relevant_factors
                }
            )
            
            if not created:
                feedback.feedback_type = feedback_type
                feedback.feedback_score = feedback_score
                feedback.feedback_text = feedback_text
                feedback.relevant_factors = relevant_factors
                feedback.save()
            
            # Update recommendation status based on feedback
            if feedback_type == 'saved':
                recommendation.is_saved = True
            elif feedback_type == 'applied':
                recommendation.is_applied = True
            elif feedback_type == 'not_interested':
                recommendation.user_rating = 1
            elif feedback_type == 'liked':
                recommendation.user_rating = 5
            
            recommendation.save()
            
            # Update AI learning preferences
            matching_engine = AIJobMatchingEngine()
            feedback_data = {
                'liked': feedback_type in ['liked', 'saved', 'applied'],
                'disliked': feedback_type == 'not_interested',
                'company': recommendation.company,
                'title': recommendation.title,
                'industry': matching_engine._classify_job_industry({
                    'title': recommendation.title,
                    'description': recommendation.description,
                    'requirements': recommendation.requirements
                })
            }
            matching_engine.update_user_preferences(request.user, feedback_data)
            
            return Response({
                'message': 'Feedback recorded successfully',
                'feedback_id': feedback.id
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error recording feedback: {str(e)}")
            return Response({
                'error': 'Failed to record feedback',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ApplicationTrackerView(APIView):
    """Track job applications and get insights"""
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Track a job application",
        tags=["Job Application Tracking"],
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'job_id': openapi.Schema(type=openapi.TYPE_STRING),
                'application_status': openapi.Schema(type=openapi.TYPE_STRING)
            }
        ),
        responses={
            200: "Application tracked successfully",
            400: "Bad Request",
            401: "Unauthorized"
        }
    )
    def post(self, request, *args, **kwargs):
        try:
            job_id = request.data.get('job_id')
            application_status = request.data.get('application_status', 'applied')
            
            if not job_id:
                return Response({
                    'error': 'job_id is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            tracker = JobApplicationTracker()
            result = tracker.track_application(request.user, job_id, application_status)
            
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error tracking application: {str(e)}")
            return Response({
                'error': 'Failed to track application',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @swagger_auto_schema(
        operation_description="Get application insights and analytics",
        tags=["Job Application Tracking"],
        responses={
            200: openapi.Response(
                description="Application insights retrieved successfully"
            ),
            401: "Unauthorized"
        }
    )
    def get(self, request, *args, **kwargs):
        try:
            tracker = JobApplicationTracker()
            insights = tracker.get_application_insights(request.user)
            
            return Response(insights, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error getting application insights: {str(e)}")
            return Response({
                'error': 'Failed to get application insights',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserSkillsView(APIView):
    """Manage user skills and preferences"""
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Get user's skills and proficiency levels",
        tags=["User Profile"],
        responses={
            200: "User skills retrieved successfully",
            401: "Unauthorized"
        }
    )
    def get(self, request, *args, **kwargs):
        try:
            skills = UserProfileSkill.objects.filter(user=request.user).order_by('-proficiency_level')
            
            serialized_skills = []
            for skill in skills:
                serialized_skills.append({
                    'id': skill.id,
                    'skill_name': skill.skill_name,
                    'proficiency_level': skill.proficiency_level,
                    'category': skill.category,
                    'years_experience': skill.years_experience,
                    'is_preferred': skill.is_preferred,
                    'last_used': skill.last_used.isoformat() if skill.last_used else None
                })
            
            return Response({
                'skills': serialized_skills
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error getting user skills: {str(e)}")
            return Response({
                'error': 'Failed to get user skills',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @swagger_auto_schema(
        operation_description="Update user skills and preferences",
        tags=["User Profile"],
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'skills': openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            'skill_name': openapi.Schema(type=openapi.TYPE_STRING),
                            'proficiency_level': openapi.Schema(type=openapi.TYPE_INTEGER, minimum=1, maximum=5),
                            'category': openapi.Schema(type=openapi.TYPE_STRING),
                            'years_experience': openapi.Schema(type=openapi.TYPE_NUMBER),
                            'is_preferred': openapi.Schema(type=openapi.TYPE_BOOLEAN)
                        }
                    )
                )
            }
        ),
        responses={
            200: "Skills updated successfully",
            400: "Bad Request",
            401: "Unauthorized"
        }
    )
    def put(self, request, *args, **kwargs):
        try:
            skills_data = request.data.get('skills', [])
            
            if not skills_data:
                return Response({
                    'error': 'skills data is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Clear existing skills
            UserProfileSkill.objects.filter(user=request.user).delete()
            
            # Create new skills
            for skill_data in skills_data:
                UserProfileSkill.objects.create(
                    user=request.user,
                    skill_name=skill_data['skill_name'],
                    proficiency_level=skill_data.get('proficiency_level', 3),
                    category=skill_data.get('category', 'tools_software'),
                    years_experience=skill_data.get('years_experience'),
                    is_preferred=skill_data.get('is_preferred', False)
                )
            
            return Response({
                'message': 'Skills updated successfully'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error updating user skills: {str(e)}")
            return Response({
                'error': 'Failed to update skills',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class JobMatchingCriteriaView(APIView):
    """Manage job matching preferences"""
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Get job matching criteria and preferences",
        tags=["Job Matching"],
        responses={
            200: "Matching criteria retrieved successfully",
            401: "Unauthorized"
        }
    )
    def get(self, request, *args, **kwargs):
        try:
            criteria, created = JobMatchingCriteria.objects.get_or_create(user=request.user)
            
            return Response({
                'preferred_job_types': criteria.preferred_job_types,
                'preferred_locations': criteria.preferred_locations,
                'salary_min': criteria.salary_min,
                'salary_max': criteria.salary_max,
                'remote_preference': criteria.remote_preference,
                'preferred_industries': criteria.preferred_industries,
                'company_sizes': criteria.company_sizes,
                'skill_match_weight': criteria.skill_match_weight,
                'experience_match_weight': criteria.experience_match_weight,
                'education_match_weight': criteria.education_match_weight,
                'location_match_weight': criteria.location_match_weight,
                'salary_match_weight': criteria.salary_match_weight
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error getting matching criteria: {str(e)}")
            return Response({
                'error': 'Failed to get matching criteria',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @swagger_auto_schema(
        operation_description="Update job matching criteria and preferences",
        tags=["Job Matching"],
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'preferred_job_types': openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Schema(type=openapi.TYPE_STRING)),
                'preferred_locations': openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Schema(type=openapi.TYPE_STRING)),
                'salary_min': openapi.Schema(type=openapi.TYPE_NUMBER),
                'salary_max': openapi.Schema(type=openapi.TYPE_NUMBER),
                'remote_preference': openapi.Schema(type=openapi.TYPE_STRING),
                'preferred_industries': openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Schema(type=openapi.TYPE_STRING)),
                'company_sizes': openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Schema(type=openapi.TYPE_STRING)),
                'skill_match_weight': openapi.Schema(type=openapi.TYPE_NUMBER),
                'experience_match_weight': openapi.Schema(type=openapi.TYPE_NUMBER),
                'education_match_weight': openapi.Schema(type=openapi.TYPE_NUMBER),
                'location_match_weight': openapi.Schema(type=openapi.TYPE_NUMBER),
                'salary_match_weight': openapi.Schema(type=openapi.TYPE_NUMBER)
            }
        ),
        responses={
            200: "Matching criteria updated successfully",
            400: "Bad Request",
            401: "Unauthorized"
        }
    )
    def put(self, request, *args, **kwargs):
        try:
            criteria, created = JobMatchingCriteria.objects.get_or_create(user=request.user)
            
            # Update fields
            if 'preferred_job_types' in request.data:
                criteria.preferred_job_types = request.data['preferred_job_types']
            if 'preferred_locations' in request.data:
                criteria.preferred_locations = request.data['preferred_locations']
            if 'salary_min' in request.data:
                criteria.salary_min = request.data['salary_min']
            if 'salary_max' in request.data:
                criteria.salary_max = request.data['salary_max']
            if 'remote_preference' in request.data:
                criteria.remote_preference = request.data['remote_preference']
            if 'preferred_industries' in request.data:
                criteria.preferred_industries = request.data['preferred_industries']
            if 'company_sizes' in request.data:
                criteria.company_sizes = request.data['company_sizes']
            if 'skill_match_weight' in request.data:
                criteria.skill_match_weight = request.data['skill_match_weight']
            if 'experience_match_weight' in request.data:
                criteria.experience_match_weight = request.data['experience_match_weight']
            if 'education_match_weight' in request.data:
                criteria.education_match_weight = request.data['education_match_weight']
            if 'location_match_weight' in request.data:
                criteria.location_match_weight = request.data['location_match_weight']
            if 'salary_match_weight' in request.data:
                criteria.salary_match_weight = request.data['salary_match_weight']
            
            criteria.save()
            
            return Response({
                'message': 'Matching criteria updated successfully'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error updating matching criteria: {str(e)}")
            return Response({
                'error': 'Failed to update matching criteria',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class JobPostViewSet(APIView):
    """Manage job posts for job providers"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """Get job posts for the current job provider"""
        try:
            # Check if user is a job provider
            try:
                profile = request.user.userprofile
                if profile.role != 'job_provider':
                    return Response({
                        'error': 'Only job providers can manage job posts'
                    }, status=status.HTTP_403_FORBIDDEN)
            except UserProfile.DoesNotExist:
                return Response({
                    'error': 'User profile not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            job_posts = JobPost.objects.filter(job_provider=request.user).order_by('-created_at')
            serializer = JobPostSerializer(job_posts, many=True)
            
            return Response({
                'job_posts': serializer.data,
                'total_count': job_posts.count()
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error getting job posts: {str(e)}")
            return Response({
                'error': 'Failed to get job posts',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request, *args, **kwargs):
        """Create a new job post"""
        try:
            # Check if user is a job provider
            try:
                profile = request.user.userprofile
                if profile.role != 'job_provider':
                    return Response({
                        'error': 'Only job providers can create job posts'
                    }, status=status.HTTP_403_FORBIDDEN)
            except UserProfile.DoesNotExist:
                return Response({
                    'error': 'User profile not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            serializer = JobPostCreateSerializer(data=request.data, context={'request': request})
            serializer.is_valid(raise_exception=True)
            job_post = serializer.save()
            
            # Return the created job post with full details
            response_serializer = JobPostSerializer(job_post)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error creating job post: {str(e)}")
            return Response({
                'error': 'Failed to create job post',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class JobPostDetailView(APIView):
    """Manage individual job posts"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, job_post_id, *args, **kwargs):
        """Get a specific job post"""
        try:
            job_post = get_object_or_404(JobPost, id=job_post_id)
            
            # Check if user owns this job post
            if job_post.job_provider != request.user:
                return Response({
                    'error': 'You can only view your own job posts'
                }, status=status.HTTP_403_FORBIDDEN)
            
            serializer = JobPostSerializer(job_post)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error getting job post: {str(e)}")
            return Response({
                'error': 'Failed to get job post',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, job_post_id, *args, **kwargs):
        """Update a job post"""
        try:
            job_post = get_object_or_404(JobPost, id=job_post_id)
            
            # Check if user owns this job post
            if job_post.job_provider != request.user:
                return Response({
                    'error': 'You can only update your own job posts'
                }, status=status.HTTP_403_FORBIDDEN)
            
            serializer = JobPostCreateSerializer(job_post, data=request.data, context={'request': request})
            serializer.is_valid(raise_exception=True)
            job_post = serializer.save()
            
            response_serializer = JobPostSerializer(job_post)
            return Response(response_serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error updating job post: {str(e)}")
            return Response({
                'error': 'Failed to update job post',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, job_post_id, *args, **kwargs):
        """Delete a job post"""
        try:
            job_post = get_object_or_404(JobPost, id=job_post_id)
            
            # Check if user owns this job post
            if job_post.job_provider != request.user:
                return Response({
                    'error': 'You can only delete your own job posts'
                }, status=status.HTTP_403_FORBIDDEN)
            
            job_post.delete()
            return Response({
                'message': 'Job post deleted successfully'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error deleting job post: {str(e)}")
            return Response({
                'error': 'Failed to delete job post',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PublicJobPostsView(APIView):
    """Public view for students to see all active job posts"""
    permission_classes = [permissions.AllowAny]  # Allow anyone to view active jobs

    def get(self, request, *args, **kwargs):
        """Get all active job posts for public viewing"""
        try:
            # Only return active job posts
            job_posts = JobPost.objects.filter(status='active').order_by('-created_at')
            serializer = JobPostSerializer(job_posts, many=True)
            
            return Response({
                'job_posts': serializer.data,
                'total_count': job_posts.count()
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error getting public job posts: {str(e)}")
            return Response({
                'error': 'Failed to get job posts',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class JobApplicationViewSet(APIView):
    """Manage job applications for students"""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get(self, request, *args, **kwargs):
        """Get applications for the current student"""
        try:
            # Check if user is a student
            try:
                profile = request.user.userprofile
                if profile.role != 'student':
                    return Response({
                        'error': 'Only students can view their applications'
                    }, status=status.HTTP_403_FORBIDDEN)
            except UserProfile.DoesNotExist:
                return Response({
                    'error': 'User profile not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            applications = JobApplication.objects.filter(student=request.user).order_by('-applied_at')
            serializer = JobApplicationSerializer(applications, many=True)
            
            return Response({
                'applications': serializer.data,
                'total_count': applications.count()
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error getting applications: {str(e)}")
            return Response({
                'error': 'Failed to get applications',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request, *args, **kwargs):
        """Apply for a job post"""
        try:
            # Check if user is a student
            try:
                profile = request.user.userprofile
                if profile.role != 'student':
                    return Response({
                        'error': 'Only students can apply for jobs'
                    }, status=status.HTTP_403_FORBIDDEN)
            except UserProfile.DoesNotExist:
                return Response({
                    'error': 'User profile not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            serializer = JobApplicationCreateSerializer(data=request.data, context={'request': request})
            serializer.is_valid(raise_exception=True)
            application = serializer.save()
            
            response_serializer = JobApplicationSerializer(application)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error creating application: {str(e)}")
            
            # Handle specific database constraint errors
            if 'UNIQUE constraint failed' in str(e) and 'job_post_id' in str(e) and 'student_id' in str(e):
                return Response({
                    'error': 'You have already applied for this job',
                    'details': 'Each student can only apply once per job posting'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            return Response({
                'error': 'Failed to create application',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class JobApplicationsForEmployerView(APIView):
    """View and manage applications for job provider's job posts"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """Get all applications for the job provider's job posts"""
        try:
            # Check if user is a job provider
            try:
                profile = request.user.userprofile
                if profile.role != 'job_provider':
                    return Response({
                        'error': 'Only job providers can view applications'
                    }, status=status.HTTP_403_FORBIDDEN)
            except UserProfile.DoesNotExist:
                return Response({
                    'error': 'User profile not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            applications = JobApplication.objects.filter(job_post__job_provider=request.user).order_by('-applied_at')
            serializer = JobApplicationSerializer(applications, many=True)
            
            return Response({
                'applications': serializer.data,
                'total_count': applications.count()
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error getting applications for employer: {str(e)}")
            return Response({
                'error': 'Failed to get applications',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, application_id, *args, **kwargs):
        """Update application status (accept/reject)"""
        try:
            # Check if user is a job provider
            try:
                profile = request.user.userprofile
                if profile.role != 'job_provider':
                    return Response({
                        'error': 'Only job providers can update applications'
                    }, status=status.HTTP_403_FORBIDDEN)
            except UserProfile.DoesNotExist:
                return Response({
                    'error': 'User profile not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            application = get_object_or_404(JobApplication, id=application_id)
            
            # Check if the application is for the job provider's job post
            if application.job_post.job_provider != request.user:
                return Response({
                    'error': 'You can only update applications for your job posts'
                }, status=status.HTTP_403_FORBIDDEN)
            
            serializer = JobApplicationUpdateSerializer(application, data=request.data)
            serializer.is_valid(raise_exception=True)
            application = serializer.save()
            
            response_serializer = JobApplicationSerializer(application)
            return Response(response_serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error updating application: {str(e)}")
            return Response({
                'error': 'Failed to update application',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EmployerJobManagementView(APIView):
    """Manage job posts for employers"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk=None):
        """Get employer's jobs or specific job"""
        try:
            # Check if user is a job provider
            try:
                profile = request.user.userprofile
                if profile.role != 'job_provider':
                    return Response({
                        'error': 'Only job providers can manage jobs'
                    }, status=status.HTTP_403_FORBIDDEN)
            except UserProfile.DoesNotExist:
                return Response({
                    'error': 'User profile not found'
                }, status=status.HTTP_404_NOT_FOUND)

            if pk:
                # Get specific job
                job = get_object_or_404(JobPost, pk=pk, job_provider=request.user)
                serializer = JobPostSerializer(job)
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                # Get all employer's jobs
                jobs = JobPost.objects.filter(job_provider=request.user).order_by('-created_at')
                serializer = JobPostSerializer(jobs, many=True)
                return Response({
                    'jobs': serializer.data
                }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error getting jobs: {str(e)}")
            return Response({
                'error': 'Failed to get jobs',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        """Create a new job"""
        try:
            # Check if user is a job provider
            try:
                profile = request.user.userprofile
                if profile.role != 'job_provider':
                    return Response({
                        'error': 'Only job providers can create jobs'
                    }, status=status.HTTP_403_FORBIDDEN)
            except UserProfile.DoesNotExist:
                return Response({
                    'error': 'User profile not found'
                }, status=status.HTTP_404_NOT_FOUND)

            serializer = JobPostCreateSerializer(data=request.data, context={'request': request})
            serializer.is_valid(raise_exception=True)
            job = serializer.save()

            response_serializer = JobPostSerializer(job)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error creating job: {str(e)}")
            return Response({
                'error': 'Failed to create job',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, pk):
        """Update a job"""
        try:
            # Check if user is a job provider
            try:
                profile = request.user.userprofile
                if profile.role != 'job_provider':
                    return Response({
                        'error': 'Only job providers can update jobs'
                    }, status=status.HTTP_403_FORBIDDEN)
            except UserProfile.DoesNotExist:
                return Response({
                    'error': 'User profile not found'
                }, status=status.HTTP_404_NOT_FOUND)

            job = get_object_or_404(JobPost, pk=pk, job_provider=request.user)
            serializer = JobPostCreateSerializer(job, data=request.data, partial=True, context={'request': request})
            serializer.is_valid(raise_exception=True)
            job = serializer.save()

            response_serializer = JobPostSerializer(job)
            return Response(response_serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error updating job: {str(e)}")
            return Response({
                'error': 'Failed to update job',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, pk):
        """Delete a job"""
        try:
            # Check if user is a job provider
            try:
                profile = request.user.userprofile
                if profile.role != 'job_provider':
                    return Response({
                        'error': 'Only job providers can delete jobs'
                    }, status=status.HTTP_403_FORBIDDEN)
            except UserProfile.DoesNotExist:
                return Response({
                    'error': 'User profile not found'
                }, status=status.HTTP_404_NOT_FOUND)

            job = get_object_or_404(JobPost, pk=pk, job_provider=request.user)
            job.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        except Exception as e:
            logger.error(f"Error deleting job: {str(e)}")
            return Response({
                'error': 'Failed to delete job',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EmployerApplicationsView(APIView):
    """View applications for employer's jobs"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get applications for employer's jobs"""
        try:
            # Check if user is a job provider
            try:
                profile = request.user.userprofile
                if profile.role != 'job_provider':
                    return Response({
                        'error': 'Only job providers can view applications'
                    }, status=status.HTTP_403_FORBIDDEN)
            except UserProfile.DoesNotExist:
                return Response({
                    'error': 'User profile not found'
                }, status=status.HTTP_404_NOT_FOUND)

            # Get applications for employer's jobs
            applications = JobApplication.objects.filter(
                job_post__job_provider=request.user
            ).order_by('-applied_at')
            
            serializer = JobApplicationSerializer(applications, many=True)
            return Response({
                'applications': serializer.data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error getting applications: {str(e)}")
            return Response({
                'error': 'Failed to get applications',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
