# Sample data for Career AI Backend
# Run this script with: python manage.py shell < sample_data.py

from careers.models import Career, CareerQuestion
from users.models import UserSkill
from django.contrib.auth.models import User

# Sample Careers
careers_data = [
    {
        'title': 'Software Developer',
        'category': 'Technology',
        'description': 'Design, develop, and test software applications and systems. Write code in various programming languages and frameworks.',
        'salary_range': '$70,000 - $120,000',
        'growth_rate': '22% (Much faster than average)',
        'required_skills': ['Python', 'JavaScript', 'SQL', 'Git', 'Problem Solving', 'Communication']
    },
    {
        'title': 'Data Scientist',
        'category': 'Technology',
        'description': 'Analyze complex data to help companies make better business decisions. Use statistical methods and machine learning.',
        'salary_range': '$90,000 - $150,000',
        'growth_rate': '31% (Much faster than average)',
        'required_skills': ['Python', 'R', 'Statistics', 'Machine Learning', 'SQL', 'Data Visualization']
    },
    {
        'title': 'UX Designer',
        'category': 'Design',
        'description': 'Design user interfaces and experiences for websites and applications. Focus on user research and usability.',
        'salary_range': '$65,000 - $110,000',
        'growth_rate': '13% (Faster than average)',
        'required_skills': ['User Research', 'Wireframing', 'Prototyping', 'Figma', 'Adobe XD', 'CSS']
    },
    {
        'title': 'Marketing Manager',
        'category': 'Marketing',
        'description': 'Plan and execute marketing campaigns to promote products and services. Analyze market trends and customer behavior.',
        'salary_range': '$60,000 - $115,000',
        'growth_rate': '10% (Faster than average)',
        'required_skills': ['Digital Marketing', 'SEO', 'Content Strategy', 'Analytics', 'Communication', 'Project Management']
    },
    {
        'title': 'Financial Analyst',
        'category': 'Finance',
        'description': 'Analyze financial data and market trends to help businesses and individuals make investment decisions.',
        'salary_range': '$65,000 - $105,000',
        'growth_rate': '6% (As fast as average)',
        'required_skills': ['Excel', 'Financial Modeling', 'Accounting', 'Data Analysis', 'Risk Assessment', 'Reporting']
    }
]

# Create sample careers
for career_data in careers_data:
    career, created = Career.objects.get_or_create(
        title=career_data['title'],
        defaults=career_data
    )
    if created:
        print(f"Created career: {career.title}")

# Sample Career Questions
questions_data = [
    {
        'question_text': 'What type of work environment do you prefer?',
        'question_type': 'single_choice',
        'options': {
            'choices': ['Remote', 'Office', 'Hybrid', 'Field Work']
        }
    },
    {
        'question_text': 'Which of these skills do you enjoy using most? (Select all that apply)',
        'question_type': 'multiple_choice',
        'options': {
            'choices': ['Problem Solving', 'Creative Design', 'Data Analysis', 'Communication', 'Leadership', 'Technical Skills']
        }
    },
    {
        'question_text': 'How important is work-life balance to you? (1-10)',
        'question_type': 'scale',
        'options': {
            'min': 1,
            'max': 10
        }
    },
    {
        'question_text': 'Describe your ideal work role',
        'question_type': 'text',
        'options': {}
    }
]

# Create sample questions
for question_data in questions_data:
    question, created = CareerQuestion.objects.get_or_create(
        question_text=question_data['question_text'],
        defaults=question_data
    )
    if created:
        print(f"Created question: {question.question_text[:50]}...")

print("Sample data created successfully!")
