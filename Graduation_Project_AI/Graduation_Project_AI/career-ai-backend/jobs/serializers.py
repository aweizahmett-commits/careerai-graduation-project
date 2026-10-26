from rest_framework import serializers
from django.contrib.auth.models import User
from .models import JobListing, JobPost, JobApplication, ResumeData, AssessmentResult, CareerMatch, AggregatedJob


class JobListingSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobListing
        fields = ('id', 'title', 'company', 'location', 'salary', 'apply_link', 'description', 
                  'source', 'logo', 'job_type', 'posted_date', 'is_remote', 'is_active', 
                  'created_at', 'updated_at')
        read_only_fields = ('created_at', 'updated_at')


class JobPostSerializer(serializers.ModelSerializer):
    job_provider_name = serializers.CharField(source='job_provider.get_full_name', read_only=True)
    applications_count = serializers.SerializerMethodField()

    class Meta:
        model = JobPost
        fields = ('id', 'title', 'description', 'required_skills', 'number_of_students_needed',
                  'job_provider', 'job_provider_name', 'institution', 'department', 'location',
                  'start_date', 'end_date', 'stipend_salary', 'status', 'is_featured',
                  'created_at', 'updated_at', 'deadline', 'applications_count')
        read_only_fields = ('job_provider', 'job_provider_name', 'applications_count', 
                          'created_at', 'updated_at')

    def get_applications_count(self, obj):
        return obj.applications.count()

    def create(self, validated_data):
        # Set the job provider to the current user
        validated_data['job_provider'] = self.context['request'].user
        return super().create(validated_data)


class JobPostCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobPost
        fields = ('id', 'title', 'description', 'required_skills', 'number_of_students_needed',
                 'institution', 'department', 'location', 'deadline', 'status', 'created_at')
        read_only_fields = ('id', 'created_at', 'institution')

    def create(self, validated_data):
        # Set the job provider to the current user
        validated_data['job_provider'] = self.context['request'].user
        return super().create(validated_data)


class JobApplicationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student_full_name', read_only=True)
    job_title = serializers.CharField(source='job_post.title', read_only=True)

    class Meta:
        model = JobApplication
        fields = ('id', 'student', 'student_name', 'job_post', 'job_title', 'status',
                  'student_full_name', 'student_department', 'student_academic_year', 'student_number',
                  'resume_file', 'cover_letter', 'applied_at', 'updated_at')
        read_only_fields = ('student', 'applied_at', 'updated_at')

    def create(self, validated_data):
        # Set the student to the current user
        validated_data['student'] = self.context['request'].user
        return super().create(validated_data)


class JobApplicationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating job applications"""
    
    class Meta:
        model = JobApplication
        fields = ('job_post', 'student_full_name', 'student_department', 'student_academic_year', 
                  'student_number', 'cover_letter', 'resume_file')
    
    def create(self, validated_data):
        # Set the student to the current user
        user = self.context['request'].user
        validated_data['student'] = user
        
        # Handle cv_file field name from frontend
        request = self.context['request']
        if 'cv_file' in request.FILES and 'resume_file' not in validated_data:
            validated_data['resume_file'] = request.FILES['cv_file']
        
        return super().create(validated_data)


class JobApplicationUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating job applications (for employers)"""
    
    class Meta:
        model = JobApplication
        fields = ('status', 'notes', 'interview_date')
        read_only_fields = ('student', 'job_post')


class JobSearchSerializer(serializers.Serializer):
    keyword = serializers.CharField(max_length=200, required=False)
    company = serializers.CharField(max_length=200, required=False)
    location = serializers.CharField(max_length=200, required=False)
    min_salary = serializers.IntegerField(required=False)
    max_salary = serializers.IntegerField(required=False)
    page_size = serializers.IntegerField(default=20, min_value=1, max_value=100)


class ResumeDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResumeData
        fields = ('id', 'file_name', 'file_type', 'extracted_skills', 'education', 'experience', 
                  'contact_info', 'is_processed', 'processing_status', 'file_size', 'upload_date')
        read_only_fields = ('id', 'upload_date', 'is_processed', 'processing_status')

    def create(self, validated_data):
        # Set the user to the current user
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class AssessmentResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentResult
        fields = ('id', 'answers', 'personality_type', 'personality_traits', 'strengths', 'interests',
                  'analytical_score', 'creative_score', 'communication_score', 'leadership_score',
                  'completed_at', 'last_updated')
        read_only_fields = ('id', 'completed_at', 'last_updated')

    def create(self, validated_data):
        # Set the user to the current user
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class CareerMatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = CareerMatch
        fields = ('id', 'job_title', 'match_score', 'reason', 'required_skills', 'missing_skills',
                  'career_category', 'typical_salary_range', 'growth_potential', 'matching_factors',
                  'confidence_level', 'generated_at', 'last_updated')
        read_only_fields = ('id', 'generated_at', 'last_updated')

    def create(self, validated_data):
        # Set the user to the current user
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class AssessmentSubmitSerializer(serializers.Serializer):
    answers = serializers.JSONField(help_text="Assessment answers and responses")
    
    def validate_answers(self, value):
        if not value or not isinstance(value, dict):
            raise serializers.ValidationError("Answers must be a valid JSON object")
        return value


class AggregatedJobSerializer(serializers.ModelSerializer):
    """Serializer for AggregatedJob model - jobs from external APIs"""
    
    class Meta:
        model = AggregatedJob
        fields = (
            'id', 'title', 'company', 'location', 'description', 'salary', 
            'apply_url', 'source', 'external_id', 'job_type', 'remote_type',
            'is_active', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class JobRecommendationSerializer(serializers.ModelSerializer):
    """Serializer for job recommendations with AI match score"""
    match_score = serializers.IntegerField(read_only=True, help_text="AI-calculated match score based on user skills")
    
    class Meta:
        model = AggregatedJob
        fields = (
            'id', 'title', 'company', 'location', 'description', 'salary', 
            'apply_url', 'source', 'external_id', 'job_type', 'remote_type',
            'is_active', 'created_at', 'updated_at', 'match_score'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'match_score')
