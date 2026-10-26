import uuid
from django.db import models
from django.contrib.auth.models import User


class Career(models.Model):
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    description = models.TextField()
    salary_range = models.CharField(max_length=100, help_text="e.g., '$60,000 - $80,000'")
    growth_rate = models.CharField(max_length=50, help_text="e.g., '15% (Much faster than average)'")
    required_skills = models.JSONField(default=list, blank=True, help_text="List of required skills")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['title']

    def __str__(self):
        return f"{self.title} - {self.category}"


class SavedCareer(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    career = models.ForeignKey(Career, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'career']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.career.title}"


class CareerQuestion(models.Model):
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=[
        ('single_choice', 'Single Choice'),
        ('multiple_choice', 'Multiple Choice'),
        ('text', 'Text'),
        ('scale', 'Scale (1-10)'),
    ])
    options = models.JSONField(default=dict, blank=True, help_text="JSON object with options for choice questions")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Question {self.id}: {self.question_text[:50]}..."


class QuestionnaireAnswer(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    question = models.ForeignKey(CareerQuestion, on_delete=models.CASCADE)
    answer = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'question']

    def __str__(self):
        return f"{self.user.username} - Question {self.question.id}"


class CareerRecommendation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    career_name = models.CharField(max_length=200)
    score = models.FloatField(help_text="Recommendation score from 0 to 100")
    reasoning = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-score']

    def __str__(self):
        return f"{self.user.username} - {self.career_name} ({self.score}%)"

# --- MOCK INTERVIEW SIMULATOR MODELS ---

class InterviewSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    career_role = models.CharField(max_length=255)
    interview_type = models.CharField(max_length=50, choices=[
        ('technical', 'Technical'),
        ('behavioral', 'Behavioral'),
        ('mixed', 'Mixed')
    ])
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    overall_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['started_at']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.career_role} ({self.interview_type})"


class InterviewQuestion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(InterviewSession, related_name='questions', on_delete=models.CASCADE)
    question_text = models.TextField()
    order_number = models.IntegerField()

    class Meta:
        indexes = [
            models.Index(fields=['session']),
        ]

    def __str__(self):
        return f"Q{self.order_number}: {self.question_text[:50]}"


class InterviewAnswer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.OneToOneField(InterviewQuestion, related_name='answer', on_delete=models.CASCADE)
    answer_text = models.TextField()
    answer_audio_url = models.URLField(max_length=1024, null=True, blank=True)
    feedback_text = models.TextField()
    score = models.DecimalField(max_digits=5, decimal_places=2)
    strengths = models.JSONField(default=list)
    improvements = models.JSONField(default=list)
    suggested_rewrite = models.TextField(null=True, blank=True)
    confidence_level = models.CharField(max_length=20, choices=[
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High')
    ])
    time_taken_seconds = models.IntegerField()

    class Meta:
        indexes = [
            models.Index(fields=['question']),
        ]

    def __str__(self):
        return f"Answer to {self.question.id}"


class SavedAnswer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    question_text = models.TextField()
    answer_text = models.TextField()
    career_role = models.CharField(max_length=255)
    feedback_summary = models.TextField()
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['saved_at']),
        ]

    def __str__(self):
        return f"Saved Answer: {self.user.username} - {self.career_role}"
