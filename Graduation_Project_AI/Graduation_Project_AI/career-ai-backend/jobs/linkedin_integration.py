import requests
import json
import os
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging
from django.conf import settings
from django.core.cache import cache
from .models import JobRecommendation
from .services import AIJobMatchingEngine

logger = logging.getLogger(__name__)


class LinkedInJobAPI:
    """LinkedIn API integration for real-time job listings"""
    
    def __init__(self):
        self.api_base_url = "https://api.linkedin.com/v2"
        self.access_token = None
        self.rate_limit_remaining = 100
        self.rate_limit_reset = datetime.now()
        
    def get_access_token(self) -> str:
        """Get LinkedIn API access token"""
        try:
            # Check if we have a cached token
            cached_token = cache.get('linkedin_access_token')
            if cached_token:
                return cached_token
            
            # Get new token using OAuth2
            client_id = getattr(settings, 'LINKEDIN_CLIENT_ID', '')
            client_secret = getattr(settings, 'LINKEDIN_CLIENT_SECRET', '')
            
            if not client_id or not client_secret:
                raise ValueError("LinkedIn API credentials not configured")
            
            token_url = "https://www.linkedin.com/oauth/v2/accessToken"
            data = {
                'grant_type': 'client_credentials',
                'client_id': client_id,
                'client_secret': client_secret
            }
            
            response = requests.post(token_url, data=data)
            response.raise_for_status()
            
            token_data = response.json()
            access_token = token_data['access_token']
            expires_in = token_data.get('expires_in', 3600)
            
            # Cache the token
            cache.set('linkedin_access_token', access_token, expires_in - 60)
            
            return access_token
            
        except Exception as e:
            logger.error(f"Error getting LinkedIn access token: {str(e)}")
            raise
    
    def search_jobs(self, keywords: str, location: str = None, limit: int = 50) -> List[Dict[str, Any]]:
        """Search for jobs on LinkedIn"""
        try:
            # Check rate limits
            if self.rate_limit_remaining <= 0:
                if datetime.now() < self.rate_limit_reset:
                    raise Exception("Rate limit exceeded")
            
            # Get access token
            if not self.access_token:
                self.access_token = self.get_access_token()
            
            # Build search parameters
            params = {
                'keywords': keywords,
                'count': min(limit, 50),  # LinkedIn API limit
                'sortBy': 'date'  # Most recent first
            }
            
            if location:
                params['location'] = location
            
            # Make API request
            url = f"{self.api_base_url}/jobSearch"
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(url, params=params, headers=headers)
            
            # Update rate limit info
            self.rate_limit_remaining = int(response.headers.get('X-RateLimit-Remaining', 0))
            reset_time = int(response.headers.get('X-RateLimit-Reset', 0))
            self.rate_limit_reset = datetime.fromtimestamp(reset_time)
            
            if response.status_code == 429:
                raise Exception("Rate limit exceeded")
            
            response.raise_for_status()
            
            # Parse response
            data = response.json()
            jobs = []
            
            for job_data in data.get('elements', []):
                job = self._parse_linkedin_job(job_data)
                if job:
                    jobs.append(job)
            
            return jobs
            
        except Exception as e:
            logger.error(f"Error searching LinkedIn jobs: {str(e)}")
            return []
    
    def _parse_linkedin_job(self, job_data: Dict) -> Optional[Dict[str, Any]]:
        """Parse LinkedIn job data into standard format"""
        try:
            # Extract basic job information
            title = job_data.get('title', '')
            company = job_data.get('companyName', '')
            description = job_data.get('description', {}).get('text', '')
            location = job_data.get('formattedLocation', '')
            
            # Extract salary information
            salary_info = job_data.get('salaryInfo', {})
            salary_range = ""
            if salary_info:
                salary = salary_info.get('salary', {})
                if salary:
                    currency = salary.get('currency', '')
                    amount = salary.get('amount', '')
                    salary_range = f"{currency} {amount}" if amount else ""
            
            # Extract job requirements
            requirements = ""
            skills = job_data.get('skills', [])
            if skills:
                skill_names = [skill.get('name', '') for skill in skills]
                requirements = "Required skills: " + ", ".join(skill_names)
            
            # Extract job posting date
            posted_date_str = job_data.get('listedAt', '')
            posted_date = None
            if posted_date_str:
                try:
                    posted_date = datetime.fromisoformat(posted_date_str.replace('Z', '+00:00'))
                except:
                    pass
            
            # Get application URL
            apply_url = job_data.get('applyMethod', {}).get('companyApplyUrl', '')
            
            # Determine job type
            employment_type = job_data.get('employmentType', '')
            job_type_mapping = {
                'FULL_TIME': 'full_time',
                'PART_TIME': 'part_time',
                'CONTRACT': 'contract',
                'INTERNSHIP': 'internship',
                'VOLUNTEER': 'volunteer'
            }
            job_type = job_type_mapping.get(employment_type, 'full_time')
            
            return {
                'id': job_data.get('id', ''),
                'title': title,
                'company': company,
                'location': location,
                'description': description,
                'requirements': requirements,
                'salary_range': salary_range,
                'job_type': job_type,
                'posted_date': posted_date,
                'application_url': apply_url,
                'source': 'linkedin',
                'external_id': job_data.get('id', '')
            }
            
        except Exception as e:
            logger.error(f"Error parsing LinkedIn job: {str(e)}")
            return None


