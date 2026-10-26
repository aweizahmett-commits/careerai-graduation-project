import json
import uuid
import re
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging
from django.contrib.auth.models import User
from django.db.models import Q
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

from .models import ChatSession, ChatMessage, ChatbotIntent, ChatbotKnowledge
from ai_engine.models import ResumeUpload
from jobs.models import JobRecommendation, JobListing

logger = logging.getLogger(__name__)


class AdvancedCareerAIChatbot:
    """Advanced AI-powered career guidance chatbot - ChatGPT style"""
    
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words='english', max_features=2000)
        self.knowledge_base = self._build_comprehensive_knowledge_base()
        self.response_patterns = self._build_response_patterns()
        self.career_data = self._load_career_data()
        
    def _build_comprehensive_knowledge_base(self) -> List[Dict]:
        """Build comprehensive knowledge base covering all career topics and system features"""
        knowledge = [
            # Career AI Connected System Overview
            {
                'category': 'system_overview',
                'keywords': ['career ai connected', 'system', 'platform', 'what is', 'about', 'features', 'overview'],
                'answers': [
                    "Career AI Connected is an intelligent career guidance platform that uses artificial intelligence to help you with your professional development. The system includes resume analysis, AI-powered job matching, career assessments, skill development tracking, and personalized career recommendations.",
                    "Career AI Connected offers comprehensive career tools including: Resume Upload & AI Analysis, Career Assessment Questionnaire, AI Job Matching Dashboard, Job Search Engine, AI Recommendations, Profile Management, and an AI Career Assistant chatbot.",
                    "The Career AI Connected platform is designed to be your complete career companion - from resume optimization to job searching, skill development to career planning, all powered by advanced AI technology.",
                    "Welcome to Career AI Connected! This is your all-in-one career development platform that leverages cutting-edge AI technology to provide personalized career guidance, resume analysis, job matching, and professional development recommendations.",
                    "Career AI Connected transforms your career journey with AI-powered tools that analyze your skills, match you with perfect jobs, provide personalized recommendations, and guide you toward your ideal career path.",
                    "Think of Career AI Connected as your personal career coach - it uses advanced AI to analyze your resume, assess your skills, find matching opportunities, and provide expert guidance every step of the way."
                ]
            },
            
            # System Features
            {
                'category': 'system_features',
                'keywords': ['features', 'what can', 'capabilities', 'tools', 'functions', 'modules'],
                'answers': [
                    "Career AI Connected includes these main features: 1) Resume Upload & AI Analysis - Get detailed insights about your skills and experience, 2) Career Assessment - Take AI-powered questionnaires to discover your career path, 3) Job Search - Find jobs matching your profile, 4) AI Recommendations - Get personalized career advice, 5) Dashboard - Track your career progress, 6) AI Chat Assistant - Get instant career guidance.",
                    "The platform offers intelligent career tools: Resume Analysis with skill extraction, Career Questionnaire for personalized insights, AI Job Matching with percentage scores, Smart Job Search with filters, Career Recommendations based on your profile, Progress Dashboard with statistics, and 24/7 AI Chat Assistant for career questions.",
                    "Career AI Connected provides: Resume upload with AI-driven analysis, Career assessment with personalized recommendations, Job search with AI matching, Skill tracking and development, Career path guidance, Profile management, and an intelligent chat assistant for all your career questions.",
                    "Explore the powerful features of Career AI Connected: AI-powered resume analysis that extracts your skills and experience, comprehensive career assessments that reveal your ideal path, smart job matching with percentage compatibility scores, personalized recommendations, progress tracking dashboard, and always-available AI chat support.",
                    "With Career AI Connected, you get access to cutting-edge career tools: Intelligent resume processing, AI-driven career assessments, automated job matching with real listings, personalized career recommendations, comprehensive progress tracking, and instant AI assistance for all your career questions.",
                    "Discover everything Career AI Connected can do: Analyze your resume with AI, take comprehensive career assessments, find perfectly matched jobs, receive personalized recommendations, track your progress, and get 24/7 help from your AI career assistant - all in one integrated platform."
                ]
            },
            
            # Resume Analysis Feature
            {
                'category': 'resume_feature',
                'keywords': ['resume upload', 'resume analysis', 'resume feature', 'upload resume', 'analyze resume'],
                'answers': [
                    "The Resume Upload feature allows you to upload your resume (PDF, DOC, DOCX) for AI analysis. The system extracts your skills, calculates experience years, identifies education level, and suggests career paths. You'll get detailed insights about your strengths and areas for improvement.",
                    "When you upload your resume to Career AI Connected, our AI analyzes it to extract key information including skills, experience, education, and job titles. The system then provides career suggestions, skill gaps analysis, and recommendations for improvement. This helps optimize your resume for job applications.",
                    "The Resume Analysis feature uses advanced AI to process your resume and provide: Skill extraction and categorization, Experience level calculation, Education assessment, Career path suggestions, Match scores for different roles, and Specific recommendations for resume improvement.",
                    "Upload your resume to unlock AI-powered insights! Our system will analyze your document to identify your core skills, calculate your experience level, assess your education background, and provide personalized career recommendations based on your unique profile.",
                    "The Resume Analysis tool transforms your document into actionable career intelligence. It automatically extracts technical and soft skills, evaluates your experience against industry standards, identifies skill gaps, and suggests specific improvements to make your resume more effective.",
                    "Get instant resume feedback with our AI analysis! Simply upload your resume, and our system will provide comprehensive insights including skill extraction, experience assessment, career path compatibility, and targeted recommendations to enhance your job search success."
                ]
            },
            
            # Career Assessment Feature
            {
                'category': 'assessment_feature',
                'keywords': ['assessment', 'questionnaire', 'career assessment', 'take assessment', 'career questionnaire'],
                'answers': [
                    "The Career Assessment is an AI-powered questionnaire that helps discover your ideal career path. It analyzes your interests, skills, personality traits, and work preferences to provide personalized career recommendations. The assessment takes about 15-20 minutes to complete.",
                    "The Career Questionnaire feature uses intelligent algorithms to evaluate your professional profile. It covers areas like work preferences, skill interests, career goals, and personality traits. Based on your responses, the system suggests suitable career paths and development areas.",
                    "Take the Career Assessment to get personalized insights about your ideal career path. The questionnaire evaluates your strengths, interests, and work style to provide data-driven career recommendations, skill development suggestions, and job role compatibility scores."
                ]
            },
            
            # Job Search Feature
            {
                'category': 'job_search_feature',
                'keywords': ['job search', 'find jobs', 'job search feature', 'search jobs', 'job matching'],
                'answers': [
                    "The Job Search feature helps you find positions that match your profile. You can search by job title, skills, location, or use AI-powered matching. The system shows real job listings with match scores, salary information, and application links. Jobs are sourced from multiple platforms for comprehensive coverage.",
                    "Career AI Connected's Job Search uses AI to match you with relevant opportunities. It analyzes your resume and assessment results to find jobs with high compatibility. You can filter by location, job type, salary range, and skills. Each job shows a match percentage indicating how well it fits your profile.",
                    "Use the Job Search feature to discover opportunities tailored to your skills and preferences. The system provides: AI-powered job matching, Real-time job listings, Match percentage scores, Salary information, Application links, and Advanced filtering options for location, job type, and skills."
                ]
            },
            
            # AI Recommendations Feature
            {
                'category': 'recommendations_feature',
                'keywords': ['recommendations', 'ai recommendations', 'career recommendations', 'suggestions'],
                'answers': [
                    "The AI Recommendations feature provides personalized career advice based on your profile analysis. It suggests career paths, skills to develop, job roles to consider, and improvement areas. The recommendations are continuously updated as you complete assessments and upload your resume.",
                    "AI Recommendations in Career AI Connected offer: Career path suggestions based on your skills and interests, Skill development recommendations, Job role compatibility analysis, Learning resources suggestions, and Personalized improvement plans. All recommendations are powered by advanced AI algorithms.",
                    "Get personalized career guidance through AI Recommendations. The system analyzes your resume, assessment results, and career goals to provide: Suitable career paths, Skills to acquire, Job opportunities, Training recommendations, and Career development strategies."
                ]
            },
            
            # Dashboard Feature
            {
                'category': 'dashboard_feature',
                'keywords': ['dashboard', 'profile', 'progress', 'stats', 'dashboard feature'],
                'answers': [
                    "The Dashboard is your career command center showing your progress and statistics. It displays profile completion percentage, assessment progress, career matches, skills analyzed, and quick access to all features. The dashboard helps you track your career development journey.",
                    "Your Career AI Connected Dashboard provides: Profile completion tracking, Assessment progress indicators, Career match statistics, Skills analysis summary, Quick action buttons for main features, Recent activity timeline, and Personalized insights about your career development.",
                    "The Dashboard feature gives you a comprehensive view of your career journey with: Progress bars for profile completion, Assessment completion status, Number of career matches found, Skills analyzed count, Quick access to all major features, and Personalized career insights."
                ]
            },
            
            # User Profile Feature
            {
                'category': 'profile_feature',
                'keywords': ['profile', 'user profile', 'my profile', 'account', 'profile management'],
                'answers': [
                    "Your Profile in Career AI Connected contains your personal information, skills, experience, and career preferences. You can update your contact details, add skills manually, view assessment results, and manage your career information. The profile helps the AI provide better recommendations.",
                    "The Profile feature allows you to: Update personal information, Add and manage skills, View assessment results, Track career progress, Set career preferences, and Manage account settings. Your profile data is used to personalize AI recommendations and job matching.",
                    "Manage your career information through the Profile feature. You can: Edit personal details, Add skills with proficiency levels, View career assessment results, Track your progress, Set preferences for job recommendations, and Update your career goals."
                ]
            },
            
            # AI Chat Assistant Feature
            {
                'category': 'chatbot_feature',
                'keywords': ['chat assistant', 'ai assistant', 'chatbot', 'help', 'support', 'questions'],
                'answers': [
                    "The AI Career Assistant is your 24/7 career advisor. You can ask any career-related questions and get instant, intelligent responses. The assistant knows about the entire Career AI Connected system and can help with resume tips, interview preparation, career advice, and guidance on using any feature.",
                    "The AI Chat Assistant provides: Instant answers to career questions, Help with using system features, Resume writing advice, Interview preparation tips, Career guidance, Skill development suggestions, Salary negotiation advice, and Support for all Career AI Connected features.",
                    "Use the AI Career Assistant for any career questions. The chatbot can help with: Understanding system features, Resume optimization, Interview preparation, Career planning, Skill development, Job search strategies, and Personalized advice based on your profile."
                ]
            },
            
            # Resume & CV Topics
            {
                'category': 'resume',
                'keywords': ['resume', 'cv', 'curriculum vitae', 'upload', 'format', 'template', 'write', 'create', 'improve'],
                'answers': [
                    "To create an effective resume, focus on quantifiable achievements, use action verbs, and tailor it to each job application. Include your contact information, professional summary, work experience, education, and relevant skills. Use the Resume Upload feature in Career AI Connected for AI analysis.",
                    "A strong resume should be 1-2 pages long, use a clean format, include keywords from the job description, and highlight your most relevant accomplishments with specific metrics. Upload it to Career AI Connected to get AI-powered analysis and improvement suggestions.",
                    "For resume optimization, use professional formatting, include a compelling summary, list achievements rather than duties, and ensure it's ATS-friendly with appropriate keywords. The Resume Analysis feature in Career AI Connected can help identify areas for improvement."
                ]
            },
            
            # Job Search & Applications
            {
                'category': 'job_search',
                'keywords': ['job', 'search', 'apply', 'application', 'interview', 'offer', 'salary', 'negotiation', 'networking'],
                'answers': [
                    "Effective job searching involves using multiple platforms, networking with professionals, customizing applications, following up, and preparing thoroughly for interviews.",
                    "When applying for jobs, research the company thoroughly, customize your resume and cover letter, prepare for common interview questions, and have questions ready for the interviewer.",
                    "Salary negotiation should be based on market research, your experience level, location, and the value you bring. Always negotiate professionally and be prepared to walk away if the offer doesn't meet your needs."
                ]
            },
            
            # Career Development
            {
                'category': 'career_development',
                'keywords': ['career', 'development', 'growth', 'promotion', 'skills', 'training', 'certification', 'advancement'],
                'answers': [
                    "Career development requires continuous learning, skill acquisition, networking, seeking feedback, and taking on challenging projects that stretch your abilities.",
                    "To advance your career, focus on developing both technical and soft skills, seek mentorship, document your achievements, and communicate your career goals to management.",
                    "Professional growth involves staying current with industry trends, obtaining relevant certifications, building a strong professional network, and consistently delivering high-quality work."
                ]
            },
            
            # Interview Preparation
            {
                'category': 'interview',
                'keywords': ['interview', 'prepare', 'questions', 'behavioral', 'technical', 'phone', 'video', 'panel'],
                'answers': [
                    "Interview preparation includes researching the company, practicing common questions, preparing your STAR method examples, dressing appropriately, and preparing thoughtful questions to ask.",
                    "For behavioral interviews, use the STAR method: Situation, Task, Action, Result. Prepare specific examples that demonstrate your skills and achievements.",
                    "Technical interviews require practicing coding problems, understanding data structures and algorithms, reviewing system design concepts, and explaining your thought process clearly."
                ]
            },
            
            # Skills & Learning
            {
                'category': 'skills',
                'keywords': ['skills', 'learn', 'training', 'certification', 'course', 'education', 'development', 'improve'],
                'answers': [
                    "In-demand skills include programming languages (Python, JavaScript), cloud computing (AWS, Azure), data analysis, machine learning, cybersecurity, and soft skills like communication and leadership.",
                    "To develop new skills, take online courses, attend workshops, work on personal projects, seek mentorship, and practice regularly. Focus on skills that align with your career goals.",
                    "Skill assessment involves self-evaluation, seeking feedback from peers and managers, comparing your skills to job requirements, and creating a development plan to address gaps."
                ]
            },
            
            # Industry Trends
            {
                'category': 'industry_trends',
                'keywords': ['trends', 'future', 'technology', 'ai', 'automation', 'remote', 'hybrid', 'market'],
                'answers': [
                    "Current career trends include remote work flexibility, AI integration, emphasis on soft skills, continuous learning, and focus on work-life balance and mental health.",
                    "The future of work involves increased automation, AI collaboration, remote and hybrid models, gig economy growth, and the need for adaptability and lifelong learning.",
                    "Technology trends affecting careers include AI and machine learning, cloud computing, cybersecurity, data science, and digital transformation across all industries."
                ]
            },
            
            # Salary & Compensation
            {
                'category': 'salary',
                'keywords': ['salary', 'compensation', 'pay', 'wage', 'income', 'benefits', 'negotiate', 'market rate'],
                'answers': [
                    "Salary research should include checking Glassdoor, LinkedIn Salary, Bureau of Labor Statistics, and industry reports. Consider location, experience level, company size, and market conditions.",
                    "Compensation packages often include base salary, bonuses, stock options, health insurance, retirement plans, paid time off, and professional development opportunities.",
                    "When negotiating salary, research market rates, highlight your value, be confident but flexible, consider the full compensation package, and be prepared to discuss your achievements."
                ]
            },
            
            # Work-Life Balance
            {
                'category': 'work_life_balance',
                'keywords': ['balance', 'burnout', 'stress', 'mental health', 'flexible', 'remote', 'hybrid', 'wellness'],
                'answers': [
                    "Work-life balance involves setting boundaries, prioritizing tasks, taking regular breaks, maintaining hobbies, and ensuring adequate rest and social time.",
                    "To prevent burnout, recognize early signs, practice stress management, maintain healthy habits, seek support when needed, and take regular vacations.",
                    "Flexible work arrangements include remote work, flexible hours, compressed workweeks, and hybrid models. Discuss options with your employer based on your role and responsibilities."
                ]
            }
        ]
        
        # Add existing database knowledge
        for item in ChatbotKnowledge.objects.filter(is_active=True):
            knowledge.append({
                'category': item.category,
                'keywords': item.keywords,
                'answers': [item.answer]
            })
            
        return knowledge
    
    def _build_response_patterns(self) -> Dict[str, List[str]]:
        """Build response patterns for different types of queries"""
        return {
            'greeting': [
                "Hello! I'm your AI career assistant. I can help you with resume writing, job searching, interview preparation, career development, and much more. What would you like to know today?",
                "Hi there! I'm here to help with your career journey. Whether you need advice on job applications, skill development, or career planning, I've got you covered. How can I assist you?",
                "Welcome! I'm your personal career coach. I can provide expert guidance on resumes, interviews, salary negotiation, and career advancement. What's on your mind today?"
            ],
            'farewell': [
                "Goodbye! Feel free to come back anytime you need career advice. Best of luck with your job search and career journey!",
                "Take care! Remember that career development is a continuous journey. I'm here whenever you need guidance. Have a great day!",
                "Until next time! Keep working towards your career goals, and don't hesitate to reach out if you need help. You've got this!"
            ],
            'thanks': [
                "You're welcome! I'm glad I could help. Is there anything else about your career that I can assist you with?",
                "My pleasure! Helping you succeed in your career is what I'm here for. Do you have any other questions?",
                "Happy to help! Career success is a journey, and I'm here to support you along the way. What else would you like to know?"
            ],
            'unclear': [
                "I want to make sure I give you the best possible advice. Could you provide more details about your specific situation or question?",
                "I'd love to help you more effectively. Could you tell me more about what you're looking for or provide some context?",
                "Let me make sure I understand correctly. Could you elaborate a bit more on your question or situation?"
            ]
        }
    
    def _load_career_data(self) -> Dict[str, Any]:
        """Load career-related data for contextual responses"""
        return {
            'high_demand_jobs': [
                'Software Developer', 'Data Scientist', 'AI/ML Engineer', 'Cloud Architect',
                'Cybersecurity Analyst', 'DevOps Engineer', 'Product Manager', 'UX Designer'
            ],
            'key_skills': [
                'Communication', 'Leadership', 'Problem Solving', 'Critical Thinking',
                'Teamwork', 'Adaptability', 'Time Management', 'Technical Skills'
            ],
            'interview_types': [
                'Phone Screening', 'Video Interview', 'Technical Interview', 'Behavioral Interview',
                'Panel Interview', 'Case Study Interview', 'Final Round Interview'
            ]
        }
    
    def create_session(self, user: User) -> str:
        """Create new chat session"""
        session_id = str(uuid.uuid4())
        session = ChatSession.objects.create(
            user=user,
            session_id=session_id
        )
        return session_id
    
    def process_message(self, session_id: str, user_message: str) -> Dict[str, Any]:
        """Process user message and generate intelligent response - ChatGPT style"""
        try:
            session = ChatSession.objects.get(session_id=session_id, is_active=True)
            
            # Save user message
            ChatMessage.objects.create(
                session=session,
                role='user',
                content=user_message
            )
            
            # Generate intelligent response
            response_data = self._generate_intelligent_response(session.user, user_message)
            
            # Save assistant response
            ChatMessage.objects.create(
                session=session,
                role='assistant',
                content=response_data['response'],
                metadata={
                    'intent': response_data.get('intent'),
                    'confidence': response_data.get('confidence'),
                    'sources': response_data.get('sources', []),
                    'category': response_data.get('category')
                }
            )
            
            # Update session
            session.updated_at = datetime.now()
            session.save()
            
            return {
                'response': response_data['response'],
                'intent': response_data.get('intent'),
                'confidence': response_data.get('confidence'),
                'suggestions': response_data.get('suggestions', [])
            }
            
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}")
            return {
                'response': "I apologize, but I encountered an error while processing your request. Please try again, and I'll do my best to help you.",
                'intent': 'error',
                'confidence': 0.0
            }
    
    def _generate_intelligent_response(self, user: User, message: str) -> Dict[str, Any]:
        """Generate intelligent response using advanced NLP and context understanding"""
        message_clean = message.strip().lower()
        
        # Handle greetings and social interactions with personalization
        if self._is_greeting(message_clean):
            return self._generate_greeting_response(user)
        
        if self._is_farewell(message_clean):
            return self._generate_farewell_response(user)
        
        if self._is_thanks(message_clean):
            return self._generate_thanks_response(user)
        
        # Check for user-specific questions
        user_context_result = self._handle_user_specific_questions(user, message)
        if user_context_result:
            return user_context_result
        
        # Advanced knowledge base matching
        knowledge_result = self._advanced_knowledge_search(message)
        if knowledge_result and knowledge_result['confidence'] > 0.7:
            # Add user context to system-related responses
            if knowledge_result.get('category') in ['system_overview', 'system_features', 'dashboard_feature']:
                knowledge_result['response'] = self._personalize_system_response(user, knowledge_result['response'])
            return knowledge_result
        
        # Contextual response generation
        contextual_result = self._generate_advanced_contextual_response(user, message)
        if contextual_result:
            return contextual_result
        
        # Fallback to comprehensive response
        return self._generate_comprehensive_response(user, message)
    
    def _is_greeting(self, message: str) -> bool:
        """Check if message is a greeting"""
        greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'howdy', 'greetings']
        return any(greeting in message for greeting in greetings)
    
    def _is_farewell(self, message: str) -> bool:
        """Check if message is a farewell"""
        farewells = ['bye', 'goodbye', 'see you', 'later', 'take care', 'farewell', 'cya']
        return any(farewell in message for farewell in farewells)
    
    def _is_thanks(self, message: str) -> bool:
        """Check if message expresses thanks"""
        thanks = ['thank', 'thanks', 'appreciate', 'grateful', 'helpful', 'awesome', 'great']
        return any(thank in message for thank in thanks)
    
    def _generate_greeting_response(self, user: User) -> Dict[str, Any]:
        """Generate personalized greeting response"""
        import random
        user_name = user.first_name or user.username
        responses = [
            f"Hello {user_name}! I'm your AI career assistant. I can help you with resume writing, job searching, interview preparation, career development, and much more. What would you like to know today?",
            f"Hi {user_name}! I'm here to help with your career journey. Whether you need advice on job applications, skill development, or career planning, I've got you covered. How can I assist you?",
            f"Welcome {user_name}! I'm your personal career coach. I can provide expert guidance on resumes, interviews, salary negotiation, and career advancement. What's on your mind today?"
        ]
        response = random.choice(responses)
        return {
            'response': response,
            'intent': 'greeting',
            'confidence': 1.0,
            'suggestions': [
                'How to write a better resume?',
                'What are the most in-demand skills?',
                'How to prepare for interviews?',
                'Salary negotiation tips?'
            ]
        }
    
    def _generate_farewell_response(self, user: User) -> Dict[str, Any]:
        """Generate personalized farewell response"""
        import random
        user_name = user.first_name or user.username
        responses = [
            f"Goodbye {user_name}! Feel free to come back anytime you need career advice. Best of luck with your job search and career journey!",
            f"Take care {user_name}! Remember that career development is a continuous journey. I'm here whenever you need guidance. Have a great day!",
            f"Until next time {user_name}! Keep working towards your career goals, and don't hesitate to reach out if you need help. You've got this!"
        ]
        response = random.choice(responses)
        return {
            'response': response,
            'intent': 'farewell',
            'confidence': 1.0
        }
    
    def _generate_thanks_response(self, user: User) -> Dict[str, Any]:
        """Generate personalized thanks response"""
        import random
        user_name = user.first_name or user.username
        responses = [
            f"You're welcome {user_name}! I'm glad I could help. Is there anything else about your career that I can assist you with?",
            f"My pleasure {user_name}! Helping you succeed in your career is what I'm here for. Do you have any other questions?",
            f"Happy to help {user_name}! Career success is a journey, and I'm here to support you along the way. What else would you like to know?"
        ]
        response = random.choice(responses)
        return {
            'response': response,
            'intent': 'thanks',
            'confidence': 1.0,
            'suggestions': [
                'Career development advice',
                'Job search strategies',
                'Skill improvement tips',
                'Interview preparation'
            ]
        }
    
    def _handle_user_specific_questions(self, user: User, message: str) -> Optional[Dict[str, Any]]:
        """Handle questions about user's specific information and progress"""
        message_lower = message.lower()
        user_name = user.first_name or user.username
        
        # Check for questions about user's name
        if any(word in message_lower for word in ['my name', 'who am i', 'what is my name']):
            return {
                'response': f"Your name is {user_name}. I'm here to help you with your career development using Career AI Connected.",
                'intent': 'user_info',
                'confidence': 1.0
            }
        
        # Check for questions about user's progress
        if any(word in message_lower for word in ['my progress', 'how am i doing', 'my status', 'my profile']):
            return self._get_user_progress_summary(user)
        
        # Check for questions about what the user can do
        if any(word in message_lower for word in ['what can i do', 'what should i do', 'next steps']):
            return self._get_user_next_steps(user)
        
        return None
    
    def _get_user_progress_summary(self, user: User) -> Dict[str, Any]:
        """Get user's progress summary"""
        user_name = user.first_name or user.username
        
        try:
            from users.models import DashboardStats, UserSkill
            from ai_engine.models import ResumeUpload
            
            # Get dashboard stats
            stats, created = DashboardStats.objects.get_or_create(user=user)
            
            # Get user skills
            skills_count = UserSkill.objects.filter(user=user).count()
            
            # Check resume status
            resume = ResumeUpload.objects.filter(user=user, processed=True).first()
            
            response = f"Hi {user_name}! Here's your progress summary:\n\n"
            response += f"**Profile Completion**: {stats.profile_completion}%\n"
            response += f"**Assessment Status**: {'Completed' if stats.assessment_completed else 'Not completed'}\n"
            response += f"**Career Matches Found**: {stats.career_matches}\n"
            response += f"**Skills Analyzed**: {stats.skills_analyzed or skills_count}\n"
            response += f"**Resume Status**: {'Uploaded and analyzed' if resume else 'Not uploaded yet'}\n\n"
            
            if stats.profile_completion < 100:
                response += "To complete your profile, consider uploading your resume and completing the career assessment."
            
            return {
                'response': response,
                'intent': 'user_progress',
                'confidence': 0.95,
                'suggestions': [
                    'Complete my profile',
                    'Upload my resume',
                    'Take career assessment',
                    'View my recommendations'
                ]
            }
            
        except Exception as e:
            return {
                'response': f"Hi {user_name}! I can see you're using Career AI Connected. To get your detailed progress, make sure you've completed your profile setup.",
                'intent': 'user_progress',
                'confidence': 0.8
            }
    
    def _get_user_next_steps(self, user: User) -> Dict[str, Any]:
        """Get personalized next steps for the user"""
        user_name = user.first_name or user.username
        
        try:
            from users.models import DashboardStats, UserSkill
            from ai_engine.models import ResumeUpload
            
            stats, created = DashboardStats.objects.get_or_create(user=user)
            resume = ResumeUpload.objects.filter(user=user, processed=True).first()
            
            response = f"Hi {user_name}! Here are your recommended next steps:\n\n"
            
            if not resume:
                response += "1. **Upload Your Resume** - Get AI analysis of your skills and experience\n"
            else:
                response += "1. **Review Resume Analysis** - Check your AI-powered resume insights\n"
            
            if not stats.assessment_completed:
                response += "2. **Complete Career Assessment** - Discover your ideal career path\n"
            else:
                response += "2. **Review Assessment Results** - Explore your career recommendations\n"
            
            if stats.profile_completion < 100:
                response += "3. **Complete Your Profile** - Add more details for better recommendations\n"
            
            response += "4. **Explore Job Matches** - Find opportunities that fit your profile\n"
            response += "5. **Develop Skills** - Work on recommended skill improvements\n\n"
            
            response += "Which of these would you like help with?"
            
            return {
                'response': response,
                'intent': 'next_steps',
                'confidence': 0.9,
                'suggestions': [
                    'Upload my resume',
                    'Take career assessment',
                    'Complete my profile',
                    'Find job matches'
                ]
            }
            
        except Exception as e:
            return {
                'response': f"Hi {user_name}! I recommend starting with uploading your resume and completing the career assessment to get personalized recommendations.",
                'intent': 'next_steps',
                'confidence': 0.8
            }
    
    def _personalize_system_response(self, user: User, response: str) -> str:
        """Personalize system-related responses with user context"""
        user_name = user.first_name or user.username
        
        # Add user name to system responses
        if "Career AI Connected" in response:
            response = response.replace("Career AI Connected", f"Career AI Connected, {user_name}")
        
        # Add personalized context
        if "your profile" in response:
            response = response.replace("your profile", f"your profile, {user_name}")
        
        return response
    
    def _advanced_knowledge_search(self, message: str) -> Optional[Dict[str, Any]]:
        """Advanced knowledge base search with semantic matching and variety"""
        if not self.knowledge_base:
            return None
        
        import random
        message_lower = message.lower()
        matches = []
        
        # Find all potential matches with their scores
        for item in self.knowledge_base:
            # Calculate keyword match score
            keyword_score = 0
            matched_keywords = []
            
            for keyword in item['keywords']:
                if keyword.lower() in message_lower:
                    keyword_score += 1
                    matched_keywords.append(keyword)
            
            if keyword_score > 0:
                # Calculate confidence based on keyword matches
                confidence = min(keyword_score / len(item['keywords']), 1.0)
                
                # Boost confidence for exact matches
                for keyword in matched_keywords:
                    if keyword.lower() in message_lower.split():
                        confidence += 0.1
                
                if confidence > 0.3:
                    matches.append({
                        'item': item,
                        'confidence': min(confidence, 1.0),
                        'matched_keywords': matched_keywords
                    })
        
        if not matches:
            return None
        
        # Sort by confidence and add some randomness for variety
        matches.sort(key=lambda x: x['confidence'], reverse=True)
        
        # If we have multiple good matches, add variety by sometimes choosing
        # a slightly lower confidence match
        if len(matches) > 1:
            # 70% chance to pick the best match, 30% chance for variety
            if random.random() < 0.7:
                selected_match = matches[0]
            else:
                # Pick from top 3 matches for variety
                top_matches = matches[:min(3, len(matches))]
                selected_match = random.choice(top_matches)
        else:
            selected_match = matches[0]
        
        # Randomly select an answer from the selected item's answers
        answer = random.choice(selected_match['item']['answers'])
        
        # Add some variation to the response
        if random.random() < 0.3:  # 30% chance to add variation
            variations = [
                "Let me share some insights about this...",
                "Here's what I can tell you about that...",
                "Based on my knowledge, I can help you with...",
                "I'd be happy to explain this topic...",
                "Great question! Here's what you should know..."
            ]
            answer = f"{random.choice(variations)} {answer.lower()}"
        
        return {
            'response': answer,
            'intent': f"knowledge_{selected_match['item']['category']}",
            'confidence': selected_match['confidence'],
            'category': selected_match['item']['category'],
            'sources': [selected_match['item']['category']],
            'matched_keywords': selected_match['matched_keywords']
        }
    
    def _generate_advanced_contextual_response(self, user: User, message: str) -> Optional[Dict[str, Any]]:
        """Generate contextual response based on user data and message analysis"""
        message_lower = message.lower()
        
        # Resume-related queries with user context
        if any(word in message_lower for word in ['resume', 'cv', 'curriculum']):
            return self._handle_advanced_resume_query(user, message)
        
        # Job-related queries
        if any(word in message_lower for word in ['job', 'career', 'work', 'employment', 'position']):
            return self._handle_advanced_job_query(user, message)
        
        # Interview-related queries
        if any(word in message_lower for word in ['interview', 'question', 'prepare', 'behavioral', 'technical']):
            return self._handle_advanced_interview_query(user, message)
        
        # Skills-related queries
        if any(word in message_lower for word in ['skill', 'learn', 'improve', 'develop', 'training']):
            return self._handle_advanced_skills_query(user, message)
        
        # Salary-related queries
        if any(word in message_lower for word in ['salary', 'pay', 'compensation', 'negotiate', 'income']):
            return self._handle_advanced_salary_query(user, message)
        
        return None
    
    def _handle_advanced_resume_query(self, user: User, message: str) -> Dict[str, Any]:
        """Handle resume queries with user context"""
        resume = ResumeUpload.objects.filter(user=user, processed=True).first()
        
        if resume:
            # Provide personalized advice based on user's resume
            response = f"Based on your resume, I can see you have experience in {resume.analysis.get('job_titles', ['your field'])}. "
            response += "To improve your resume further, consider adding quantifiable achievements, using stronger action verbs, "
            response += "and tailoring it specifically to each job application. Would you like specific tips for any particular section?"
        else:
            response = "I don't see a processed resume in your profile. To create an effective resume, focus on these key elements:\n\n"
            response += "1. **Contact Information**: Name, phone, email, LinkedIn profile\n"
            response += "2. **Professional Summary**: 2-3 sentences highlighting your value proposition\n"
            response += "3. **Work Experience**: Use bullet points with action verbs and quantifiable results\n"
            response += "4. **Education**: Include relevant coursework and achievements\n"
            response += "5. **Skills**: Both technical and soft skills relevant to your target role\n\n"
            response += "Would you like me to help you with any specific part of your resume?"
        
        return {
            'response': response,
            'intent': 'resume_advice',
            'confidence': 0.9,
            'category': 'resume',
            'suggestions': [
                'Resume formatting tips',
                'Action verbs to use',
                'How to quantify achievements',
                'ATS optimization'
            ]
        }
    
    def _handle_advanced_job_query(self, user: User, message: str) -> Dict[str, Any]:
        """Handle job queries with personalized recommendations"""
        response = "Finding the right job requires a strategic approach. Here's what I recommend:\n\n"
        response += "**1. Self-Assessment**: Understand your skills, interests, and career goals\n"
        response += "**2. Market Research**: Research growing industries and in-demand roles\n"
        response += "**3. Target Companies**: Create a list of companies that align with your values\n"
        response += "**4. Custom Applications**: Tailor each application to the specific role\n"
        response += "**5. Network**: Connect with professionals in your target industry\n"
        response += "**6. Follow Up**: Send polite follow-up messages after applications\n\n"
        
        # Add personalized suggestions based on user's skills if available
        user_skills = self._get_user_skills(user)
        if user_skills:
            response += f"Based on your skills in {', '.join(user_skills[:3])}, consider these high-demand roles: "
            response += f"{', '.join(self.career_data['high_demand_jobs'][:4])}.\n\n"
        
        response += "What specific aspect of job searching would you like help with?"
        
        return {
            'response': response,
            'intent': 'job_search_advice',
            'confidence': 0.85,
            'category': 'job_search',
            'suggestions': [
                'Resume building for job applications',
                'Interview preparation strategies',
                'Networking tips',
                'Salary negotiation guidance'
            ]
        }
    
    def _handle_advanced_interview_query(self, user: User, message: str) -> Dict[str, Any]:
        """Handle interview queries with comprehensive guidance"""
        response = "Interview success comes from thorough preparation. Here's your complete guide:\n\n"
        response += "**Before the Interview:**\n"
        response += "1. Research the company's mission, values, and recent news\n"
        response += "2. Review the job description and identify key requirements\n"
        response += "3. Prepare STAR method examples for behavioral questions\n"
        response += "4. Practice technical problems relevant to the role\n"
        response += "5. Prepare thoughtful questions to ask the interviewer\n\n"
        response += "**During the Interview:**\n"
        response += "1. Arrive 10-15 minutes early\n"
        response += "2. Maintain eye contact and professional body language\n"
        response += "3. Listen carefully and answer questions concisely\n"
        response += "4. Use the STAR method for behavioral questions\n"
        response += "5. Show enthusiasm and ask relevant questions\n\n"
        response += "**After the Interview:**\n"
        response += "1. Send a thank-you email within 24 hours\n"
        response += "2. Reference specific points from your conversation\n"
        response += "3. Reiterate your interest in the position\n\n"
        response += "What type of interview are you preparing for?"
        
        return {
            'response': response,
            'intent': 'interview_preparation',
            'confidence': 0.9,
            'category': 'interview',
            'suggestions': [
                'Common interview questions',
                'STAR method examples',
                'Technical interview prep',
                'Behavioral interview tips'
            ]
        }
    
    def _handle_advanced_skills_query(self, user: User, message: str) -> Dict[str, Any]:
        """Handle skills development queries"""
        response = "Continuous skill development is crucial for career growth. Here's a strategic approach:\n\n"
        response += "**1. Assess Current Skills**: Identify your strengths and gaps\n"
        response += "**2. Research Market Demands**: Focus on skills in high demand\n"
        response += "**3. Create Learning Plan**: Set specific, measurable goals\n"
        response += "**4. Choose Learning Resources**: Online courses, workshops, mentorship\n"
        response += "**5. Practice Regularly**: Apply skills through projects\n"
        response += "**6. Get Feedback**: Seek input from peers and mentors\n\n"
        
        response += "**Most In-Demand Skills for 2024:**\n"
        for skill in self.career_data['key_skills'][:6]:
            response += f"  - {skill}\n"
        
        response += f"\n**Technical Skills in High Demand:**\n"
        response += "  - Programming (Python, JavaScript, Java)\n"
        response += "  - Cloud Computing (AWS, Azure, GCP)\n"
        response += "  - Data Analysis & Visualization\n"
        response += "  - Cybersecurity\n"
        response += "  - AI/Machine Learning\n"
        response += "  - DevOps & Automation\n\n"
        response += "Which skills are you most interested in developing?"
        
        return {
            'response': response,
            'intent': 'skills_development',
            'confidence': 0.9,
            'category': 'skills',
            'suggestions': [
                'Online learning platforms',
                'Certification programs',
                'Skill assessment tools',
                'Practice project ideas'
            ]
        }
    
    def _handle_advanced_salary_query(self, user: User, message: str) -> Dict[str, Any]:
        """Handle salary and compensation queries"""
        response = "Understanding and negotiating salary is a critical career skill. Here's your comprehensive guide:\n\n"
        response += "**Research Phase:**\n"
        response += "1. Use Glassdoor, LinkedIn Salary, and Payscale for market data\n"
        response += "2. Consider location, experience level, and company size\n"
        response += "3. Research industry-specific compensation trends\n"
        response += "4. Understand the total compensation package (base + bonus + benefits)\n\n"
        response += "**Negotiation Strategy:**\n"
        response += "1. Know your worth and have data to back it up\n"
        response += "2. Consider the full package, not just base salary\n"
        response += "3. Be confident but flexible in your approach\n"
        response += "4. Never accept the first offer without consideration\n"
        response += "5. Get everything in writing\n\n"
        response += "**Key Factors Affecting Salary:**\n"
        response += "  - Years of experience and expertise level\n"
        response += "  - Geographic location and cost of living\n"
        response += "  - Company size and revenue\n"
        response += "  - Industry and market demand\n"
        response += "  - Education and certifications\n"
        response += "  - Performance track record\n\n"
        response += "What specific aspect of salary negotiation would you like help with?"
        
        return {
            'response': response,
            'intent': 'salary_guidance',
            'confidence': 0.9,
            'category': 'salary',
            'suggestions': [
                'Salary research tools',
                'Negotiation scripts',
                'Benefits evaluation',
                'Market rate analysis'
            ]
        }
    
    def _generate_comprehensive_response(self, user: User, message: str) -> Dict[str, Any]:
        """Generate comprehensive response when no specific match is found"""
        user_name = user.first_name or user.username
        response = f"I'm here to help with your career journey, {user_name}! Based on your question, I can assist you with:\n\n"
        response += "**Career Development:**\n"
        response += "  - Resume writing and optimization\n"
        response += "  - Job search strategies\n"
        response += "  - Interview preparation\n"
        response += "  - Skill development planning\n"
        response += "  - Salary negotiation\n"
        response += "  - Career path guidance\n\n"
        response += "**Career AI Connected System Features:**\n"
        response += "  - **Resume Upload & AI Analysis** - Get detailed insights about your skills\n"
        response += "  - **Career Assessment** - Discover your ideal career path\n"
        response += "  - **AI Job Matching** - Find jobs that match your profile with percentage scores\n"
        response += "  - **Smart Job Search** - Search and filter real job opportunities\n"
        response += "  - **AI Recommendations** - Get personalized career advice\n"
        response += "  - **Dashboard** - Track your progress and statistics\n"
        response += "  - **Profile Management** - Manage your career information\n"
        response += "  - **AI Chat Assistant** - Get instant career guidance (that's me!)\n\n"
        response += "**Your Personal Information:**\n"
        response += f"  - Name: {user_name}\n"
        response += f"  - Email: {user.email}\n"
        response += "  - Account Type: Student/Job Seeker\n\n"
        response += "**Specific Topics I Can Help With:**\n"
        response += "  - Using any Career AI Connected feature\n"
        response += "  - Creating ATS-friendly resumes\n"
        response += "  - Preparing for behavioral interviews\n"
        response += "  - Developing in-demand technical skills\n"
        response += "  - Networking strategies\n"
        response += "  - Work-life balance\n"
        response += "  - Industry trends and insights\n\n"
        response += f"Tell me more about what you'd like to know, {user_name}! I can help with any career question or guide you through using Career AI Connected features."
        
        return {
            'response': response,
            'intent': 'general_guidance',
            'confidence': 0.6,
            'suggestions': [
                'How do I upload my resume?',
                'What does the career assessment do?',
                'How does job matching work?',
                'Show me my progress',
                'Help me with my resume',
                'Find jobs for me'
            ]
        }
    
    def _get_user_skills(self, user: User) -> List[str]:
        """Get user's skills from profile"""
        try:
            # This would need to be implemented based on your user profile structure
            return []
        except:
            return []


# Create a global instance for easy access
career_ai_chatbot = AdvancedCareerAIChatbot()


# Legacy compatibility - keep the old class name as an alias
CareerAIChatbot = AdvancedCareerAIChatbot
