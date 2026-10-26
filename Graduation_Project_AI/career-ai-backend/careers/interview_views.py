import random
import tempfile
import os
from decimal import Decimal
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone

from .models import InterviewSession, InterviewQuestion, InterviewAnswer, SavedAnswer
from .serializers import (
    InterviewSessionSerializer,
    CreateInterviewSessionSerializer,
    SubmitAnswerSerializer,
    SavedAnswerSerializer,
    InterviewAnswerSerializer,
)

# ─────────────────────────────────────────────────────────────────────────────
# Question Banks
# ─────────────────────────────────────────────────────────────────────────────

BEHAVIORAL_QUESTIONS = [
    "Tell me about a time you faced a significant challenge at work. How did you overcome it?",
    "Describe a situation where you had to work with a difficult team member. How did you handle it?",
    "Can you give me an example of a time you showed leadership, even without a formal title?",
    "Tell me about a time you failed. What did you learn from it?",
    "Describe a situation where you had to manage multiple competing priorities. How did you handle it?",
    "Give an example of a time you went above and beyond what was expected of you.",
    "Tell me about a time you had to adapt quickly to a major change.",
    "Describe a situation where you had to persuade someone to see things your way.",
    "Tell me about a project you are most proud of. What was your role?",
    "Describe a time when you had to make a difficult decision with limited information.",
]

TECHNICAL_QUESTIONS = {
    'software': [
        "Explain the difference between REST and GraphQL APIs.",
        "What is the difference between synchronous and asynchronous programming?",
        "How would you design a URL shortener like bit.ly?",
        "What are SOLID principles in software engineering?",
        "Explain the concept of database indexing and when you would use it.",
        "What is the difference between SQL and NoSQL databases?",
        "How would you approach debugging a performance issue in a production application?",
        "Explain how you would implement authentication and authorization in a web application.",
        "What is the difference between a stack and a queue?",
        "How does garbage collection work in Python or JavaScript?",
    ],
    'data': [
        "Explain the difference between supervised and unsupervised learning.",
        "What is the bias-variance tradeoff?",
        "How would you handle missing data in a dataset?",
        "What is the difference between precision and recall?",
        "Explain how a decision tree algorithm works.",
        "What is feature engineering and why is it important?",
        "How would you detect outliers in a dataset?",
        "Explain the concept of cross-validation.",
        "What is overfitting and how do you prevent it?",
        "How would you approach a classification problem with severely imbalanced classes?",
    ],
    'business': [
        "Walk me through how you would conduct a market analysis for a new product.",
        "How do you prioritize competing projects with limited resources?",
        "Describe your approach to creating a business case for a major investment.",
        "How would you measure the success of a new marketing campaign?",
        "Explain how you would identify and evaluate potential business risks.",
        "How do you approach building relationships with key stakeholders?",
        "Describe your experience with financial modeling and forecasting.",
        "How would you develop a go-to-market strategy for a new product?",
        "What frameworks do you use to analyze business problems?",
        "How do you stay updated with industry trends and incorporate them into your work?",
    ],
    'engineering': [
        "Explain the key differences between steel, concrete, and timber as structural materials.",
        "How would you approach a structural analysis for a multi-story building?",
        "What is the significance of factor of safety in engineering design?",
        "Explain the principles behind finite element analysis.",
        "How do you ensure quality control in large engineering projects?",
        "Describe your experience with CAD software and engineering tools.",
        "What are the main considerations when designing for seismic resistance?",
        "How do you approach risk management in an engineering project?",
        "Explain the concept of sustainability in modern engineering practice.",
        "How would you troubleshoot a structural failure in an existing building?",
    ],
    'architecture': [
        "How do you balance aesthetics with functionality in your designs?",
        "Walk me through your design process from concept to completion.",
        "How do you incorporate sustainability into your architectural designs?",
        "Describe a project where you had to significantly revise your design due to client feedback.",
        "How do you stay current with building codes and regulations?",
        "Explain how you approach designing accessible spaces for people with disabilities.",
        "How do you manage the relationship between a building's interior and exterior design?",
        "Describe your experience with Building Information Modeling (BIM) software.",
        "How do you incorporate natural light and ventilation in your designs?",
        "What is your approach to designing in a historical or cultural context?",
    ],
    'default': [
        "Describe a complex technical problem you solved recently. What was your approach?",
        "How do you stay updated with the latest developments in your field?",
        "What tools and technologies are you most proficient with?",
        "Describe a project where you had to learn a new skill quickly.",
        "How do you approach technical documentation?",
        "How do you ensure the quality of your technical work?",
        "Describe your experience working in cross-functional teams.",
        "What do you consider best practices in your field?",
        "How do you approach estimating the time and effort for complex tasks?",
        "Tell me about a time you disagreed with a technical decision. What did you do?",
    ],
}


