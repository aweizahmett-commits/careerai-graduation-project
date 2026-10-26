"""
Sample data creation script for the AI Career Recommendation System
Run this script to populate the database with sample data for testing
"""

import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'career_ai_backend.settings')
django.setup()

from django.contrib.auth.models import User
from careers.models import CareerQuestion, QuestionnaireAnswer
from jobs.models import JobListing
from users.models import UserProfile
import json


def create_sample_users():
    """Create sample users"""
    users_data = [
        {
            'username': 'alice_smith',
            'email': 'alice@example.com',
            'password': 'password123',
            'first_name': 'Alice',
            'last_name': 'Smith'
        },
        {
            'username': 'bob_jones',
            'email': 'bob@example.com',
            'password': 'password123',
            'first_name': 'Bob',
            'last_name': 'Jones'
        },
        {
            'username': 'carol_davis',
            'email': 'carol@example.com',
            'password': 'password123',
            'first_name': 'Carol',
            'last_name': 'Davis'
        }
    ]
    
    for user_data in users_data:
        user, created = User.objects.get_or_create(
            username=user_data['username'],
            defaults={
                'email': user_data['email'],
                'first_name': user_data['first_name'],
                'last_name': user_data['last_name']
            }
        )
        if created:
            user.set_password(user_data['password'])
            user.save()
            UserProfile.objects.create(user=user)
            print(f"Created user: {user.username}")
        else:
            print(f"User already exists: {user.username}")


def create_sample_questions():
    """Create sample career questions"""
    questions_data = [
        {
            'question_text': 'What type of work environment do you prefer?',
            'question_type': 'single_choice',
            'options': {
                'choices': ['Office', 'Remote', 'Hybrid', 'Field work']
            }
        },
        {
            'question_text': 'How do you feel about working with data and numbers?',
            'question_type': 'scale',
            'options': {
                'min': 1,
                'max': 10,
                'labels': {
                    '1': 'Strongly dislike',
                    '10': 'Strongly enjoy'
                }
            }
        },
        {
            'question_text': 'Select your areas of interest (choose all that apply)',
            'question_type': 'multiple_choice',
            'options': {
                'choices': [
                    'Technology', 'Healthcare', 'Education', 'Finance',
                    'Creative Arts', 'Business', 'Science', 'Social Work'
                ]
            }
        },
        {
            'question_text': 'Describe your ideal work-life balance',
            'question_type': 'text',
            'options': {}
        },
        {
            'question_text': 'How comfortable are you with public speaking?',
            'question_type': 'scale',
            'options': {
                'min': 1,
                'max': 10,
                'labels': {
                    '1': 'Very uncomfortable',
                    '10': 'Very comfortable'
                }
            }
        },
        {
            'question_text': 'What motivates you most in a career?',
            'question_type': 'single_choice',
            'options': {
                'choices': [
                    'High salary', 'Work-life balance', 'Making a difference',
                    'Creative expression', 'Leadership opportunities', 'Learning'
                ]
            }
        },
        {
            'question_text': 'How do you prefer to solve problems?',
            'question_type': 'single_choice',
            'options': {
                'choices': [
                    'Analytical approach', 'Creative brainstorming',
                    'Collaborative discussion', 'Trial and error'
                ]
            }
        },
        {
            'question_text': 'Select your preferred work pace',
            'question_type': 'single_choice',
            'options': {
                'choices': ['Fast-paced', 'Moderate pace', 'Steady and predictable']
            }
        }
    ]
    
    for question_data in questions_data:
        question, created = CareerQuestion.objects.get_or_create(
            question_text=question_data['question_text'],
            defaults={
                'question_type': question_data['question_type'],
                'options': question_data['options']
            }
        )
        if created:
            print(f"Created question: {question.question_text[:50]}...")
        else:
            print(f"Question already exists: {question.question_text[:50]}...")