class JobAggregatorService:
    """Service to aggregate jobs from multiple sources"""
    
    def __init__(self):
        self.linkedin_api = LinkedInJobAPI()
        self.matching_engine = AIJobMatchingEngine()
    
    def get_jobs_for_user(self, user, limit: int = 20) -> List[JobRecommendation]:
        """Get personalized job recommendations from multiple sources"""
        try:
            # Get user profile for search criteria
            user_profile = self.matching_engine._get_user_profile(user)
            matching_criteria = self.matching_engine._get_matching_criteria(user)
            
            all_jobs = []
            
            # Get jobs from LinkedIn
            linkedin_jobs = self._get_linkedin_jobs(user_profile, matching_criteria)
            all_jobs.extend(linkedin_jobs)
            
            # TODO: Add other job sources (Indeed, Glassdoor, etc.)
            # indeed_jobs = self._get_indeed_jobs(user_profile, matching_criteria)
            # all_jobs.extend(indeed_jobs)
            
            # Calculate match scores and create recommendations
            recommendations = []
            for job in all_jobs:
                match_result = self.matching_engine._calculate_job_match(job, user_profile, matching_criteria)
                
                if match_result['overall_score'] >= 30:  # Minimum match threshold
                    recommendation = self.matching_engine._create_recommendation(job, user, match_result)
                    recommendations.append(recommendation)
            
            # Sort by match score and apply diversity
            recommendations.sort(key=lambda x: x.match_score, reverse=True)
            recommendations = self.matching_engine._apply_diversity_filter(recommendations, limit)
            
            # Save recommendations to database
            self.matching_engine._save_recommendations(user, recommendations)
            
            return recommendations[:limit]
            
        except Exception as e:
            logger.error(f"Error getting jobs for user {user.id}: {str(e)}")
            return []
    
    def _get_linkedin_jobs(self, user_profile: Dict, matching_criteria: Dict) -> List[Dict]:
        """Get jobs from LinkedIn based on user profile"""
        try:
            # Build search keywords from user skills
            skills = user_profile.get('skills', [])
            job_titles = user_profile.get('job_titles', [])
            
            # Create search queries
            search_queries = []
            
            # Add skill-based searches
            if skills:
                top_skills = skills[:5]  # Top 5 skills
                search_queries.append(" ".join(top_skills))
            
            # Add job title searches
            for title in job_titles[:3]:  # Top 3 job titles
                search_queries.append(title)
            
            # Add general searches based on experience
            experience = user_profile.get('experience_years', 0)
            if experience >= 5:
                search_queries.append("senior")
            elif experience >= 2:
                search_queries.append("mid level")
            else:
                search_queries.append("entry level")
            
            # Get jobs for each query
            all_jobs = []
            for query in search_queries:
                try:
                    # Add location preference
                    location = None
                    preferred_locations = matching_criteria.get('preferred_locations', [])
                    if preferred_locations:
                        location = preferred_locations[0]
                    
                    jobs = self.linkedin_api.search_jobs(
                        keywords=query,
                        location=location,
                        limit=20
                    )
                    all_jobs.extend(jobs)
                    
                except Exception as e:
                    logger.error(f"Error searching LinkedIn for query '{query}': {str(e)}")
                    continue
            
            # Remove duplicates
            seen_jobs = set()
            unique_jobs = []
            for job in all_jobs:
                job_key = f"{job['title']}_{job['company']}"
                if job_key not in seen_jobs:
                    seen_jobs.add(job_key)
                    unique_jobs.append(job)
            
            return unique_jobs
            
        except Exception as e:
            logger.error(f"Error getting LinkedIn jobs: {str(e)}")
            return []
    
    def refresh_job_listings(self, user):
        """Refresh job listings for a user"""
        try:
            # Clear cache for this user
            cache.delete(f'job_recommendations_{user.id}')
            
            # Get fresh recommendations
            recommendations = self.get_jobs_for_user(user)
            
            logger.info(f"Refreshed {len(recommendations)} job recommendations for user {user.id}")
            return recommendations
            
        except Exception as e:
            logger.error(f"Error refreshing job listings for user {user.id}: {str(e)}")
            return []


