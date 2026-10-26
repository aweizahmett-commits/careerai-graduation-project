from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, RetrieveAPIView, CreateAPIView, DestroyAPIView
from django.contrib.auth.models import User
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from .models import CareerQuestion, QuestionnaireAnswer, CareerRecommendation, Career, SavedCareer
from .serializers import (
    CareerQuestionSerializer, 
    QuestionnaireAnswerSerializer, 
    QuestionnaireSubmitSerializer,
    CareerRecommendationSerializer,
    CareerSerializer,
    SavedCareerSerializer
)


class CareerListView(ListAPIView):
    """List all available careers"""
    queryset = Career.objects.filter(is_active=True)
    serializer_class = CareerSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['category']
    search_fields = ['title', 'description']
    ordering_fields = ['title', 'created_at']

    @swagger_auto_schema(
        operation_description="Get list of all careers",
        tags=["Career Library"],
        responses={
            200: CareerSerializer(many=True),
            401: "Unauthorized"
        }
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class CareerDetailView(RetrieveAPIView):
    """Get details of a specific career"""
    queryset = Career.objects.filter(is_active=True)
    serializer_class = CareerSerializer
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Get details of a specific career",
        tags=["Career Library"],
        responses={
            200: CareerSerializer,
            404: "Career not found",
            401: "Unauthorized"
        }
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class SavedCareerListView(ListAPIView):
    """List user's saved careers"""
    serializer_class = SavedCareerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SavedCareer.objects.filter(user=self.request.user)

    @swagger_auto_schema(
        operation_description="Get user's saved careers",
        tags=["Saved Careers"],
        responses={
            200: SavedCareerSerializer(many=True),
            401: "Unauthorized"
        }
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class SaveCareerView(CreateAPIView):
    """Save a career for later viewing"""
    serializer_class = SavedCareerSerializer
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Save a career",
        tags=["Saved Careers"],
        request_body=SavedCareerSerializer,
        responses={
            201: SavedCareerSerializer,
            400: "Bad Request",
            401: "Unauthorized",
            409: "Career already saved"
        }
    )
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        career_id = serializer.validated_data['career_id']
        
        try:
            career = Career.objects.get(id=career_id, is_active=True)
        except Career.DoesNotExist:
            return Response({'error': 'Career not found'}, status=status.HTTP_404_NOT_FOUND)
        
        saved_career, created = SavedCareer.objects.get_or_create(
            user=request.user,
            career=career
        )
        
        if not created:
            return Response({'error': 'Career already saved'}, status=status.HTTP_409_CONFLICT)
        
        response_serializer = SavedCareerSerializer(saved_career)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class UnsaveCareerView(DestroyAPIView):
    """Remove a saved career"""
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Remove a saved career",
        tags=["Saved Careers"],
        responses={
            204: "Career unsaved successfully",
            404: "Saved career not found",
            401: "Unauthorized"
        }
    )
    def delete(self, request, *args, **kwargs):
        career_id = kwargs.get('id')
        
        try:
            saved_career = SavedCareer.objects.get(
                user=request.user,
                career_id=career_id
            )
            saved_career.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except SavedCareer.DoesNotExist:
            return Response({'error': 'Saved career not found'}, status=status.HTTP_404_NOT_FOUND)


class CareerQuestionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Get all active career questions",
        tags=["4. Career Questionnaire"],
        responses={
            200: CareerQuestionSerializer(many=True),
            401: "Unauthorized"
        }
    )
    def get(self, request):
        questions = CareerQuestion.objects.filter(is_active=True)
        serializer = CareerQuestionSerializer(questions, many=True)
        return Response(serializer.data)


class QuestionnaireAnswerView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Get user's questionnaire answers",
        tags=["4. Career Questionnaire"],
        responses={
            200: QuestionnaireAnswerSerializer(many=True),
            401: "Unauthorized"
        }
    )
    def get(self, request):
        answers = QuestionnaireAnswer.objects.filter(user=request.user)
        serializer = QuestionnaireAnswerSerializer(answers, many=True)
        return Response(serializer.data)

    @swagger_auto_schema(
        operation_description="Submit questionnaire answers",
        tags=["4. Career Questionnaire"],
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
    def post(self, request):
        serializer = QuestionnaireSubmitSerializer(data=request.data)
        if serializer.is_valid():
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
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
