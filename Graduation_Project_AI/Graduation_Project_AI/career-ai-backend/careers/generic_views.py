from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.generics import ListAPIView, CreateAPIView
from rest_framework.views import APIView
from django.contrib.auth.models import User
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from .models import CareerQuestion, QuestionnaireAnswer, CareerRecommendation
from .serializers import (
    CareerQuestionSerializer, 
    QuestionnaireAnswerSerializer, 
    QuestionnaireSubmitSerializer,
    CareerRecommendationSerializer
)


class CareerQuestionsView(ListAPIView):
    """Get all active career questions"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CareerQuestionSerializer
    queryset = CareerQuestion.objects.filter(is_active=True)


class QuestionnaireAnswerView(APIView):
    """Submit questionnaire answers or retrieve existing answers"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = QuestionnaireSubmitSerializer

    @swagger_auto_schema(
        operation_description="Submit questionnaire answers or retrieve existing answers",
        request_body=QuestionnaireSubmitSerializer,
        responses={
            201: openapi.Response(
                description="Questionnaire submitted successfully",
                examples={
                    "application/json": {
                        "message": "Questionnaire submitted successfully",
                        "answers": [
                            {
                                "id": 1,
                                "question": 1,
                                "question_text": "What type of work environment do you prefer?",
                                "question_type": "single_choice",
                                "answer": "Remote",
                                "created_at": "2024-01-01T00:00:00Z"
                            }
                        ]
                    }
                }
            ),
            400: "Bad Request - Invalid data",
            401: "Unauthorized"
        }
    )
    def get(self, request, *args, **kwargs):
        answers = QuestionnaireAnswer.objects.filter(user=request.user)
        serializer = QuestionnaireAnswerSerializer(answers, many=True)
        return Response(serializer.data)
    
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        answers_data = serializer.validated_data['answers']
        
        # Clear existing answers for this user
        QuestionnaireAnswer.objects.filter(user=request.user).delete()
        
        # Save new answers
        created_answers = []
        for answer_data in answers_data:
            try:
                question = CareerQuestion.objects.get(
                    id=answer_data['question_id'], 
                    is_active=True
                )
                answer = QuestionnaireAnswer.objects.create(
                    user=request.user,
                    question=question,
                    answer=answer_data['answer']
                )
                created_answers.append(answer)
            except CareerQuestion.DoesNotExist:
                return Response({
                    'error': f"Question with id {answer_data['question_id']} not found"
                }, status=status.HTTP_400_BAD_REQUEST)
        
        response_serializer = QuestionnaireAnswerSerializer(created_answers, many=True)
        return Response({
            'message': 'Questionnaire submitted successfully',
            'answers': response_serializer.data
        }, status=status.HTTP_201_CREATED)
