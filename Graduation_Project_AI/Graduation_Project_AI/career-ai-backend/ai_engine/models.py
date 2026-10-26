from django.db import models
from django.contrib.auth.models import User


class ResumeUpload(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    file = models.FileField(upload_to='resumes/')
    original_filename = models.CharField(max_length=255)
    file_size = models.IntegerField()
    file_type = models.CharField(max_length=10)
    processed = models.BooleanField(default=False)
    extracted_text = models.TextField(blank=True)
    
    # Enhanced AI Analysis Fields
    extracted_skills = models.JSONField(default=list, blank=True)
    experience_years = models.FloatField(null=True, blank=True)
    education_level = models.CharField(max_length=50, blank=True)
    job_titles = models.JSONField(default=list, blank=True)
    companies = models.JSONField(default=list, blank=True)
    certifications = models.JSONField(default=list, blank=True)
    languages = models.JSONField(default=list, blank=True)
    projects = models.JSONField(default=list, blank=True)
    
    # AI Analysis Results
    skill_categories = models.JSONField(default=dict, blank=True)
    experience_summary = models.TextField(blank=True)
    education_summary = models.TextField(blank=True)
    career_suggestions = models.JSONField(default=list, blank=True)
    match_scores = models.JSONField(default=dict, blank=True)
    
    # Processing metadata
    processing_time = models.FloatField(null=True, blank=True)
    ai_confidence_score = models.FloatField(null=True, blank=True)
    analysis_version = models.CharField(max_length=20, default='1.0')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.original_filename}"


class SkillCategory(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    parent_category = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True)
    
    def __str__(self):
        return self.name


class JobSkillRequirement(models.Model):
    skill_name = models.CharField(max_length=100)
    category = models.ForeignKey(SkillCategory, on_delete=models.SET_NULL, null=True, blank=True)
    importance_weight = models.FloatField(default=1.0)
    years_experience_required = models.FloatField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.skill_name} ({self.importance_weight})"
