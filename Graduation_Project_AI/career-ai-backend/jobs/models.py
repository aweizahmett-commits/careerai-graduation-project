from django.db import models
from django.contrib.auth.models import User
from ai_engine.models import ResumeUpload


class SkillDatabase(models.Model):
    """Comprehensive database of all possible skills for AI matching"""
    
    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=50, choices=[
        ('programming', 'Programming Languages'),
        ('web_development', 'Web Development'),
        ('web_frameworks', 'Web Frameworks'),
        ('data_science', 'Data Science & Analytics'),
        ('machine_learning', 'Machine Learning & AI'),
        ('cloud_devops', 'Cloud & DevOps'),
        ('databases', 'Databases'),
        ('mobile_development', 'Mobile Development'),
        ('software_tools', 'Software Tools'),
        ('methodologies', 'Methodologies & Practices'),
        ('soft_skills', 'Soft Skills'),
        ('business_skills', 'Business Skills'),
        ('design_skills', 'Design Skills'),
        ('certifications', 'Certifications'),
    ])
    
    # Skill metadata
    description = models.TextField(blank=True)
    synonyms = models.JSONField(default=list, blank=True)  # Alternative names
    related_skills = models.JSONField(default=list, blank=True)  # Related skill names
    
    # Matching information
    proficiency_levels = models.JSONField(default=list, blank=True)  # Beginner, Intermediate, Advanced
    typical_years_experience = models.FloatField(null=True, blank=True)
    demand_level = models.IntegerField(choices=[(i, i) for i in range(1, 6)], default=3)  # 1-5 scale
    
    # Industry relevance
    industries = models.JSONField(default=list, blank=True)
    job_titles = models.JSONField(default=list, blank=True)
    
    # AI matching weights
    technical_weight = models.FloatField(default=1.0)
    business_weight = models.FloatField(default=0.5)
    creative_weight = models.FloatField(default=0.3)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['category', 'name']
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['demand_level']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"


class JobListing(models.Model):
    title = models.CharField(max_length=200)
    company = models.CharField(max_length=200)
    location = models.CharField(max_length=200)
    salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    description = models.TextField()
    requirements = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} at {self.company}"


