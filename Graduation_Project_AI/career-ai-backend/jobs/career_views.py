from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import json
import PyPDF2
import docx
from io import BytesIO
import re
from datetime import datetime

from .models import ResumeData, AssessmentResult, CareerMatch
from .serializers import ResumeDataSerializer, AssessmentResultSerializer, CareerMatchSerializer, AssessmentSubmitSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_resume(request):
    """Upload and process resume file"""
    try:
        if 'file' not in request.FILES:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        file = request.FILES['file']
        
        # Check file type
        allowed_types = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
        if file.content_type not in allowed_types:
            return Response({'error': 'Invalid file type. Only PDF and DOCX files are allowed.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Determine file type
        file_type = 'pdf' if file.content_type == 'application/pdf' else 'docx' if 'openxmlformats' in file.content_type else 'doc'
        
        # Save file
        file_name = f"resume_{request.user.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{file_type}"
        file_path = default_storage.save(f'resumes/{file_name}', file)
        
        # Extract data from file
        extracted_data = extract_resume_data(file, file_type)
        
        # Create ResumeData record
        resume_data = ResumeData.objects.create(
            user=request.user,
            raw_file=file,
            file_name=file_name,
            file_type=file_type,
            file_size=file.size,
            extracted_skills=extracted_data.get('skills', []),
            education=extracted_data.get('education', []),
            experience=extracted_data.get('experience', []),
            contact_info=extracted_data.get('contact_info', {}),
            is_processed=True,
            processing_status='completed'
        )
        
        serializer = ResumeDataSerializer(resume_data)
        return Response({
            'message': 'Resume uploaded and processed successfully',
            'resume_data': serializer.data
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': f'Failed to process resume: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def extract_resume_data(file, file_type):
    """Extract skills, education, and experience from resume file"""
    try:
        text = ""
        
        if file_type == 'pdf':
            pdf_reader = PyPDF2.PdfReader(BytesIO(file.read()))
            for page in pdf_reader.pages:
                text += page.extract_text()
        elif file_type == 'docx':
            doc = docx.Document(BytesIO(file.read()))
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
        else:
            # For DOC files, we'll use a simple approach
            text = str(file.read())
        
        # Extract skills (common technical skills)
        skills_keywords = [
            'Python', 'Java', 'JavaScript', 'React', 'Node.js', 'SQL', 'MongoDB', 'Docker',
            'AWS', 'Azure', 'GCP', 'Git', 'Linux', 'HTML', 'CSS', 'TypeScript', 'Angular',
            'Vue.js', 'Django', 'Flask', 'FastAPI', 'PostgreSQL', 'MySQL', 'Redis',
            'Kubernetes', 'Jenkins', 'CI/CD', 'REST API', 'GraphQL', 'Machine Learning',
            'Data Science', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy'
        ]
        
        found_skills = []
        for skill in skills_keywords:
            if skill.lower() in text.lower():
                found_skills.append(skill)
        
        # Extract education (simple pattern matching)
        education_patterns = [
            r'(Bachelor|Master|PhD|B\.S\.|M\.S\.|Ph\.D\.)\s+(?:of\s+)?(?:Arts|Science|Engineering|Business|Computer Science)',
            r'University\s+of\s+\w+',
            r'\w+\s+University',
            r'College\s+of\s+\w+'
        ]
        
        education = []
        for pattern in education_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            education.extend(matches)
        
        # Extract experience (look for years and job-related terms)
        experience_patterns = [
            r'(\d+)\s+(?:years?|yrs?)\s+(?:of\s+)?(?:experience|exp)',
            r'(?:Software|Senior|Junior|Lead|Principal)\s+(?:Engineer|Developer|Designer|Manager)',
            r'(\w+\s+(?:Engineer|Developer|Designer|Manager|Analyst|Consultant))'
        ]
        
        experience = []
        for pattern in experience_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            experience.extend(matches)
        
        # Extract contact info
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        phone_pattern = r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
        
        emails = re.findall(email_pattern, text)
        phones = re.findall(phone_pattern, text)
        
        contact_info = {
            'emails': emails[:2],  # Limit to first 2 emails
            'phones': phones[:2]   # Limit to first 2 phones
        }
        
        return {
            'skills': found_skills,
            'education': list(set(education))[:5],  # Remove duplicates and limit
            'experience': list(set(experience))[:5],  # Remove duplicates and limit
            'contact_info': contact_info
        }
        
    except Exception as e:
        # Return empty data if extraction fails
        return {
            'skills': [],
            'education': [],
            'experience': [],
            'contact_info': {}
        }


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_assessment(request):
    """Submit assessment and generate personality analysis"""
    try:
        serializer = AssessmentSubmitSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        answers = serializer.validated_data['answers']
        
        # Analyze answers to determine personality and traits
        analysis = analyze_assessment_answers(answers)
        
        # Create or update AssessmentResult
        assessment_result, created = AssessmentResult.objects.update_or_create(
            user=request.user,
            defaults={
                'answers': answers,
                'personality_type': analysis['personality_type'],
                'personality_traits': analysis['traits'],
                'strengths': analysis['strengths'],
                'interests': analysis['interests'],
                'analytical_score': analysis['analytical_score'],
                'creative_score': analysis['creative_score'],
                'communication_score': analysis['communication_score'],
                'leadership_score': analysis['leadership_score']
            }
        )
        
        # Generate career matches based on assessment and resume
        generate_career_matches(request.user, assessment_result)
        
        serializer = AssessmentResultSerializer(assessment_result)
        return Response({
            'message': 'Assessment submitted successfully',
            'assessment_result': serializer.data
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': f'Failed to submit assessment: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def analyze_assessment_answers(answers):
    """Analyze assessment answers to determine personality type and traits"""
    # This is a simplified analysis - in production, you'd use more sophisticated algorithms
    traits = []
    strengths = []
    interests = []
    
    # Analyze answers to determine personality type
    analytical_score = 0.0
    creative_score = 0.0
    communication_score = 0.0
    leadership_score = 0.0
    
    # Sample analysis logic (you'd make this more sophisticated)
    for question_id, answer in answers.items():
        if isinstance(answer, str):
            answer_lower = answer.lower()
            
            # Analytical indicators
            if any(word in answer_lower for word in ['data', 'analysis', 'logic', 'problem', 'solve']):
                analytical_score += 0.2
                if 'analytical' not in traits:
                    traits.append('analytical')
                if 'problem-solving' not in strengths:
                    strengths.append('problem-solving')
            
            # Creative indicators
            if any(word in answer_lower for word in ['creative', 'design', 'innovate', 'art', 'imagine']):
                creative_score += 0.2
                if 'creative' not in traits:
                    traits.append('creative')
                if 'innovation' not in strengths:
                    strengths.append('innovation')
            
            # Communication indicators
            if any(word in answer_lower for word in ['communicate', 'team', 'collaborate', 'present']):
                communication_score += 0.2
                if 'communicative' not in traits:
                    traits.append('communicative')
                if 'teamwork' not in strengths:
                    strengths.append('teamwork')
            
            # Leadership indicators
            if any(word in answer_lower for word in ['lead', 'manage', 'guide', 'mentor']):
                leadership_score += 0.2
                if 'leadership' not in traits:
                    traits.append('leadership')
                if 'management' not in strengths:
                    strengths.append('management')
    
    # Determine primary personality type
    scores = {
        'analytical': analytical_score,
        'creative': creative_score,
        'communicative': communication_score,
        'leadership': leadership_score
    }
    
    personality_type = max(scores, key=scores.get)
    
    # Determine interests based on personality type
    interest_mapping = {
        'analytical': ['Data Analysis', 'Software Development', 'Research', 'Engineering'],
        'creative': ['Design', 'Marketing', 'Content Creation', 'Arts'],
        'communicative': ['Teaching', 'Sales', 'Public Relations', 'Customer Service'],
        'leadership': ['Management', 'Entrepreneurship', 'Project Management', 'Consulting']
    }
    
    interests = interest_mapping.get(personality_type, [])
    
    return {
        'personality_type': personality_type,
        'traits': list(set(traits)),
        'strengths': list(set(strengths)),
        'interests': interests,
        'analytical_score': min(analytical_score, 1.0),
        'creative_score': min(creative_score, 1.0),
        'communication_score': min(communication_score, 1.0),
        'leadership_score': min(leadership_score, 1.0)
    }


def generate_career_matches(user, assessment_result):
    """Generate career matches based on assessment and resume data"""
    try:
        # Get user's resume data
        resume_data = ResumeData.objects.filter(user=user).first()
        user_skills = resume_data.extracted_skills if resume_data else []
        
        # Career matching rules
        career_rules = [
            {
                'title': 'Software Engineer',
                'category': 'Technology',
                'required_skills': ['Python', 'Java', 'JavaScript', 'SQL'],
                'personality_match': ['analytical'],
                'salary_range': '$80,000 - $150,000',
                'growth_potential': 'high'
            },
            {
                'title': 'Data Scientist',
                'category': 'Technology',
                'required_skills': ['Python', 'SQL', 'Machine Learning', 'Data Science'],
                'personality_match': ['analytical'],
                'salary_range': '$90,000 - $160,000',
                'growth_potential': 'high'
            },
            {
                'title': 'UI/UX Designer',
                'category': 'Design',
                'required_skills': ['Design', 'User Experience', 'Creative'],
                'personality_match': ['creative'],
                'salary_range': '$70,000 - $130,000',
                'growth_potential': 'medium'
            },
            {
                'title': 'Product Manager',
                'category': 'Business',
                'required_skills': ['Management', 'Communication', 'Leadership'],
                'personality_match': ['leadership', 'communicative'],
                'salary_range': '$85,000 - $150,000',
                'growth_potential': 'high'
            },
            {
                'title': 'Marketing Manager',
                'category': 'Marketing',
                'required_skills': ['Marketing', 'Communication', 'Creative'],
                'personality_match': ['creative', 'communicative'],
                'salary_range': '$70,000 - $130,000',
                'growth_potential': 'medium'
            },
            {
                'title': 'Business Analyst',
                'category': 'Business',
                'required_skills': ['Analysis', 'Communication', 'SQL'],
                'personality_match': ['analytical', 'communicative'],
                'salary_range': '$75,000 - $120,000',
                'growth_potential': 'medium'
            }
        ]
        
        # Clear existing matches
        CareerMatch.objects.filter(user=user).delete()
        
        # Generate new matches
        for rule in career_rules:
            match_score = calculate_match_score(rule, user_skills, assessment_result.personality_type)
            
            if match_score > 30:  # Only include matches with score > 30%
                missing_skills = [skill for skill in rule['required_skills'] if skill not in user_skills]
                
                CareerMatch.objects.create(
                    user=user,
                    job_title=rule['title'],
                    match_score=match_score,
                    reason=generate_match_reason(rule, user_skills, assessment_result.personality_type),
                    required_skills=rule['required_skills'],
                    missing_skills=missing_skills,
                    career_category=rule['category'],
                    typical_salary_range=rule['salary_range'],
                    growth_potential=rule['growth_potential'],
                    matching_factors={
                        'skills_match': len([s for s in rule['required_skills'] if s in user_skills]) / len(rule['required_skills']),
                        'personality_match': 1.0 if assessment_result.personality_type in rule['personality_match'] else 0.5
                    },
                    confidence_level=match_score / 100.0
                )
        
    except Exception as e:
        print(f"Error generating career matches: {e}")


def calculate_match_score(career_rule, user_skills, personality_type):
    """Calculate match score for a career"""
    score = 0
    
    # Skills match (60% weight)
    if career_rule['required_skills']:
        skills_match = len([skill for skill in career_rule['required_skills'] if skill in user_skills])
        skills_score = (skills_match / len(career_rule['required_skills'])) * 60
        score += skills_score
    
    # Personality match (40% weight)
    if personality_type in career_rule['personality_match']:
        score += 40
    elif any(trait in career_rule['personality_match'] for trait in ['analytical', 'creative', 'communicative', 'leadership'] if trait == personality_type):
        score += 20
    
    return min(score, 100)  # Cap at 100%


def generate_match_reason(career_rule, user_skills, personality_type):
    """Generate explanation for why this career matches"""
    reasons = []
    
    # Skills-based reasons
    matching_skills = [skill for skill in career_rule['required_skills'] if skill in user_skills]
    if matching_skills:
        reasons.append(f"Your skills in {', '.join(matching_skills)} align well with this role")
    
    # Personality-based reasons
    if personality_type in career_rule['personality_match']:
        reasons.append(f"Your {personality_type} personality type is a great fit for this career")
    
    if not reasons:
        reasons.append("This career matches your profile based on our analysis")
    
    return " ".join(reasons)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_career_matches(request):
    """Get user's career matches"""
    try:
        matches = CareerMatch.objects.filter(user=user).order_by('-match_score')
        serializer = CareerMatchSerializer(matches, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': f'Failed to get career matches: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_progress(request):
    """Get user's progress through the career pipeline"""
    try:
        user = request.user
        
        # Check each step
        resume_uploaded = ResumeData.objects.filter(user=user).exists()
        assessment_completed = AssessmentResult.objects.filter(user=user).exists()
        career_matches_ready = CareerMatch.objects.filter(user=user).exists()
        
        progress = {
            'resume_uploaded': resume_uploaded,
            'assessment_completed': assessment_completed,
            'career_matches_ready': career_matches_ready,
            'current_step': get_current_step(resume_uploaded, assessment_completed, career_matches_ready)
        }
        
        return Response(progress)
    except Exception as e:
        return Response({'error': f'Failed to get user progress: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def get_current_step(resume_uploaded, assessment_completed, career_matches_ready):
    """Determine current step in the pipeline"""
    if not resume_uploaded:
        return 'upload_resume'
    elif not assessment_completed:
        return 'assessment'
    elif not career_matches_ready:
        return 'career_matches'
    else:
        return 'job_search'


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_filtered_jobs(request):
    """Get jobs filtered based on career matches and user skills"""
    try:
        user = request.user
        
        # Get user's career matches
        career_matches = CareerMatch.objects.filter(user=user).order_by('-match_score')
        
        # Get user's resume data for skills
        resume_data = ResumeData.objects.filter(user=user).first()
        user_skills = resume_data.extracted_skills if resume_data else []
        
        # Get filter parameters
        career_title = request.GET.get('career_title', '')
        min_match_score = float(request.GET.get('min_match_score', 50))
        
        # Filter career matches if career_title is specified
        if career_title:
            career_matches = career_matches.filter(job_title__icontains=career_title)
        
        # Get matching careers
        matching_careers = []
        for match in career_matches:
            if match.match_score >= min_match_score:
                matching_careers.append({
                    'title': match.job_title,
                    'match_score': match.match_score,
                    'category': match.career_category,
                    'required_skills': match.required_skills,
                    'missing_skills': match.missing_skills,
                    'reason': match.reason
                })
        
        # Get job search results (using existing job search logic)
        # This would integrate with the existing job search API
        # For now, return mock data that matches the user's career matches
        filtered_jobs = []
        
        for career in matching_careers:
            # Generate mock jobs based on career
            jobs = generate_jobs_for_career(career['title'], user_skills)
            filtered_jobs.extend(jobs)
        
        return Response({
            'career_matches': matching_careers,
            'filtered_jobs': filtered_jobs,
            'user_skills': user_skills,
            'total_jobs': len(filtered_jobs)
        })
        
    except Exception as e:
        return Response({'error': f'Failed to get filtered jobs: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def generate_jobs_for_career(career_title, user_skills):
    """Generate mock job listings based on career title and user skills"""
    # This would integrate with real job APIs in production
    # For now, generate realistic mock jobs based on career
    
    job_templates = {
        'Software Engineer': [
            {'company': 'Google', 'location': 'Mountain View, CA', 'salary': '$180,000 - $250,000'},
            {'company': 'Microsoft', 'location': 'Redmond, WA', 'salary': '$160,000 - $220,000'},
            {'company': 'Amazon', 'location': 'Seattle, WA', 'salary': '$170,000 - $240,000'},
        ],
        'Data Scientist': [
            {'company': 'Netflix', 'location': 'Los Gatos, CA', 'salary': '$180,000 - $280,000'},
            {'company': 'Spotify', 'location': 'New York, NY', 'salary': '$160,000 - $240,000'},
            {'company': 'Uber', 'location': 'San Francisco, CA', 'salary': '$165,000 - $235,000'},
        ],
        'UI/UX Designer': [
            {'company': 'Apple', 'location': 'Cupertino, CA', 'salary': '$150,000 - $220,000'},
            {'company': 'Meta', 'location': 'Menlo Park, CA', 'salary': '$140,000 - $200,000'},
            {'company': 'Adobe', 'location': 'San Jose, CA', 'salary': '$130,000 - $180,000'},
        ],
        'Product Manager': [
            {'company': 'LinkedIn', 'location': 'Sunnyvale, CA', 'salary': '$170,000 - $250,000'},
            {'company': 'Salesforce', 'location': 'San Francisco, CA', 'salary': '$160,000 - $230,000'},
            {'company': 'Slack', 'location': 'San Francisco, CA', 'salary': '$150,000 - $200,000'},
        ],
        'Marketing Manager': [
            {'company': 'Nike', 'location': 'Beaverton, OR', 'salary': '$120,000 - $180,000'},
            {'company': 'Coca-Cola', 'location': 'Atlanta, GA', 'salary': '$110,000 - $160,000'},
            {'company': 'Starbucks', 'location': 'Seattle, WA', 'salary': '$100,000 - $150,000'},
        ],
        'Business Analyst': [
            {'company': 'Deloitte', 'location': 'New York, NY', 'salary': '$90,000 - $140,000'},
            {'company': 'Accenture', 'location': 'Chicago, IL', 'salary': '$85,000 - $130,000'},
            {'company': 'IBM', 'location': 'Armonk, NY', 'salary': '$80,000 - $120,000'},
        ]
    }
    
    jobs = []
    templates = job_templates.get(career_title, job_templates['Software Engineer'])
    
    for i, template in enumerate(templates):
        job = {
            'id': f"{career_title}_{i}_{datetime.now().timestamp()}",
            'title': f"Senior {career_title}",
            'company': template['company'],
            'location': template['location'],
            'salary': template['salary'],
            'apply_link': f"https://careers.{template['company'].lower().replace(' ', '')}.com/jobs/{i}",
            'description': f"Join {template['company']}'s world-class team as a Senior {career_title}. You'll work on innovative projects and collaborate with talented professionals.",
            'source': f"{template['company']} Careers",
            'logo': f"https://logo.clearbit.com/{template['company'].lower().replace(' ', '')}.com",
            'job_type': 'Full-time',
            'posted_date': int(datetime.now().timestamp()),
            'is_remote': True,
            'career_match': career_title,
            'skills_match': len([skill for skill in user_skills if skill in ['Python', 'Java', 'JavaScript', 'SQL', 'Design', 'Marketing', 'Analysis']]),
            'requirements': f"5+ years of experience in {career_title}, strong problem-solving skills, and relevant technical expertise."
        }
        jobs.append(job)
    
    return jobs
