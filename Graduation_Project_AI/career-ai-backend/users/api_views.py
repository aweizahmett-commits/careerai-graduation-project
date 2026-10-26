from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from .models import UserProfile
from .serializers import (
    UserRegistrationSerializer, 
    JobProviderRegistrationSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    UserProfileUpdateSerializer,
    EmployerProfileSerializer
)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
@swagger_auto_schema(
    operation_description="Register a new user account",
    request_body=UserRegistrationSerializer,
    responses={
        201: "User registered successfully",
        400: "Bad Request"
    }
)
def register(request):
    serializer = UserRegistrationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
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


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
@swagger_auto_schema(
    operation_description="Register a new job provider (professor/employer) account",
    request_body=JobProviderRegistrationSerializer,
    responses={
        201: "Job provider registered successfully",
        400: "Bad Request"
    }
)
def register_job_provider(request):
    serializer = JobProviderRegistrationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    refresh = RefreshToken.for_user(user)
    return Response({
        'message': 'Job provider registered successfully',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': 'job_provider'
        },
        'tokens': {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
    }, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
@swagger_auto_schema(
    operation_description="Authenticate user and return JWT tokens",
    request_body=UserLoginSerializer,
    responses={
        200: "Login successful",
        400: "Bad Request - Invalid input",
        401: "Invalid credentials"
    }
)
def login(request):
    serializer = UserLoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    username = serializer.validated_data['username']
    password = serializer.validated_data['password']

    user = authenticate(username=username, password=password)

    if not user:
        return Response({
            'error': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)

    refresh = RefreshToken.for_user(user)
    
    # Get user role
    try:
        role = user.userprofile.role
    except UserProfile.DoesNotExist:
        role = 'student'
    
    return Response({
        'message': 'Login successful',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': role
        },
        'tokens': {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
    }, status=status.HTTP_200_OK)


@api_view(["GET", "PUT"])
@permission_classes([permissions.IsAuthenticated])
@swagger_auto_schema(
    request_body=UserProfileUpdateSerializer,
    responses={
        200: UserProfileSerializer,
        400: "Bad Request",
        404: "Profile not found"
    }
)
def profile(request):
    try:
        profile = request.user.userprofile
    except UserProfile.DoesNotExist:
        return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = UserProfileUpdateSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        response_serializer = UserProfileSerializer(profile)
        return Response(response_serializer.data)