class AggregatedJob(models.Model):
    """Jobs aggregated from external APIs (Remotive, Arbeitnow, JSearch)"""
    
    # Required job information
    title = models.CharField(max_length=200, db_index=True)
    company = models.CharField(max_length=200, db_index=True)
    location = models.CharField(max_length=200, default="Remote", db_index=True)
    description = models.TextField(blank=True)
    salary = models.CharField(max_length=100, blank=True, help_text="Salary information")
    apply_url = models.URLField(max_length=500, help_text="Apply link")
    
    # Source information
    source = models.CharField(max_length=20, choices=[
        ('JSearch', 'JSearch'),
        ('Remotive', 'Remotive'),
        ('Arbeitnow', 'Arbeitnow'),
        ('Adzuna', 'Adzuna'),
    ])
    
    # External API data
    external_id = models.CharField(max_length=100, blank=True, help_text="ID from external API")
    job_type = models.CharField(max_length=50, blank=True, help_text="Full-time, Part-time, Contract, etc.")
    remote_type = models.CharField(max_length=50, blank=True, help_text="Fully remote, hybrid, etc.")
    
    # Metadata
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['title', 'company', 'source']  # Prevent duplicates per source
        indexes = [
            models.Index(fields=['title']),  # Fast search by title
            models.Index(fields=['company']),  # Fast search by company
            models.Index(fields=['location']),  # Fast search by location
            models.Index(fields=['source', '-created_at']),
            models.Index(fields=['is_active', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} at {self.company} ({self.source})"


class JobRecommendation(models.Model):
    """AI-powered job recommendations for users"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    resume = models.ForeignKey(ResumeUpload, on_delete=models.CASCADE, null=True, blank=True)
    
    # Job details
    title = models.CharField(max_length=200)
    company = models.CharField(max_length=200)
    location = models.CharField(max_length=200)
    description = models.TextField()
    requirements = models.TextField(blank=True)
    salary_range = models.CharField(max_length=100, blank=True)
    job_type = models.CharField(max_length=50, choices=[
        ('full_time', 'Full Time'),
        ('part_time', 'Part Time'),
        ('contract', 'Contract'),
        ('internship', 'Internship'),
        ('remote', 'Remote'),
    ])
    
    # AI matching data
    match_score = models.FloatField(help_text="AI-calculated match percentage (0-100)")
    skill_match_score = models.FloatField(null=True, blank=True)
    experience_match_score = models.FloatField(null=True, blank=True)
    education_match_score = models.FloatField(null=True, blank=True)
    
    # Matching details
    matched_skills = models.JSONField(default=list, blank=True)
    missing_skills = models.JSONField(default=list, blank=True)
    match_reasons = models.JSONField(default=list, blank=True)
    improvement_suggestions = models.JSONField(default=list, blank=True)
    
    # Source and metadata
    source = models.CharField(max_length=50, choices=[
        ('internal', 'Internal Database'),
        ('linkedin', 'LinkedIn'),
        ('indeed', 'Indeed'),
        ('glassdoor', 'Glassdoor'),
        ('api', 'External API'),
    ], default='internal')
    
    external_job_id = models.CharField(max_length=100, blank=True)
    application_url = models.URLField(blank=True)
    posted_date = models.DateTimeField(null=True, blank=True)
    
    # User interaction
    is_saved = models.BooleanField(default=False)
    is_applied = models.BooleanField(default=False)
    is_viewed = models.BooleanField(default=False)
    user_rating = models.IntegerField(null=True, blank=True, choices=[(i, i) for i in range(1, 6)])
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-match_score', '-created_at']
        indexes = [
            models.Index(fields=['user', '-match_score']),
            models.Index(fields=['source']),
        ]

    def __str__(self):
        return f"{self.title} at {self.company} ({self.match_score}%)"


class UserProfileSkill(models.Model):
    """User's skills with proficiency levels"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    skill_name = models.CharField(max_length=100)
    proficiency_level = models.IntegerField(choices=[
        (1, 'Beginner'),
        (2, 'Novice'),
        (3, 'Intermediate'),
        (4, 'Advanced'),
        (5, 'Expert'),
    ])
    
    # Skill categorization
    category = models.CharField(max_length=50, choices=[
        ('programming', 'Programming'),
        ('web_development', 'Web Development'),
        ('data_science', 'Data Science'),
        ('cloud_devops', 'Cloud/DevOps'),
        ('databases', 'Databases'),
        ('mobile', 'Mobile Development'),
        ('tools_software', 'Tools/Software'),
        ('methodologies', 'Methodologies'),
        ('soft_skills', 'Soft Skills'),
    ])
    
    years_experience = models.FloatField(null=True, blank=True)
    last_used = models.DateField(null=True, blank=True)
    is_preferred = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'skill_name']
        ordering = ['-proficiency_level', 'skill_name']

    def __str__(self):
        return f"{self.user.username} - {self.skill_name} ({self.get_proficiency_level_display()})"


class JobMatchingCriteria(models.Model):
    """User's job preferences and criteria for matching"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    # Job preferences
    preferred_job_types = models.JSONField(default=list, blank=True)
    preferred_locations = models.JSONField(default=list, blank=True)
    salary_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    salary_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    remote_preference = models.CharField(max_length=20, choices=[
        ('any', 'Any'),
        ('remote_only', 'Remote Only'),
        ('hybrid', 'Hybrid'),
        ('onsite', 'On-site Only'),
    ], default='any')
    
    # Industry preferences
    preferred_industries = models.JSONField(default=list, blank=True)
    company_sizes = models.JSONField(default=list, blank=True)  # small, medium, large, enterprise
    
    # Matching weights (how important each factor is)
    skill_match_weight = models.FloatField(default=0.4)
    experience_match_weight = models.FloatField(default=0.2)
    education_match_weight = models.FloatField(default=0.1)
    location_match_weight = models.FloatField(default=0.1)
    salary_match_weight = models.FloatField(default=0.2)
    
    # AI learning data
    feedback_history = models.JSONField(default=list, blank=True)
    learned_preferences = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - Matching Criteria"


class MatchingFeedback(models.Model):
    """User feedback on job recommendations for AI learning"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    recommendation = models.ForeignKey(JobRecommendation, on_delete=models.CASCADE)
    
    feedback_type = models.CharField(max_length=20, choices=[
        ('liked', 'Liked'),
        ('disliked', 'Disliked'),
        ('applied', 'Applied'),
        ('saved', 'Saved'),
        ('not_interested', 'Not Interested'),
    ])
    
    feedback_score = models.IntegerField(null=True, blank=True)  # 1-5 rating
    feedback_text = models.TextField(blank=True)
    
    # What factors influenced the decision
    relevant_factors = models.JSONField(default=list, blank=True)  # skills, salary, location, etc.
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'recommendation']

    def __str__(self):
        return f"{self.user.username} - {self.feedback_type} - {self.recommendation.title}"


