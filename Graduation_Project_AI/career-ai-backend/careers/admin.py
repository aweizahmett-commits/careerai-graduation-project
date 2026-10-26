from django.contrib import admin
from .models import CareerQuestion, QuestionnaireAnswer, CareerRecommendation


@admin.register(CareerQuestion)
class CareerQuestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'question_text', 'question_type', 'is_active', 'created_at')
    list_filter = ('question_type', 'is_active', 'created_at')
    search_fields = ('question_text',)
    readonly_fields = ('created_at',)


@admin.register(QuestionnaireAnswer)
class QuestionnaireAnswerAdmin(admin.ModelAdmin):
    list_display = ('user', 'question', 'answer', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username', 'question__question_text')
    readonly_fields = ('created_at',)


@admin.register(CareerRecommendation)
class CareerRecommendationAdmin(admin.ModelAdmin):
    list_display = ('user', 'career_name', 'score', 'created_at')
    list_filter = ('score', 'created_at')
    search_fields = ('user__username', 'career_name')
    readonly_fields = ('created_at',)
