from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
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


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
@swagger_auto_schema(
    responses={
        200: CareerQuestionSerializer(many=True),
        401: "Unauthorized"
    }
)
def career_questions(request):
    questions = CareerQuestion.objects.filter(is_active=True)
    serializer = CareerQuestionSerializer(questions, many=True)
    return Response(serializer.data)


@api_view(["GET", "POST"])
@permission_classes([permissions.IsAuthenticated])
@swagger_auto_schema(
    operation_description="Submit questionnaire answers or retrieve existing answers",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=['answers'],
        properties={
            'answers': openapi.Schema(
                type=openapi.TYPE_ARRAY,
                items=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    required=['question_id', 'answer'],
                    properties={
                        'question_id': openapi.Schema(type=openapi.TYPE_INTEGER, description='Question ID'),
                        'answer': openapi.Schema(type=openapi.TYPE_STRING, description='Answer to the question'),
                    }
                ),
                description='Array of question answers'
            )
        }
    ),
    consumes=['application/json'],
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
def questionnaire_answer(request):
    if request.method == 'GET':
        answers = QuestionnaireAnswer.objects.filter(user=request.user)
        serializer = QuestionnaireAnswerSerializer(answers, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = QuestionnaireSubmitSerializer(data=request.data)
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