def get_questions(career_role, interview_type, count=5):
    role_lower = career_role.lower()

    if any(k in role_lower for k in ['software', 'developer', 'programmer', 'coding', 'devops', 'backend', 'frontend', 'fullstack', 'web']):
        tech_bank = TECHNICAL_QUESTIONS['software']
    elif any(k in role_lower for k in ['data', 'analyst', 'scientist', 'ml', 'ai', 'machine learning', 'analytics']):
        tech_bank = TECHNICAL_QUESTIONS['data']
    elif any(k in role_lower for k in ['business', 'manager', 'consultant', 'marketing', 'product', 'strategy', 'finance', 'accounting']):
        tech_bank = TECHNICAL_QUESTIONS['business']
    elif any(k in role_lower for k in ['civil', 'mechanical', 'electrical', 'structural', 'industrial', 'chemical']):
        tech_bank = TECHNICAL_QUESTIONS['engineering']
    elif any(k in role_lower for k in ['architect', 'architecture', 'urban', 'interior design']):
        tech_bank = TECHNICAL_QUESTIONS['architecture']
    else:
        tech_bank = TECHNICAL_QUESTIONS['default']

    if interview_type == 'behavioral':
        selected = random.sample(BEHAVIORAL_QUESTIONS, min(count, len(BEHAVIORAL_QUESTIONS)))
    elif interview_type == 'technical':
        selected = random.sample(tech_bank, min(count, len(tech_bank)))
    else:
        n_tech = count // 2
        n_behav = count - n_tech
        tech = random.sample(tech_bank, min(n_tech, len(tech_bank)))
        behav = random.sample(BEHAVIORAL_QUESTIONS, min(n_behav, len(BEHAVIORAL_QUESTIONS)))
        selected = tech + behav
        random.shuffle(selected)

    return selected[:count]


# ─────────────────────────────────────────────────────────────────────────────
# AI Feedback Generator (rule-based)
# ─────────────────────────────────────────────────────────────────────────────

