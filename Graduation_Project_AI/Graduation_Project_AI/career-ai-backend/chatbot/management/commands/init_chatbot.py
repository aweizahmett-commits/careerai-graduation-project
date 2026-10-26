import json
from django.core.management.base import BaseCommand
from chatbot.models import ChatbotIntent, ChatbotKnowledge


class Command(BaseCommand):
    help = 'Initialize chatbot with default intents and knowledge base'

    def handle(self, *args, **options):
        # Create default intents
        intents_data = [
            {
                'name': 'greeting',
                'description': 'Handle user greetings',
                'keywords': ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'greetings'],
                'response_template': 'Hello! I\'m your AI career assistant. I can help you with resume analysis, job recommendations, skill development, and career advice. What would you like to know today?',
                'priority': 10
            },
            {
                'name': 'goodbye',
                'description': 'Handle user goodbyes',
                'keywords': ['bye', 'goodbye', 'see you', 'farewell', 'exit'],
                'response_template': 'Goodbye! Feel free to come back anytime you need career advice or job recommendations. Have a great day!',
                'priority': 10
            },
            {
                'name': 'thanks',
                'description': 'Handle user thanks',
                'keywords': ['thank you', 'thanks', 'appreciate', 'helpful'],
                'response_template': 'You\'re welcome! I\'m glad I could help. Is there anything else you\'d like to know about your career journey?',
                'priority': 8
            },
            {
                'name': 'help',
                'description': 'Provide help information',
                'keywords': ['help', 'what can you do', 'features', 'how to use'],
                'response_template': 'I can help you with: 1) Resume analysis and improvement suggestions 2) Personalized job recommendations 3) Skill gap analysis and learning paths 4) Career advice and guidance 5) Interview preparation tips. Just ask me anything!',
                'priority': 9
            },
            {
                'name': 'resume_help',
                'description': 'Resume-related assistance',
                'keywords': ['resume', 'cv', 'resume tips', 'resume format', 'resume writing'],
                'response_template': 'I can analyze your resume and provide personalized suggestions! Upload your resume to get insights on skills, experience formatting, and areas for improvement. I\'ll also suggest jobs that match your profile.',
                'priority': 7
            },
            {
                'name': 'job_search',
                'description': 'Job search assistance',
                'keywords': ['job', 'jobs', 'find job', 'job search', 'employment'],
                'response_template': 'I can find personalized job recommendations for you! I\'ll analyze your skills and experience to match you with the best opportunities. Would you like me to show you current recommendations or refresh the job listings?',
                'priority': 7
            },
            {
                'name': 'skills_development',
                'description': 'Skills development guidance',
                'keywords': ['skills', 'learn', 'improve', 'development', 'training'],
                'response_template': 'I can help you develop your skills! I can analyze your current skill set, identify gaps, and suggest learning paths based on your career goals. What skills are you interested in developing?',
                'priority': 6
            }
        ]

        for intent_data in intents_data:
            intent, created = ChatbotIntent.objects.get_or_create(
                name=intent_data['name'],
                defaults=intent_data
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Created intent: {intent.name}')
                )

        # Create knowledge base
        knowledge_data = [
            {
                'category': 'Resume Tips',
                'question': 'What should I include in my resume?',
                'answer': 'Your resume should include: 1) Contact information 2) Professional summary 3) Work experience with achievements 4) Skills and technical proficiencies 5) Education 6) Certifications 7) Projects. Keep it concise (1-2 pages) and tailor it to the job you\'re applying for.',
                'keywords': ['resume', 'include', 'sections', 'format'],
                'confidence_score': 0.9
            },
            {
                'category': 'Resume Tips',
                'question': 'How can I improve my resume?',
                'answer': 'To improve your resume: 1) Use action verbs and quantify achievements 2) Tailor it to each job application 3) Include relevant keywords 4) Keep formatting clean and professional 5) Proofread carefully 6) Include a strong professional summary 7) Highlight relevant skills for the target role.',
                'keywords': ['improve', 'resume', 'better', 'enhance'],
                'confidence_score': 0.9
            },
            {
                'category': 'Job Search',
                'question': 'How do I find the right job for me?',
                'answer': 'To find the right job: 1) Assess your skills, interests, and values 2) Research industries and companies 3) Network with professionals 4) Use job search platforms strategically 5) Customize your applications 6) Prepare for interviews 7) Consider both hard skills and cultural fit. I can help match you with suitable opportunities!',
                'keywords': ['find job', 'right job', 'job search strategy'],
                'confidence_score': 0.85
            },
            {
                'category': 'Interview Tips',
                'question': 'How should I prepare for an interview?',
                'answer': 'Interview preparation: 1) Research the company and role 2) Practice common interview questions 3) Prepare your STAR stories 4) Dress professionally 5) Bring questions for the interviewer 6) Follow up with a thank-you note 7) Be authentic and confident. I can provide specific tips based on your target role!',
                'keywords': ['interview', 'prepare', 'tips', 'questions'],
                'confidence_score': 0.9
            },
            {
                'category': 'Career Development',
                'question': 'What skills are most in demand?',
                'answer': 'Currently in-demand skills include: 1) AI and Machine Learning 2) Cloud Computing (AWS, Azure, GCP) 3) Cybersecurity 4) Data Science and Analytics 5) Software Development (Python, JavaScript) 6) DevOps 7) Digital Marketing 8) Project Management. The specific skills depend on your industry and career goals.',
                'keywords': ['in demand', 'skills', 'popular', 'trending'],
                'confidence_score': 0.8
            },
            {
                'category': 'Career Development',
                'question': 'How do I advance my career?',
                'answer': 'Career advancement strategies: 1) Continuously learn new skills 2) Take on challenging projects 3) Build your professional network 4) Seek mentorship 5) Document your achievements 6) Communicate your career goals 7) Consider certifications 8) Develop leadership skills. I can help create a personalized development plan!',
                'keywords': ['advance', 'career growth', 'promotion', 'development'],
                'confidence_score': 0.85
            },
            {
                'category': 'Salary Negotiation',
                'question': 'How do I negotiate salary?',
                'answer': 'Salary negotiation tips: 1) Research market rates for your role 2) Document your achievements and value 3) Consider total compensation (benefits, bonuses) 4) Practice your negotiation points 5) Be confident but flexible 6) Get offers in writing 7) Don\'t be afraid to ask for what you deserve. Know your worth!',
                'keywords': ['salary', 'negotiation', 'compensation', 'pay'],
                'confidence_score': 0.9
            },
            {
                'category': 'Skills Development',
                'question': 'How can I learn new skills effectively?',
                'answer': 'Effective skill learning: 1) Set clear, specific goals 2) Use multiple learning resources (courses, books, practice) 3) Apply skills through projects 4) Get feedback from others 5) Practice consistently 6) Join communities of learners 7) Track your progress. Focus on skills relevant to your career goals.',
                'keywords': ['learn', 'skills', 'effective', 'study'],
                'confidence_score': 0.85
            }
        ]

        for knowledge_item in knowledge_data:
            knowledge, created = ChatbotKnowledge.objects.get_or_create(
                category=knowledge_item['category'],
                question=knowledge_item['question'],
                defaults=knowledge_item
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Created knowledge: {knowledge.category} - {knowledge.question[:30]}...')
                )

        self.stdout.write(
            self.style.SUCCESS('Chatbot initialization completed successfully!')
        )
