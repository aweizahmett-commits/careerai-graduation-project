from django.db import models
from django.contrib.auth.models import User


class UserSkill(models.Model):
    SKILL_SOURCES = [
        ('resume', 'Resume Extraction'),
        ('questionnaire', 'Questionnaire'),
        ('manual', 'Manual Entry'),
    ]
    
    PROFICIENCY_LEVELS = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
        ('expert', 'Expert'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    skill_name = models.CharField(max_length=100)
    proficiency_level = models.CharField(max_length=20, choices=PROFICIENCY_LEVELS, default='intermediate')
    source = models.CharField(max_length=20, choices=SKILL_SOURCES, default='manual')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'skill_name']
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.user.username} - {self.skill_name} ({self.proficiency_level})"


class DashboardStats(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    profile_completion = models.IntegerField(default=0, help_text="Percentage of profile completion (0-100)")
    assessment_completed = models.BooleanField(default=False)
    career_matches = models.IntegerField(default=0)
    skills_analyzed = models.IntegerField(default=0)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} Dashboard Stats"


class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('job_provider', 'Job Provider'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    resume_file = models.FileField(upload_to='resumes/', null=True, blank=True)
    extracted_skills = models.TextField(blank=True, help_text="JSON string of extracted skills")
    
    # Auth Methods
    AUTH_CHOICES = [('email', 'Email'), ('google', 'Google OAuth')]
    auth_method = models.CharField(max_length=20, choices=AUTH_CHOICES, default='email', help_text="Authentication method used")
    google_id = models.CharField(max_length=100, blank=True, null=True, help_text="Google OAuth user ID")
    google_picture = models.URLField(max_length=500, blank=True, null=True, help_text="Google profile picture URL")
    
    # Job Provider specific fields
    institution = models.CharField(max_length=200, blank=True, help_text="Institution or Company name")
    phone_number = models.CharField(max_length=20, blank=True)
    professional_description = models.TextField(blank=True, help_text="Short professional description")
    is_verified = models.BooleanField(default=False, help_text="For job providers")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile ({self.get_role_display()})"