def generate_feedback(question_text, answer_text, career_role):
    words = answer_text.strip().split()
    word_count = len(words)
    answer_lower = answer_text.lower()
    question_lower = question_text.lower()

    is_behavioral = any(k in question_lower for k in [
        'time you', 'situation', 'example of', 'describe when', 'tell me about',
        'give me an example', 'how did you', 'have you ever',
    ])

    star_keywords = ['situation', 'task', 'action', 'result', 'outcome', 'challenge',
                     'team', 'project', 'resolved', 'learned', 'achieved', 'decided',
                     'implemented', 'improved', 'led', 'managed', 'delivered']
    tech_keywords = ['algorithm', 'database', 'api', 'server', 'architecture', 'design',
                     'performance', 'testing', 'implementation', 'system', 'analysis',
                     'data', 'model', 'framework', 'code', 'scalable', 'optimize',
                     'complexity', 'pattern', 'protocol', 'structure']
    confidence_negatives = ["i'm not sure", "maybe", "i think i", "probably", "i don't know",
                             "not really", "i guess", "kind of", "sort of"]

    star_count = sum(1 for k in star_keywords if k in answer_lower)
    tech_count = sum(1 for k in tech_keywords if k in answer_lower)
    confidence_issues = sum(1 for k in confidence_negatives if k in answer_lower)

    if word_count < 20:
        base_score = 28
    elif word_count < 50:
        base_score = 46
    elif word_count < 100:
        base_score = 62
    elif word_count < 180:
        base_score = 74
    elif word_count < 280:
        base_score = 82
    else:
        base_score = 85

    if is_behavioral:
        base_score += min(star_count * 3, 12)
    else:
        base_score += min(tech_count * 2, 10)

    base_score -= confidence_issues * 5
    score = max(20, min(97, base_score))

    if score >= 75 and confidence_issues == 0:
        confidence_level = 'High'
    elif score >= 52:
        confidence_level = 'Medium'
    else:
        confidence_level = 'Low'

    strengths = []
    if word_count >= 100:
        strengths.append("Provided a detailed and comprehensive answer")
    if is_behavioral and star_count >= 3:
        strengths.append("Used clear STAR structure with situation, action, and results")
    if not is_behavioral and tech_count >= 3:
        strengths.append("Demonstrated strong technical knowledge and domain vocabulary")
    if confidence_issues == 0 and word_count > 30:
        strengths.append("Communicated with confidence and conviction")
    if word_count >= 50:
        strengths.append("Addressed the core of the question directly")
    if not strengths:
        strengths.append("Attempted to engage with the question and provide a response")

    improvements = []
    if word_count < 80:
        improvements.append("Expand your answer with specific examples and more detail — aim for 100–200 words")
    if is_behavioral and star_count < 3:
        improvements.append("Apply the STAR method: Situation → Task → Action → Result for every behavioral question")
    if confidence_issues > 0:
        improvements.append("Replace uncertain phrases ('I think', 'maybe', 'I guess') with confident, direct statements")
    if not is_behavioral and tech_count < 2:
        improvements.append(f"Include more specific technical terminology relevant to {career_role}")
    if word_count > 320:
        improvements.append("Be more concise — practice delivering your key points within 2–3 minutes")
    if not improvements:
        improvements.append("Practice saying your answer out loud to improve natural flow and delivery pace")

    score_label = ("Excellent" if score >= 85 else "Good" if score >= 70
                   else "Average" if score >= 55 else "Below Average")
    method_tip = (
        "Always structure behavioral answers using the STAR method (Situation → Task → Action → Result)."
        if is_behavioral
        else "Connect your technical knowledge to concrete examples from your experience."
    )
    confidence_line = (
        "You demonstrated strong confidence throughout."
        if confidence_issues == 0
        else "Work on removing hesitant language to project stronger confidence."
    )
    detail_line = (
        "Well-structured and detailed."
        if word_count >= 100
        else "A good start — expanding with more detail would strengthen this significantly."
    )

    feedback_text = (
        f"Overall Assessment: {score_label} ({score:.0f}/100). "
        f"Your answer was {detail_line} "
        f"{method_tip} "
        f"{confidence_line}"
    )

    suggested_rewrite = None
    if score < 65 and is_behavioral:
        suggested_rewrite = (
            "Try restructuring like this: 'In my [role/project], I was faced with [specific situation]. "
            "My responsibility was to [task]. I approached this by [concrete actions]. "
            "As a result, [measurable outcome or learning].'"
        )
    elif score < 65:
        suggested_rewrite = (
            "Try adding more structure: Start with the core concept, explain how it works in practice, "
            "give a real example from your experience, then mention trade-offs or best practices."
        )

    return {
        'feedback_text': feedback_text,
        'score': Decimal(str(round(score, 2))),
        'strengths': strengths,
        'improvements': improvements,
        'suggested_rewrite': suggested_rewrite,
        'confidence_level': confidence_level,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Views
# ─────────────────────────────────────────────────────────────────────────────

class TranscribeAudioView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        audio_file = request.FILES.get('audio')
        if not audio_file:
            return Response({'error': 'No audio file provided'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            import speech_recognition as sr
        except ImportError:
            return Response({'error': 'Run: pip install SpeechRecognition'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        recognizer = sr.Recognizer()
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
            for chunk in audio_file.chunks():
                tmp.write(chunk)
            tmp_path = tmp.name
        try:
            with sr.AudioFile(tmp_path) as source:
                audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data)
            return Response({'transcript': text})
        except sr.UnknownValueError:
            return Response({'transcript': '', 'warning': 'Speech unclear — please try again'})
        except sr.RequestError as e:
            return Response({'error': f'Speech service error: {e}'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            try:
                os.unlink(tmp_path)
            except Exception:
                pass


class InterviewSessionListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        sessions = InterviewSession.objects.filter(user=request.user).order_by('-started_at')
        return Response(InterviewSessionSerializer(sessions, many=True).data)

    def post(self, request):
        serializer = CreateInterviewSessionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        career_role = serializer.validated_data['career_role']
        interview_type = serializer.validated_data['interview_type']

        session = InterviewSession.objects.create(
            user=request.user,
            career_role=career_role,
            interview_type=interview_type,
        )
        questions = get_questions(career_role, interview_type, count=5)
        for i, q_text in enumerate(questions, 1):
            InterviewQuestion.objects.create(
                session=session,
                question_text=q_text,
                order_number=i,
            )

        return Response(
            InterviewSessionSerializer(session).data,
            status=status.HTTP_201_CREATED,
        )


class InterviewSessionDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, session_id):
        try:
            session = (InterviewSession.objects
                       .prefetch_related('questions__answer')
                       .get(id=session_id, user=request.user))
        except InterviewSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(InterviewSessionSerializer(session).data)


class SubmitAnswerView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, session_id):
        try:
            session = InterviewSession.objects.get(id=session_id, user=request.user)
        except InterviewSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

        if session.completed_at:
            return Response({'error': 'Session already completed'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = SubmitAnswerSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        question_id = serializer.validated_data['question_id']
        answer_text = serializer.validated_data['answer_text']
        time_taken = serializer.validated_data['time_taken_seconds']

        try:
            question = InterviewQuestion.objects.get(id=question_id, session=session)
        except InterviewQuestion.DoesNotExist:
            return Response({'error': 'Question not found'}, status=status.HTTP_404_NOT_FOUND)

        feedback = generate_feedback(question.question_text, answer_text, session.career_role)

        answer, _ = InterviewAnswer.objects.update_or_create(
            question=question,
            defaults={'answer_text': answer_text, 'time_taken_seconds': time_taken, **feedback},
        )
        return Response(InterviewAnswerSerializer(answer).data)


class CompleteSessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, session_id):
        try:
            session = InterviewSession.objects.get(id=session_id, user=request.user)
        except InterviewSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

        answers = InterviewAnswer.objects.filter(question__session=session)
        overall = (sum(float(a.score) for a in answers) / answers.count()) if answers.exists() else 0

        session.completed_at = timezone.now()
        session.overall_score = Decimal(str(round(overall, 2)))
        session.save()

        return Response({'overall_score': round(overall, 2), 'message': 'Interview completed'})


class SavedAnswerListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        saved = SavedAnswer.objects.filter(user=request.user).order_by('-saved_at')
        return Response(SavedAnswerSerializer(saved, many=True).data)

    def post(self, request):
        serializer = SavedAnswerSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
