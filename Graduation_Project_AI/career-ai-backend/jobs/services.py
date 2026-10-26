import json
import re
from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta
from django.contrib.auth.models import User
from django.db.models import Q, Avg, Count
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import logging

from .models import JobRecommendation, UserProfileSkill, JobMatchingCriteria, MatchingFeedback
from ai_engine.models import ResumeUpload
from ai_engine.services import AdvancedResumeProcessor

logger = logging.getLogger(__name__)


class AIJobMatchingEngine:
    """AI-powered job matching and recommendation engine"""
    
    def __init__(self):
        self.resume_processor = AdvancedResumeProcessor()
        self.skill_weights = self._load_skill_weights()
        self.industry_mappings = self._load_industry_mappings()
    
    def _load_skill_weights(self) -> Dict[str, float]:
        """Load skill importance weights by category"""
        return {
            'programming': 1.0,
            'web_development': 1.0,
            'data_science': 1.2,
            'cloud_devops': 1.1,
            'databases': 0.9,
            'mobile': 1.0,
            'tools_software': 0.7,
            'methodologies': 0.8,
            'soft_skills': 0.6
        }
    
    def _load_industry_mappings(self) -> Dict[str, List[str]]:
        """Load industry-specific skill mappings"""
        return {
            'technology': ['python', 'java', 'javascript', 'react', 'aws', 'docker'],
            'finance': ['python', 'sql', 'excel', 'risk', 'trading', 'blockchain'],
            'healthcare': ['python', 'data science', 'machine learning', 'research', 'statistics'],
            'ecommerce': ['react', 'node.js', 'python', 'sql', 'aws', 'analytics'],
            'consulting': ['powerpoint', 'excel', 'communication', 'strategy', 'presentation'],
            'education': ['teaching', 'communication', 'research', 'writing', 'presentation']
        }
    
    def generate_recommendations(self, user: User, limit: int = 20) -> List[JobRecommendation]:
        """Generate personalized job recommendations for a user"""
        try:
            # Get user's profile data
            user_profile = self._get_user_profile(user)
            matching_criteria = self._get_matching_criteria(user)
            
            # Get all available jobs (internal + external)
            available_jobs = self._get_available_jobs(user_profile, matching_criteria)
            
            # Calculate match scores for each job
            recommendations = []
            for job in available_jobs:
                match_result = self._calculate_job_match(job, user_profile, matching_criteria)
                
                if match_result['overall_score'] >= 30:  # Minimum match threshold
                    recommendation = self._create_recommendation(job, user, match_result)
                    recommendations.append(recommendation)
            
            # Sort by match score and apply diversity
            recommendations.sort(key=lambda x: x.match_score, reverse=True)
            recommendations = self._apply_diversity_filter(recommendations, limit)
            
            # Save recommendations to database
            self._save_recommendations(user, recommendations)
            
            return recommendations[:limit]
            
        except Exception as e:
            logger.error(f"Error generating recommendations for user {user.id}: {str(e)}")
            return []
    
    def _get_user_profile(self, user: User) -> Dict[str, Any]:
        """Get comprehensive user profile data"""
        profile = {
            'user_id': user.id,
            'skills': [],
            'experience_years': 0,
            'education_level': None,
            'preferred_locations': [],
            'salary_expectations': {},
            'job_preferences': {}
        }
        
        # Get skills from resume analysis
        latest_resume = ResumeUpload.objects.filter(user=user, processed=True).first()
        if latest_resume:
            profile['skills'] = latest_resume.extracted_skills or []
            profile['skill_categories'] = latest_resume.skill_categories or {}
            profile['experience_years'] = latest_resume.experience_years or 0
            profile['education_level'] = latest_resume.education_level
            profile['job_titles'] = latest_resume.job_titles or []
            profile['companies'] = latest_resume.companies or []
        
        # Get user's explicit skill ratings
        user_skills = UserProfileSkill.objects.filter(user=user)
        for skill in user_skills:
            skill_data = {
                'name': skill.skill_name,
                'proficiency': skill.proficiency_level,
                'category': skill.category,
                'years_experience': skill.years_experience or 0,
                'is_preferred': skill.is_preferred
            }
            profile['skills'].append(skill_data['name'])
        
        return profile
    
    def _get_matching_criteria(self, user: User) -> Dict[str, Any]:
        """Get user's job matching preferences"""
        criteria, created = JobMatchingCriteria.objects.get_or_create(user=user)
        
        return {
            'preferred_job_types': criteria.preferred_job_types or [],
            'preferred_locations': criteria.preferred_locations or [],
            'salary_min': float(criteria.salary_min) if criteria.salary_min else 0,
            'salary_max': float(criteria.salary_max) if criteria.salary_max else 1000000,
            'remote_preference': criteria.remote_preference,
            'preferred_industries': criteria.preferred_industries or [],
            'company_sizes': criteria.company_sizes or [],
            'weights': {
                'skill_match': criteria.skill_match_weight,
                'experience_match': criteria.experience_match_weight,
                'education_match': criteria.education_match_weight,
                'location_match': criteria.location_match_weight,
                'salary_match': criteria.salary_match_weight,
            },
            'learned_preferences': criteria.learned_preferences or {}
        }
    
    def _get_available_jobs(self, user_profile: Dict, matching_criteria: Dict) -> List[Dict]:
        """Get available jobs from various sources"""
        jobs = []
        
        # Get internal job listings
        from .models import JobListing
        internal_jobs = JobListing.objects.filter(is_active=True)
        
        for job in internal_jobs:
            job_data = {
                'id': job.id,
                'title': job.title,
                'company': job.company,
                'location': job.location,
                'description': job.description,
                'requirements': job.requirements,
                'salary': float(job.salary) if job.salary else None,
                'source': 'internal',
                'external_id': None,
                'application_url': None
            }
            jobs.append(job_data)
        
        # TODO: Add external job sources (LinkedIn, Indeed, etc.)
        # This will be implemented in the LinkedIn integration phase
        
        return jobs
    
    def _calculate_job_match(self, job: Dict, user_profile: Dict, matching_criteria: Dict) -> Dict[str, Any]:
        """Calculate comprehensive match score for a job"""
        weights = matching_criteria['weights']
        
        # Skill matching
        skill_score, skill_details = self._calculate_skill_match(job, user_profile)
        
        # Experience matching
        experience_score, experience_details = self._calculate_experience_match(job, user_profile)
        
        # Education matching
        education_score, education_details = self._calculate_education_match(job, user_profile)
        
        # Location matching
        location_score, location_details = self._calculate_location_match(job, matching_criteria)
        
        # Salary matching
        salary_score, salary_details = self._calculate_salary_match(job, matching_criteria)
        
        # Apply learned preferences
        learning_boost = self._apply_learning_boost(job, user_profile, matching_criteria)
        
        # Calculate weighted overall score
        overall_score = (
            skill_score * weights['skill_match'] +
            experience_score * weights['experience_match'] +
            education_score * weights['education_match'] +
            location_score * weights['location_match'] +
            salary_score * weights['salary_match']
        ) + learning_boost
        
        # Cap at 100
        overall_score = min(overall_score, 100)
        
        return {
            'overall_score': round(overall_score, 2),
            'skill_score': round(skill_score, 2),
            'experience_score': round(experience_score, 2),
            'education_score': round(education_score, 2),
            'location_score': round(location_score, 2),
            'salary_score': round(salary_score, 2),
            'matched_skills': skill_details['matched_skills'],
            'missing_skills': skill_details['missing_skills'],
            'match_reasons': self._generate_match_reasons(skill_details, experience_details, education_details),
            'improvement_suggestions': self._generate_improvement_suggestions(skill_details, experience_details)
        }
    
    def _calculate_skill_match(self, job: Dict, user_profile: Dict) -> Tuple[float, Dict]:
        """Calculate skill compatibility score"""
        user_skills = set([skill.lower() for skill in user_profile['skills']])
        
        # Extract skills from job description
        job_text = f"{job['title']} {job['description']} {job['requirements']}"
        job_skills = set()
        
        # Use the resume processor to extract skills from job text
        extracted_skills = self.resume_processor._extract_skills(job_text)
        job_skills.update([skill.lower() for skill in extracted_skills])
        
        # Calculate matches
        matched_skills = list(user_skills & job_skills)
        missing_skills = list(job_skills - user_skills)
        
        # Calculate weighted score
        if not job_skills:
            return 0.0, {'matched_skills': [], 'missing_skills': []}
        
        # Weight skills by category importance
        total_weight = 0
        matched_weight = 0
        
        for skill in job_skills:
            category = self._get_skill_category(skill)
            weight = self.skill_weights.get(category, 1.0)
            total_weight += weight
            
            if skill in user_skills:
                matched_weight += weight
        
        skill_score = (matched_weight / total_weight) * 100 if total_weight > 0 else 0
        
        return skill_score, {
            'matched_skills': matched_skills,
            'missing_skills': missing_skills,
            'total_required': len(job_skills),
            'total_matched': len(matched_skills)
        }
    
    def _calculate_experience_match(self, job: Dict, user_profile: Dict) -> Tuple[float, Dict]:
        """Calculate experience compatibility"""
        user_experience = user_profile.get('experience_years', 0)
        
        # Extract required experience from job
        required_experience = self._extract_required_experience(job)
        
        if required_experience is None:
            return 100.0, {'user_experience': user_experience, 'required': None}
        
        # Calculate experience match
        if user_experience >= required_experience:
            score = 100.0
        elif user_experience >= required_experience * 0.8:
            score = 80.0
        elif user_experience >= required_experience * 0.6:
            score = 60.0
        elif user_experience >= required_experience * 0.4:
            score = 40.0
        else:
            score = 20.0
        
        return score, {
            'user_experience': user_experience,
            'required': required_experience,
            'gap': max(0, required_experience - user_experience)
        }
    
    def _calculate_education_match(self, job: Dict, user_profile: Dict) -> Tuple[float, Dict]:
        """Calculate education compatibility"""
        user_education = user_profile.get('education_level', '').lower()
        required_education = self._extract_required_education(job)
        
        if not required_education:
            return 100.0, {'user_education': user_education, 'required': None}
        
        education_hierarchy = {
            'phd': 4,
            'masters': 3,
            'bachelors': 2,
            'associates': 1,
            'certificate': 1,
            'diploma': 1
        }
        
        user_level = education_hierarchy.get(user_education, 0)
        required_level = education_hierarchy.get(required_education.lower(), 0)
        
        if user_level >= required_level:
            score = 100.0
        elif user_level == required_level - 1:
            score = 70.0
        else:
            score = 40.0
        
        return score, {
            'user_education': user_education,
            'required': required_education,
            'meets_requirement': user_level >= required_level
        }
    
    def _calculate_location_match(self, job: Dict, matching_criteria: Dict) -> Tuple[float, Dict]:
        """Calculate location compatibility"""
        job_location = job['location'].lower()
        preferred_locations = [loc.lower() for loc in matching_criteria.get('preferred_locations', [])]
        remote_preference = matching_criteria.get('remote_preference', 'any')
        
        # Check for remote options
        is_remote = 'remote' in job_location or 'anywhere' in job_location
        
        if remote_preference == 'remote_only' and is_remote:
            return 100.0, {'type': 'remote_match', 'job_location': job_location}
        elif remote_preference == 'remote_only' and not is_remote:
            return 20.0, {'type': 'remote_mismatch', 'job_location': job_location}
        elif is_remote:
            return 90.0, {'type': 'remote_available', 'job_location': job_location}
        
        # Check location preferences
        for pref_loc in preferred_locations:
            if pref_loc in job_location or job_location in pref_loc:
                return 100.0, {'type': 'location_match', 'matched_location': pref_loc}
        
        # Partial match for same region/country
        job_parts = job_location.split(',')
        for pref_loc in preferred_locations:
            pref_parts = pref_loc.split(',')
            if len(job_parts) > 1 and len(pref_parts) > 1:
                if job_parts[-1].strip() == pref_parts[-1].strip():  # Same country
                    return 60.0, {'type': 'country_match', 'country': job_parts[-1].strip()}
        
        return 30.0, {'type': 'location_mismatch', 'job_location': job_location}
    
    def _calculate_salary_match(self, job: Dict, matching_criteria: Dict) -> Tuple[float, Dict]:
        """Calculate salary compatibility"""
        job_salary = job.get('salary')
        salary_min = matching_criteria.get('salary_min', 0)
        salary_max = matching_criteria.get('salary_max', 1000000)
        
        if job_salary is None:
            return 50.0, {'type': 'no_salary_info', 'job_salary': None}
        
        if job_salary >= salary_min and job_salary <= salary_max:
            return 100.0, {'type': 'within_range', 'job_salary': job_salary}
        elif job_salary < salary_min:
            if job_salary >= salary_min * 0.8:
                return 70.0, {'type': 'slightly_below_min', 'job_salary': job_salary}
            else:
                return 40.0, {'type': 'below_min', 'job_salary': job_salary}
        else:  # job_salary > salary_max
            return 90.0, {'type': 'above_max', 'job_salary': job_salary}
    
    def _apply_learning_boost(self, job: Dict, user_profile: Dict, matching_criteria: Dict) -> float:
        """Apply machine learning boost based on user feedback"""
        learned_prefs = matching_criteria.get('learned_preferences', {})
        boost = 0.0
        
        # Boost for companies user has shown interest in
        preferred_companies = learned_prefs.get('preferred_companies', [])
        if job['company'] in preferred_companies:
            boost += 5.0
        
        # Boost for job titles user has liked
        preferred_titles = learned_prefs.get('preferred_titles', [])
        job_title_words = job['title'].lower().split()
        for pref_title in preferred_titles:
            pref_words = pref_title.lower().split()
            if any(word in pref_words for word in job_title_words):
                boost += 3.0
        
        # Boost for industries user prefers
        preferred_industries = learned_prefs.get('preferred_industries', [])
        job_industry = self._classify_job_industry(job)
        if job_industry in preferred_industries:
            boost += 4.0
        
        return boost
    
    def _get_skill_category(self, skill: str) -> str:
        """Get category for a skill"""
        skill_categories = self.resume_processor.skill_keywords
        for category, skills in skill_categories.items():
            if skill in skills:
                return category
        return 'tools_software'  # Default category
    
    def _extract_required_experience(self, job: Dict) -> float:
        """Extract required years of experience from job description"""
        text = f"{job['title']} {job['description']} {job['requirements']}"
        
        # Look for patterns like "5+ years", "3-5 years", etc.
        patterns = [
            r'(\d+)\+?\s*years?',
            r'(\d+)\s*-\s*(\d+)\s*years?',
            r'minimum\s*(\d+)\s*years?'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                if len(match.groups()) == 2:
                    # Range like "3-5 years"
                    return float(match.group(2))  # Use the higher end
                else:
                    # Single number like "5+ years"
                    return float(match.group(1))
        
        return None
    
    def _extract_required_education(self, job: Dict) -> str:
        """Extract required education level from job description"""
        text = f"{job['title']} {job['description']} {job['requirements']}".lower()
        
        education_keywords = {
            'phd': ['phd', 'doctorate', 'doctoral'],
            'masters': ['master', 'ms', 'm.s', 'mba', 'm.ba'],
            'bachelors': ['bachelor', 'bs', 'b.s', 'ba', 'b.a', 'undergraduate', 'degree'],
            'associates': ['associate', 'aa', 'a.a'],
            'certificate': ['certificate', 'certification', 'cert']
        }
        
        for level, keywords in education_keywords.items():
            for keyword in keywords:
                if keyword in text:
                    return level
        
        return None
    
    def _classify_job_industry(self, job: Dict) -> str:
        """Classify job into industry based on description"""
        text = f"{job['title']} {job['description']} {job['requirements']}".lower()
        
        industry_scores = {}
        for industry, keywords in self.industry_mappings.items():
            score = sum(1 for keyword in keywords if keyword in text)
            industry_scores[industry] = score
        
        if industry_scores:
            return max(industry_scores, key=industry_scores.get)
        
        return 'general'
    
    def _generate_match_reasons(self, skill_details: Dict, experience_details: Dict, education_details: Dict) -> List[str]:
        """Generate human-readable reasons for the match"""
        reasons = []
        
        if skill_details['total_matched'] > 0:
            reasons.append(f"Matched {skill_details['total_matched']} out of {skill_details['total_required']} required skills")
        
        if experience_details.get('required') and experience_details['user_experience'] >= experience_details['required']:
            reasons.append(f"Experience level meets requirements ({experience_details['user_experience']} years)")
        
        if education_details.get('meets_requirement'):
            reasons.append(f"Education level meets requirements")
        
        return reasons
    
    def _generate_improvement_suggestions(self, skill_details: Dict, experience_details: Dict) -> List[str]:
        """Generate suggestions to improve match score"""
        suggestions = []
        
        if skill_details['missing_skills']:
            top_missing = skill_details['missing_skills'][:3]
            suggestions.append(f"Consider learning: {', '.join(top_missing)}")
        
        if experience_details.get('gap', 0) > 0:
            suggestions.append(f"Gain {experience_details['gap']} more years of relevant experience")
        
        return suggestions
    
    def _apply_diversity_filter(self, recommendations: List[JobRecommendation], limit: int) -> List[JobRecommendation]:
        """Apply diversity filtering to ensure variety in recommendations"""
        if len(recommendations) <= limit:
            return recommendations
        
        diverse_recommendations = []
        companies_seen = set()
        titles_seen = set()
        
        for rec in recommendations:
            company_key = rec.company.lower()
            title_key = rec.title.lower()
            
            # Limit recommendations from same company
            if company_key in companies_seen and len([r for r in diverse_recommendations if r.company.lower() == company_key]) >= 2:
                continue
            
            # Limit recommendations with similar titles
            title_similar = False
            for seen_title in titles_seen:
                if self._title_similarity(title_key, seen_title) > 0.8:
                    title_similar = True
                    break
            
            if title_similar and len([r for r in diverse_recommendations if self._title_similarity(r.title.lower(), title_key) > 0.8]) >= 2:
                continue
            
            diverse_recommendations.append(rec)
            companies_seen.add(company_key)
            titles_seen.add(title_key)
            
            if len(diverse_recommendations) >= limit:
                break
        
        return diverse_recommendations
    
    def _title_similarity(self, title1: str, title2: str) -> float:
        """Calculate similarity between two job titles"""
        words1 = set(title1.split())
        words2 = set(title2.split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1 & words2
        union = words1 | words2
        
        return len(intersection) / len(union)
    
    def _create_recommendation(self, job: Dict, user: User, match_result: Dict) -> JobRecommendation:
        """Create JobRecommendation object"""
        return JobRecommendation(
            user=user,
            title=job['title'],
            company=job['company'],
            location=job['location'],
            description=job['description'],
            requirements=job['requirements'],
            salary_range=str(job['salary']) if job['salary'] else '',
            job_type='full_time',  # Default, should be extracted from job
            match_score=match_result['overall_score'],
            skill_match_score=match_result['skill_score'],
            experience_match_score=match_result['experience_score'],
            education_match_score=match_result['education_score'],
            matched_skills=match_result['matched_skills'],
            missing_skills=match_result['missing_skills'],
            match_reasons=match_result['match_reasons'],
            improvement_suggestions=match_result['improvement_suggestions'],
            source=job['source'],
            external_job_id=job.get('external_id', ''),
            application_url=job.get('application_url', '')
        )
    
    def _save_recommendations(self, user: User, recommendations: List[JobRecommendation]):
        """Save recommendations to database"""
        # Clear old recommendations
        JobRecommendation.objects.filter(user=user).delete()
        
        # Save new recommendations
        for rec in recommendations:
            rec.save()
    
    def update_user_preferences(self, user: User, feedback_data: Dict):
        """Update user preferences based on feedback for learning"""
        try:
            criteria, created = JobMatchingCriteria.objects.get_or_create(user=user)
            
            learned_prefs = criteria.learned_preferences or {}
            
            # Update preferences based on feedback
            if feedback_data.get('liked'):
                self._update_positive_feedback(learned_prefs, feedback_data)
            elif feedback_data.get('disliked'):
                self._update_negative_feedback(learned_prefs, feedback_data)
            
            criteria.learned_preferences = learned_prefs
            criteria.save()
            
        except Exception as e:
            logger.error(f"Error updating user preferences: {str(e)}")
    
    def _update_positive_feedback(self, learned_prefs: Dict, feedback_data: Dict):
        """Update preferences based on positive feedback"""
        # Boost preferred companies
        company = feedback_data.get('company')
        if company:
            preferred_companies = learned_prefs.get('preferred_companies', [])
            if company not in preferred_companies:
                preferred_companies.append(company)
            learned_prefs['preferred_companies'] = preferred_companies
        
        # Boost preferred job titles
        title = feedback_data.get('title')
        if title:
            preferred_titles = learned_prefs.get('preferred_titles', [])
            if title not in preferred_titles:
                preferred_titles.append(title)
            learned_prefs['preferred_titles'] = preferred_titles
        
        # Boost preferred industries
        industry = feedback_data.get('industry')
        if industry:
            preferred_industries = learned_prefs.get('preferred_industries', [])
            if industry not in preferred_industries:
                preferred_industries.append(industry)
            learned_prefs['preferred_industries'] = preferred_industries
    
    def _update_negative_feedback(self, learned_prefs: Dict, feedback_data: Dict):
        """Update preferences based on negative feedback"""
        # Reduce weight of disliked items
        company = feedback_data.get('company')
        if company:
            disliked_companies = learned_prefs.get('disliked_companies', [])
            if company not in disliked_companies:
                disliked_companies.append(company)
            learned_prefs['disliked_companies'] = disliked_companies