class JobApplicationTracker:
    """Service to track job applications and provide insights"""
    
    def __init__(self):
        pass
    
    def track_application(self, user, job_id: str, application_status: str = 'applied') -> Dict[str, Any]:
        """Track a job application"""
        try:
            # Find the recommendation
            recommendation = JobRecommendation.objects.filter(
                user=user, 
                external_job_id=job_id,
                source='linkedin'
            ).first()
            
            if not recommendation:
                raise ValueError("Job recommendation not found")
            
            # Update recommendation status
            recommendation.is_applied = True
            recommendation.save()
            
            # Create feedback for learning
            from .models import MatchingFeedback
            feedback, created = MatchingFeedback.objects.get_or_create(
                user=user,
                recommendation=recommendation,
                defaults={
                    'feedback_type': 'applied',
                    'feedback_score': 4  # Positive feedback
                }
            )
            
            # Update user preferences
            matching_engine = AIJobMatchingEngine()
            feedback_data = {
                'liked': True,
                'company': recommendation.company,
                'title': recommendation.title,
                'industry': matching_engine._classify_job_industry({
                    'title': recommendation.title,
                    'description': recommendation.description,
                    'requirements': recommendation.requirements
                })
            }
            matching_engine.update_user_preferences(user, feedback_data)
            
            return {
                'success': True,
                'message': 'Application tracked successfully',
                'recommendation_id': recommendation.id
            }
            
        except Exception as e:
            logger.error(f"Error tracking application: {str(e)}")
            return {
                'success': False,
                'message': str(e)
            }
    
    def get_application_insights(self, user) -> Dict[str, Any]:
        """Get insights about user's job applications"""
        try:
            applications = JobRecommendation.objects.filter(
                user=user, 
                is_applied=True
            )
            
            total_applications = applications.count()
            
            # Application status breakdown
            status_breakdown = {
                'applied': applications.count(),
                'saved': JobRecommendation.objects.filter(user=user, is_saved=True).count(),
                'viewed': JobRecommendation.objects.filter(user=user, is_viewed=True).count()
            }
            
            # Company preferences
            company_counts = {}
            for app in applications:
                company_counts[app.company] = company_counts.get(app.company, 0) + 1
            
            top_companies = sorted(company_counts.items(), key=lambda x: x[1], reverse=True)[:5]
            
            # Application trends
            applications_by_date = {}
            for app in applications:
                date_key = app.created_at.strftime('%Y-%m-%d')
                applications_by_date[date_key] = applications_by_date.get(date_key, 0) + 1
            
            # Average match score of applied jobs
            avg_match_score = applications.aggregate(avg_score=Avg('match_score'))['avg_score'] or 0
            
            # Success rate (if we have feedback on interviews, etc.)
            # This would be expanded as we track more application stages
            
            return {
                'total_applications': total_applications,
                'status_breakdown': status_breakdown,
                'top_companies': top_companies,
                'applications_by_date': applications_by_date,
                'average_match_score': round(avg_match_score, 2),
                'application_rate': self._calculate_application_rate(user)
            }
            
        except Exception as e:
            logger.error(f"Error getting application insights: {str(e)}")
            return {}
    
    def _calculate_application_rate(self, user) -> float:
        """Calculate the rate at which user applies to recommended jobs"""
        try:
            total_recommendations = JobRecommendation.objects.filter(user=user).count()
            if total_recommendations == 0:
                return 0.0
            
            applied_count = JobRecommendation.objects.filter(user=user, is_applied=True).count()
            return round((applied_count / total_recommendations) * 100, 2)
            
        except Exception:
            return 0.0