class JobPost(models.Model):
    """Jobs created by job providers (professors/employers)"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('closed', 'Closed'),
        ('draft', 'Draft'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    required_skills = models.JSONField(default=list, help_text="List of required skills")
    number_of_students_needed = models.PositiveIntegerField(default=1)
    
    # Job provider relationship
    job_provider = models.ForeignKey(User, on_delete=models.CASCADE, related_name='job_posts')
    institution = models.CharField(max_length=200, help_text="Institution or Company")
    
    # Additional details
    department = models.CharField(max_length=100, blank=True)
    location = models.CharField(max_length=200, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    stipend_salary = models.CharField(max_length=100, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_featured = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deadline = models.DateTimeField(null=True, blank=True, help_text="Application deadline")

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['job_provider', '-created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"{self.title} at {self.institution}"


class JobApplication(models.Model):
    """Student applications to job posts"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
    ]
    
    job_post = models.ForeignKey(JobPost, on_delete=models.CASCADE, related_name='applications')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='job_applications')
    
    # Student information (cached for easy access)
    student_full_name = models.CharField(max_length=200)
    student_department = models.CharField(max_length=100, blank=True)
    student_academic_year = models.CharField(max_length=50, blank=True)
    student_number = models.CharField(max_length=50, blank=True)
    
    # Application details
    cover_letter = models.TextField(blank=True)
    resume_file = models.FileField(upload_to='application_resumes/', null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Job provider actions
    notes = models.TextField(blank=True, help_text="Notes from job provider")
    interview_date = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['job_post', 'student']
        ordering = ['-applied_at']
        indexes = [
            models.Index(fields=['job_post', 'status']),
            models.Index(fields=['student', '-applied_at']),
        ]

    def __str__(self):
        return f"{self.student_full_name} - {self.job_post.title}"


class ResumeData(models.Model):
    """Store uploaded resume data and extracted information"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='resume_data')
    raw_file = models.FileField(upload_to='resumes/')
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=10, choices=[
        ('pdf', 'PDF'),
        ('docx', 'DOCX'),
        ('doc', 'DOC'),
    ])
    
    # Extracted data
    extracted_skills = models.JSONField(default=list, blank=True, help_text="List of extracted skills")
    education = models.JSONField(default=list, blank=True, help_text="Education history")
    experience = models.JSONField(default=list, blank=True, help_text="Work experience")
    contact_info = models.JSONField(default=dict, blank=True, help_text="Contact information")
    
    # Processing status
    is_processed = models.BooleanField(default=False)
    processing_status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ], default='pending')
    
    # Metadata
    file_size = models.IntegerField(null=True, blank=True)
    upload_date = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-upload_date']
        indexes = [
            models.Index(fields=['user', '-upload_date']),
            models.Index(fields=['processing_status']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.file_name}"


class AssessmentResult(models.Model):
    """Store assessment results and personality analysis"""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='assessment_result')
    
    # Assessment answers
    answers = models.JSONField(help_text="Assessment answers and responses")
    
    # Analysis results
    personality_type = models.CharField(max_length=50, help_text="Primary personality type")
    personality_traits = models.JSONField(default=list, blank=True, help_text="Detailed personality traits")
    
    # Strengths and interests
    strengths = models.JSONField(default=list, blank=True, help_text="Identified strengths")
    interests = models.JSONField(default=list, blank=True, help_text="Career interests")
    
    # Scores
    analytical_score = models.FloatField(default=0.0, help_text="Analytical thinking score")
    creative_score = models.FloatField(default=0.0, help_text="Creative thinking score")
    communication_score = models.FloatField(default=0.0, help_text="Communication score")
    leadership_score = models.FloatField(default=0.0, help_text="Leadership score")
    
    # Metadata
    completed_at = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['user', '-completed_at']),
            models.Index(fields=['personality_type']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.personality_type}"


class CareerMatch(models.Model):
    """Store career matching results for users"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='career_matches')
    job_title = models.CharField(max_length=100)
    match_score = models.FloatField(help_text="Match percentage (0-100)")
    
    # Matching details
    reason = models.TextField(help_text="Why this career matches the user")
    required_skills = models.JSONField(default=list, blank=True, help_text="Skills required for this career")
    missing_skills = models.JSONField(default=list, blank=True, help_text="Skills user needs to develop")
    
    # Career information
    career_category = models.CharField(max_length=50, help_text="Category of the career")
    typical_salary_range = models.CharField(max_length=100, blank=True, help_text="Typical salary range")
    growth_potential = models.CharField(max_length=20, choices=[
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ], default='medium')
    
    # Matching algorithm data
    matching_factors = models.JSONField(default=dict, blank=True, help_text="Factors used in matching")
    confidence_level = models.FloatField(default=0.0, help_text="Confidence in this match")
    
    # Metadata
    generated_at = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-match_score', '-generated_at']
        indexes = [
            models.Index(fields=['user', '-match_score']),
            models.Index(fields=['career_category']),
            models.Index(fields=['-generated_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.job_title} ({self.match_score}%)"
