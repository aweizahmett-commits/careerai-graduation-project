from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, UserSkill, DashboardStats


class UserSkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSkill
        fields = ('id', 'skill_name', 'proficiency_level', 'source', 'created_at', 'updated_at')
        read_only_fields = ('created_at', 'updated_at')


class DashboardStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardStats
        fields = ('profile_completion', 'assessment_completed', 'career_matches', 
                 'skills_analyzed', 'last_updated')
        read_only_fields = ('last_updated',)


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm', 'first_name', 'last_name')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        UserProfile.objects.create(user=user)
        DashboardStats.objects.create(user=user)
        return user


class JobProviderRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    institution = serializers.CharField(max_length=200)
    phone_number = serializers.CharField(max_length=20)
    professional_description = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm', 'first_name', 'last_name',
                 'institution', 'phone_number', 'professional_description')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        
        # Extract job provider specific fields
        institution = validated_data.pop('institution')
        phone_number = validated_data.pop('phone_number')
        professional_description = validated_data.pop('professional_description', '')
        
        # Create user
        user = User.objects.create_user(**validated_data)
        
        # Create job provider profile
        UserProfile.objects.create(
            user=user,
            role='job_provider',
            institution=institution,
            phone_number=phone_number,
            professional_description=professional_description
        )
        DashboardStats.objects.create(user=user)
        
        return user


class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(max_length=128, write_only=True)

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if not username or not password:
            raise serializers.ValidationError("Both username and password are required.")
        
        # Check if the input is an email, and if so, find the username
        if '@' in username:
            try:
                user = User.objects.get(email=username)
                attrs['username'] = user.username
            except User.DoesNotExist:
                raise serializers.ValidationError("No user found with this email address.")
        
        return attrs


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ('resume_file', 'extracted_skills')
        extra_kwargs = {
            'extracted_skills': {'required': False}
        }


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)

    class Meta:
        model = UserProfile
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role',
                 'resume_file', 'extracted_skills', 'institution', 'phone_number', 
                 'professional_description', 'is_verified', 'created_at', 'updated_at')
        read_only_fields = ('created_at', 'updated_at')


class EmployerProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)

    class Meta:
        model = UserProfile
        fields = ('id', 'username', 'email', 'first_name', 'last_name',
                 'institution', 'phone_number', 'professional_description', 'is_verified')
        read_only_fields = ('id', 'username', 'email', 'is_verified')
