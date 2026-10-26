from rest_framework import serializers
from .models import (
    CareerQuestion, QuestionnaireAnswer, CareerRecommendation, Career, SavedCareer,
    InterviewSession, InterviewQuestion, InterviewAnswer, SavedAnswer
)


class CareerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Career
        fields = ('id', 'title', 'category', 'description', 'salary_range', 
                 'growth_rate', 'required_skills', 'created_at', 'updated_at', 'is_active')
        read_only_fields = ('created_at', 'updated_at')


class SavedCareerSerializer(serializers.ModelSerializer):
    career = CareerSerializer(read_only=True)
    career_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = SavedCareer
        fields = ('id', 'career', 'career_id', 'created_at')
        read_only_fields = ('created_at',)


class CareerQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CareerQuestion
        fields = ('id', 'question_text', 'question_type', 'options', 'is_active', 'created_at')
        read_only_fields = ('created_at',)


class QuestionnaireAnswerSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='question.question_text', read_only=True)
    question_type = serializers.CharField(source='question.question_type', read_only=True)

    class Meta:
        model = QuestionnaireAnswer
        fields = ('id', 'question', 'question_text', 'question_type', 'answer', 'created_at')
        read_only_fields = ('created_at',)


class QuestionnaireSubmitSerializer(serializers.Serializer):
    answers = serializers.ListField(
        child=serializers.DictField(),
        help_text="List of answers with question_id and answer fields"
    )

    def validate(self, attrs):
        for answer in attrs['answers']:
            if 'question_id' not in answer or 'answer' not in answer:
                raise serializers.ValidationError("Each answer must contain 'question_id' and 'answer' fields")
        return attrs


class CareerRecommendationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CareerRecommendation
        fields = ('id', 'career_name', 'score', 'reasoning', 'created_at')
        read_only_fields = ('created_at',)

class InterviewAnswerSerializer(serializers.ModelSerializer):
    score = serializers.FloatField()

    class Meta:
        model = InterviewAnswer
        fields = ('id', 'answer_text', 'answer_audio_url', 'feedback_text', 'score',
                  'strengths', 'improvements', 'suggested_rewrite', 'confidence_level',
                  'time_taken_seconds')


class InterviewQuestionSerializer(serializers.ModelSerializer):
    answer = serializers.SerializerMethodField()

    class Meta:
        model = InterviewQuestion
        fields = ('id', 'question_text', 'order_number', 'answer')

    def get_answer(self, obj):
        try:
            return InterviewAnswerSerializer(obj.answer).data
        except Exception:
            return None


class InterviewSessionSerializer(serializers.ModelSerializer):
    questions = InterviewQuestionSerializer(many=True, read_only=True)

    class Meta:
        model = InterviewSession
        fields = ('id', 'career_role', 'interview_type', 'started_at',
                  'completed_at', 'overall_score', 'questions')
        read_only_fields = ('id', 'started_at', 'completed_at', 'overall_score')


class CreateInterviewSessionSerializer(serializers.Serializer):
    career_role = serializers.CharField(max_length=255)
    interview_type = serializers.ChoiceField(choices=['technical', 'behavioral', 'mixed'])


class SubmitAnswerSerializer(serializers.Serializer):
    question_id = serializers.CharField()
    answer_text = serializers.CharField()
    time_taken_seconds = serializers.IntegerField(min_value=0)


class SavedAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedAnswer
        fields = ('id', 'question_text', 'answer_text', 'career_role', 'feedback_summary', 'saved_at')
        read_only_fields = ('id', 'saved_at')
