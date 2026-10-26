from rest_framework import serializers
from .models import ResumeUpload
from .services import ResumeProcessor, CareerRecommendationEngine
from careers.models import QuestionnaireAnswer, CareerRecommendation


class ResumeUploadRequestSerializer(serializers.Serializer):
    file = serializers.FileField(
        max_length=1000000,  # 10MB
        allow_empty_file=False,
        help_text="Resume file (PDF or DOCX format, max 10MB)"
    )


class ResumeUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResumeUpload
        fields = ('id', 'file', 'original_filename', 'file_size', 'file_type', 
                 'processed', 'extracted_skills', 'created_at')
        read_only_fields = ('original_filename', 'file_size', 'file_type', 
                           'processed', 'extracted_skills', 'created_at')


class ResumeUploadResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResumeUpload
        fields = ('id', 'original_filename', 'file_size', 'file_type', 
                 'processed', 'extracted_skills', 'created_at')


class CareerRecommendationResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = CareerRecommendation
        fields = ('id', 'career_name', 'score', 'reasoning', 'created_at')
        read_only_fields = ('created_at',)


class AIRecommendationsResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    user_skills = serializers.ListField(child=serializers.CharField())
    questionnaire_completed = serializers.BooleanField()
    recommendations = CareerRecommendationResponseSerializer(many=True)
