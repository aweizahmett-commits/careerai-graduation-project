from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import CreateAPIView, RetrieveUpdateAPIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from .models import UserProfile, DashboardStats, UserSkill
from .serializers import (
    UserRegistrationSerializer, 
    UserLoginSerializer,
    UserProfileSerializer,
    UserProfileUpdateSerializer,
    DashboardStatsSerializer,
    UserSkillSerializer
)


class DashboardView(APIView):
    """Get user dashboard statistics"""
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Get user dashboard statistics",
        tags=["Dashboard"],
        responses={
            200: openapi.Response(
                description="Dashboard statistics retrieved successfully",
                examples={
                    "application/json": {
                        "profile_completion": 75,
                        "assessment_completed": True,
                        "career_matches": 12,
                        "skills_analyzed": 8
                    }
                }
            ),
            401: "Unauthorized"
        }
    )
    def get(self, request, *args, **kwargs):
        try:
            dashboard_stats = request.user.dashboardstats
        except DashboardStats.DoesNotExist:
            dashboard_stats = DashboardStats.objects.create(user=request.user)
        
        # Calculate profile completion
        profile_completion = 0
        user = request.user
        
        # Basic profile info (30%)
        if user.first_name and user.last_name:
            profile_completion += 15
        if user.email:
            profile_completion += 15
        
        # User profile completion (20%)
        try:
            profile = user.userprofile
            if profile.resume_file:
                profile_completion += 10
            if profile.extracted_skills:
                profile_completion += 10
        except UserProfile.DoesNotExist:
            pass
        
        # Skills completion (20%)
        skills_count = UserSkill.objects.filter(user=user).count()
        if skills_count > 0:
            profile_completion += min(20, skills_count * 4)
        
        # Questionnaire completion (30%)
        from careers.models import QuestionnaireAnswer
        questionnaire_count = QuestionnaireAnswer.objects.filter(user=user).count()
        if questionnaire_count > 0:
            profile_completion += min(30, questionnaire_count * 6)
        
        # Update dashboard stats
        dashboard_stats.profile_completion = profile_completion
        dashboard_stats.assessment_completed = questionnaire_count > 0
        dashboard_stats.career_matches = dashboard_stats.career_matches or 0
        dashboard_stats.skills_analyzed = skills_count
        dashboard_stats.save()
        
        serializer = DashboardStatsSerializer(dashboard_stats)
        return Response(serializer.data)


class RegisterView(APIView):
    """Register a new user account"""
    permission_classes = [permissions.AllowAny]

    @swagger_auto_schema(
        operation_description="Register a new user account",
        tags=["1. Authentication"],
        request_body=UserRegistrationSerializer,
        responses={
            201: openapi.Response(
                description="User registered successfully",
                examples={
                    "application/json": {
                        "message": "User registered successfully",
                        "user": {
                            "id": 1,
                            "username": "john_doe",
                            "email": "john@example.com",
                            "first_name": "John",
                            "last_name": "Doe"
                        },
                        "tokens": {
                            "refresh": "string",
                            "access": "string"
                        }
                    }
                }
            ),
            400: "Bad Request"
        }
    )
    def post(self, request, *args, **kwargs):
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'User registered successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """Authenticate user and return JWT tokens"""
    permission_classes = [permissions.AllowAny]
    serializer_class = UserLoginSerializer

    @swagger_auto_schema(
        operation_description="Authenticate user and return JWT tokens",
        tags=["1. Authentication"],
        request_body=UserLoginSerializer,
        responses={
            200: openapi.Response(
                description="Login successful",
                examples={
                    "application/json": {
                        "message": "Login successful",
                        "user": {
                            "id": 1,
                            "username": "john_doe",
                            "email": "john@example.com",
                            "first_name": "John",
                            "last_name": "Doe"
                        },
                        "tags": {
                            "refresh": "string",
                            "access": "string"
                        }
                    }
                }
            ),
            400: "Bad Request - Invalid input",
            401: "Invalid credentials"
        }
    )
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']

        user = authenticate(username=username, password=password)

        if not user:
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)


class ProfileView(APIView):
    """Get or update user profile"""
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Get user profile",
        tags=["2. User Profile"],
        responses={
            200: UserProfileSerializer,
            404: "Profile not found"
        }
    )
    def get(self, request, *args, **kwargs):
        try:
            profile = request.user.userprofile
            serializer = UserProfileSerializer(profile)
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

    @swagger_auto_schema(
        operation_description="Update user profile",
        tags=["2. User Profile"],
        request_body=UserProfileUpdateSerializer,
        responses={
            200: UserProfileSerializer,
            400: "Bad Request",
            404: "Profile not found"
        }
    )
    def put(self, request, *args, **kwargs):
        try:
            profile = request.user.userprofile
            serializer = UserProfileUpdateSerializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            response_serializer = UserProfileSerializer(profile)
            return Response(response_serializer.data)
        except UserProfile.DoesNotExist:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
