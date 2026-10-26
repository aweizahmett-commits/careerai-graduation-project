from django.db import models
from django.contrib.auth.models import User


class ChatSession(models.Model):
    """Chat session for user conversations"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    session_id = models.CharField(max_length=100, unique=True)
    title = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"Chat {self.session_id} - {self.user.username}"


class ChatMessage(models.Model):
    """Individual chat messages"""
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system', 'System'),
    ]
    
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.role}: {self.content[:50]}..."


class ChatbotIntent(models.Model):
    """Predefined intents for chatbot responses"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    keywords = models.JSONField(default=list)
    response_template = models.TextField()
    is_active = models.BooleanField(default=True)
    priority = models.IntegerField(default=0)

    def __str__(self):
        return self.name


class ChatbotKnowledge(models.Model):
    """Knowledge base for career advice"""
    category = models.CharField(max_length=100)
    question = models.TextField()
    answer = models.TextField()
    keywords = models.JSONField(default=list)
    confidence_score = models.FloatField(default=1.0)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ['category', 'question']

    def __str__(self):
        return f"{self.category}: {self.question[:50]}..."