def create_sample_jobs():
    """Create sample job listings"""
    jobs_data = [
        {
            'title': 'Senior Python Developer',
            'company': 'Tech Corp',
            'location': 'San Francisco, CA',
            'salary': 120000.00,
            'description': 'We are looking for an experienced Python developer to join our team. You will work on developing scalable web applications and APIs.',
            'requirements': '5+ years of Python experience, Django/Flask knowledge, SQL databases, REST APIs'
        },
        {
            'title': 'Data Scientist',
            'company': 'Analytics Inc',
            'location': 'New York, NY',
            'salary': 110000.00,
            'description': 'Join our data science team to analyze complex datasets and build predictive models.',
            'requirements': 'Python, R, Machine Learning, Statistics, SQL, Data visualization'
        },
        {
            'title': 'Frontend Developer',
            'company': 'Web Solutions',
            'location': 'Remote',
            'salary': 85000.00,
            'description': 'Create beautiful and responsive user interfaces using modern JavaScript frameworks.',
            'requirements': 'React, JavaScript, HTML/CSS, TypeScript, Git'
        },
        {
            'title': 'DevOps Engineer',
            'company': 'Cloud Systems',
            'location': 'Austin, TX',
            'salary': 105000.00,
            'description': 'Manage and optimize our cloud infrastructure and deployment pipelines.',
            'requirements': 'AWS, Docker, Kubernetes, CI/CD, Linux, Python'
        },
        {
            'title': 'Product Manager',
            'company': 'Innovation Labs',
            'location': 'Seattle, WA',
            'salary': 115000.00,
            'description': 'Lead product development and work with cross-functional teams to deliver amazing products.',
            'requirements': 'Product management experience, Agile, Communication skills, Technical background'
        },
        {
            'title': 'UX Designer',
            'company': 'Design Studio',
            'location': 'Los Angeles, CA',
            'salary': 90000.00,
            'description': 'Create user-centered designs and improve user experience across our products.',
            'requirements': 'UI/UX design, Figma, Adobe Creative Suite, User research'
        },
        {
            'title': 'Machine Learning Engineer',
            'company': 'AI Technologies',
            'location': 'Boston, MA',
            'salary': 130000.00,
            'description': 'Build and deploy machine learning models for production systems.',
            'requirements': 'Python, TensorFlow/PyTorch, MLOps, Deep Learning, Cloud platforms'
        },
        {
            'title': 'Full Stack Developer',
            'company': 'Startup Hub',
            'location': 'Denver, CO',
            'salary': 95000.00,
            'description': 'Work on both frontend and backend development for our web applications.',
            'requirements': 'JavaScript, React, Node.js, Python, SQL, NoSQL'
        }
    ]
    
    for job_data in jobs_data:
        job, created = JobListing.objects.get_or_create(
            title=job_data['title'],
            company=job_data['company'],
            defaults={
                'location': job_data['location'],
                'salary': job_data['salary'],
                'description': job_data['description'],
                'requirements': job_data['requirements']
            }
        )
        if created:
            print(f"Created job: {job.title} at {job.company}")
        else:
            print(f"Job already exists: {job.title} at {job.company}")


def main():
    """Main function to create all sample data"""
    print("Creating sample data for AI Career Recommendation System...")
    print("-" * 60)
    
    print("\n1. Creating sample users...")
    create_sample_users()
    
    print("\n2. Creating sample career questions...")
    create_sample_questions()
    
    print("\n3. Creating sample job listings...")
    create_sample_jobs()
    
    print("\n" + "=" * 60)
    print("Sample data creation completed!")
    print("\nYou can now:")
    print("1. Start the server: python manage.py runserver")
    print("2. Visit Swagger docs: http://127.0.0.1:8000/swagger/")
    print("3. Test the API with sample users:")
    print("   - Username: alice_smith, Password: password123")
    print("   - Username: bob_jones, Password: password123")
    print("   - Username: carol_davis, Password: password123")


if __name__ == '__main__':
    main()
