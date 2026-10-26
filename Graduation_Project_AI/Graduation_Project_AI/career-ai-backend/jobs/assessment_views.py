import json
import os
import re
import logging

try:
    from dotenv import load_dotenv as _load_dotenv
    _load_dotenv()          # safety net — settings.py already calls this on startup
except ImportError:
    pass

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

logger = logging.getLogger(__name__)

# ── Fallback question bank (used when OpenAI is unavailable / 429) ─────── #
_Q = {
    'Computer Engineering': {
        'mcq': [
            {'question': 'What is the time complexity of binary search?',
             'options': ['A) O(n)', 'B) O(log n)', 'C) O(n²)', 'D) O(1)'],
             'expected_skill': 'Algorithms', 'correct_answer': 'B'},
            {'question': 'Which data structure follows LIFO order?',
             'options': ['A) Queue', 'B) Array', 'C) Stack', 'D) Heap'],
             'expected_skill': 'Data Structures', 'correct_answer': 'C'},
            {'question': 'In SQL, which clause filters results after GROUP BY?',
             'options': ['A) WHERE', 'B) HAVING', 'C) ORDER BY', 'D) FILTER'],
             'expected_skill': 'Databases', 'correct_answer': 'B'},
            {'question': 'Which HTTP method is idempotent and used for full updates?',
             'options': ['A) POST', 'B) PATCH', 'C) PUT', 'D) DELETE'],
             'expected_skill': 'APIs', 'correct_answer': 'C'},
        ],
        'behavioral': [
            {'question': 'Describe a challenging software project. What was the hardest technical problem and how did you solve it?',
             'expected_skill': 'Problem Solving'},
            {'question': 'How do you stay current with rapidly evolving technologies in your field?',
             'expected_skill': 'Continuous Learning'},
        ],
        'situational': [
            {'question': 'You discover a critical bug one hour before a production deployment. Walk me through your decision-making process.',
             'expected_skill': 'Decision Making'},
        ],
    },
    'Electrical Engineering': {
        'mcq': [
            {'question': "What does Ohm's Law state?",
             'options': ['A) V = IR', 'B) V = I/R', 'C) P = VI²', 'D) I = VR'],
             'expected_skill': 'Circuit Analysis', 'correct_answer': 'A'},
            {'question': 'A NAND gate with all HIGH inputs produces which output?',
             'options': ['A) HIGH', 'B) LOW', 'C) UNDEFINED', 'D) FLOATING'],
             'expected_skill': 'Digital Electronics', 'correct_answer': 'B'},
            {'question': 'What is the unit of electrical capacitance?',
             'options': ['A) Henry', 'B) Ohm', 'C) Farad', 'D) Tesla'],
             'expected_skill': 'Electronics', 'correct_answer': 'C'},
            {'question': 'Which transformer type increases voltage from primary to secondary?',
             'options': ['A) Step-down', 'B) Step-up', 'C) Isolation', 'D) Auto'],
             'expected_skill': 'Power Systems', 'correct_answer': 'B'},
        ],
        'behavioral': [
            {'question': 'Describe an electrical project where you had to troubleshoot a complex fault. What tools did you use?',
             'expected_skill': 'Troubleshooting'},
            {'question': 'How do you ensure safety compliance when working on high-voltage systems?',
             'expected_skill': 'Safety Protocols'},
        ],
        'situational': [
            {'question': 'A power system failure occurs during peak hours. Walk me through your diagnosis and recovery steps.',
             'expected_skill': 'System Analysis'},
        ],
    },
    'Mechanical Engineering': {
        'mcq': [
            {'question': 'What is the SI unit of mechanical stress?',
             'options': ['A) Newton', 'B) Pascal', 'C) Joule', 'D) Watt'],
             'expected_skill': 'Mechanics of Materials', 'correct_answer': 'B'},
            {'question': 'Which law is the basis of the First Law of Thermodynamics?',
             'options': ['A) Conservation of momentum', 'B) Conservation of energy', "C) Newton's second law", "D) Boyle's law"],
             'expected_skill': 'Thermodynamics', 'correct_answer': 'B'},
            {'question': "Bernoulli's principle relates fluid velocity to:",
             'options': ['A) Temperature', 'B) Viscosity', 'C) Pressure', 'D) Density'],
             'expected_skill': 'Fluid Mechanics', 'correct_answer': 'C'},
            {'question': 'CAD software is primarily used for:',
             'options': ['A) Financial modeling', 'B) Creating engineering drawings and models', 'C) Statistical analysis', 'D) Project scheduling'],
             'expected_skill': 'CAD', 'correct_answer': 'B'},
        ],
        'behavioral': [
            {'question': 'Describe a mechanical design project you completed. What design constraints did you work within?',
             'expected_skill': 'Design'},
            {'question': 'How do you approach failure analysis when a mechanical component fails unexpectedly?',
             'expected_skill': 'Root Cause Analysis'},
        ],
        'situational': [
            {'question': 'A component fails repeatedly on the production line. Describe your systematic process to identify and permanently fix the root cause.',
             'expected_skill': 'Problem Solving'},
        ],
    },
    'Civil Engineering': {
        'mcq': [
            {'question': 'What is the typical compressive strength range for normal-weight concrete?',
             'options': ['A) 5–10 MPa', 'B) 20–40 MPa', 'C) 60–80 MPa', 'D) 100–120 MPa'],
             'expected_skill': 'Structural Materials', 'correct_answer': 'B'},
            {'question': 'Pile foundations are chosen when:',
             'options': ['A) Soil bearing capacity is high', 'B) The load is very light',
                         'C) Soil bearing capacity is low or variable', 'D) The site is fully exposed'],
             'expected_skill': 'Foundation Engineering', 'correct_answer': 'C'},
            {'question': 'What does BOQ stand for in construction?',
             'options': ['A) Bill of Quantities', 'B) Board of Quality', 'C) Budget of Quality', 'D) Bill of Quality'],
             'expected_skill': 'Project Management', 'correct_answer': 'A'},
            {'question': 'Soil liquefaction is primarily triggered by:',
             'options': ['A) Heavy rainfall', 'B) Seismic vibrations in saturated loose soils',
                         'C) Groundwater depletion', 'D) Freeze-thaw cycles'],
             'expected_skill': 'Geotechnical Engineering', 'correct_answer': 'B'},
        ],
        'behavioral': [
            {'question': 'Describe a construction project you contributed to. What were the main technical challenges?',
             'expected_skill': 'Project Experience'},
            {'question': 'How do you ensure construction quality and compliance with local building codes?',
             'expected_skill': 'Quality Control'},
        ],
        'situational': [
            {'question': 'During construction you discover a conflict between structural and MEP drawings. How do you resolve it without delaying the schedule?',
             'expected_skill': 'Coordination'},
        ],
    },
    'Industrial Engineering': {
        'mcq': [
            {'question': 'What does OEE measure in manufacturing?',
             'options': ['A) Overall Equipment Effectiveness', 'B) Output Efficiency Engine',
                         'C) Operational Energy Estimate', 'D) Order Entry Execution'],
             'expected_skill': 'Manufacturing', 'correct_answer': 'A'},
            {'question': 'The primary goal of Lean Manufacturing is to:',
             'options': ['A) Maximize speed', 'B) Eliminate all waste', 'C) Reduce headcount', 'D) Increase automation'],
             'expected_skill': 'Lean', 'correct_answer': 'B'},
            {'question': 'In Six Sigma, DMAIC stands for:',
             'options': ['A) Define, Measure, Analyze, Improve, Control',
                         'B) Design, Monitor, Assess, Implement, Check',
                         'C) Data, Method, Analysis, Integration, Completion',
                         'D) Define, Manage, Analyze, Improve, Certify'],
             'expected_skill': 'Six Sigma', 'correct_answer': 'A'},
            {'question': 'Economic Order Quantity (EOQ) is used to minimize:',
             'options': ['A) Production time', 'B) Total inventory holding and ordering costs',
                         'C) Safety stock', 'D) Lead time'],
             'expected_skill': 'Inventory Management', 'correct_answer': 'B'},
        ],
        'behavioral': [
            {'question': 'Describe a process improvement project you led. What metrics improved and how did you measure success?',
             'expected_skill': 'Process Improvement'},
            {'question': 'How do you prioritize when multiple production issues arise simultaneously?',
             'expected_skill': 'Prioritization'},
        ],
        'situational': [
            {'question': 'Production output has dropped 20% due to an unidentified bottleneck. Walk me through your diagnosis and resolution process.',
             'expected_skill': 'Operations Analysis'},
        ],
    },
}
_Q['Other'] = _Q['Computer Engineering']

_FIELD_CAREERS = {
    'Computer Engineering': [
        ('Software Engineer', 82), ('Backend Developer', 78),
        ('Full Stack Developer', 75), ('Systems Engineer', 70), ('DevOps Engineer', 66),
    ],
    'Electrical Engineering': [
        ('Embedded Systems Engineer', 80), ('Power Systems Engineer', 76),
        ('Electronics Design Engineer', 74), ('Control Systems Engineer', 71), ('RF Engineer', 67),
    ],
    'Mechanical Engineering': [
        ('Mechanical Design Engineer', 80), ('Manufacturing Engineer', 76),
        ('Thermal/HVAC Engineer', 73), ('Structural Analyst', 70), ('Maintenance Engineer', 66),
    ],
    'Civil Engineering': [
        ('Structural Engineer', 80), ('Geotechnical Engineer', 76),
        ('Project Manager', 74), ('Site Engineer', 71), ('Infrastructure Planner', 67),
    ],
    'Industrial Engineering': [
        ('Process Engineer', 80), ('Operations Manager', 76),
        ('Quality Engineer', 74), ('Supply Chain Analyst', 71), ('Lean/Six Sigma Consultant', 67),
    ],
}
_FIELD_CAREERS['Other'] = _FIELD_CAREERS['Computer Engineering']


def _is_quota_error(exc: Exception) -> bool:
    msg = str(exc).lower()
    return '429' in msg or 'quota' in msg or 'rate limit' in msg or 'insufficient_quota' in msg


def _fallback_questions(primary_field: str, top_skills: list, confidence: str) -> list:
    """Rule-based generator — used when OpenAI is unavailable or quota exceeded."""
    bank  = _Q.get(primary_field, _Q['Other'])
    qid   = 1
    result = []
    for q in bank['mcq'][:4]:
        result.append({'id': qid, 'type': 'mcq', **q})
        qid += 1
    for q in bank['behavioral'][:2]:
        result.append({'id': qid, 'type': 'behavioral', 'options': [], 'correct_answer': '', **q})
        qid += 1
    for q in bank['situational'][:1]:
        result.append({'id': qid, 'type': 'situational', 'options': [], 'correct_answer': '', **q})
        qid += 1
    return result


def _fallback_career_matches(resume_analysis: dict) -> list:
    """Rule-based career matcher — used when OpenAI is unavailable or quota exceeded."""
    field   = resume_analysis.get('primary_field', 'Other')
    skills  = resume_analysis.get('top_skills', [])
    careers = _FIELD_CAREERS.get(field, _FIELD_CAREERS['Other'])
    result  = []
    for title, base_score in careers:
        score = min(base_score + len(skills) * 0.5, 97)
        result.append({
            'title': title,
            'match_score': round(score),
            'reason': f'Based on your {field} profile and {len(skills)} detected skills.',
            'required_skills': skills[:3] if skills else [],
            'missing_skills': [],
            'learning_path': [
                f'1. Deepen core {field} fundamentals',
                '2. Build 2–3 real-world portfolio projects',
                '3. Earn a relevant industry certification',
            ],
        })
    return result


def _get_openai_key() -> str:
    """Return the API key or raise a clear ValueError."""
    key = os.getenv('OPENAI_API_KEY', '').strip()
    # Debug line — visible in the Django terminal
    print(f'[Assessment] OPENAI KEY LOADED: {bool(key)}')
    if not key:
        raise ValueError(
            'OPENAI_API_KEY is not set. '
            'Add it to your .env file and restart the Django server.'
        )
    return key


def _strip_fences(text: str) -> str:
    """Remove markdown code fences that OpenAI sometimes wraps around JSON."""
    if text.startswith('```'):
        text = re.sub(r'^```[a-zA-Z]*\n?', '', text)
        text = re.sub(r'\n?```$', '', text)
    return text.strip()


class AssessmentGenerateView(APIView):
    """POST /api/jobs/assessment/generate/

    Body:
        primary_field       str
        top_skills          list[str]
        education_extracted dict  (degree, field, university, status)
        confidence          str  (High | Medium | Low)
        experience          dict

    Returns:
        { "questions": [ { id, question, type, options, expected_skill, correct_answer } ] }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        primary_field       = request.data.get('primary_field', 'Other')
        top_skills          = request.data.get('top_skills', [])
        education_extracted = request.data.get('education_extracted', {})
        confidence          = request.data.get('confidence', 'Medium')
        experience          = request.data.get('experience', {})

        used_fallback = False
        try:
            questions = self._generate_with_openai(
                primary_field, top_skills, education_extracted, confidence, experience
            )
            if not questions:
                raise RuntimeError('OpenAI returned empty question list')
        except Exception as exc:
            if _is_quota_error(exc):
                logger.warning('[Assessment] OpenAI quota/rate-limit — using offline fallback')
            else:
                logger.error(f'[Assessment] OpenAI failed ({exc}) — using offline fallback')
            questions = _fallback_questions(primary_field, top_skills, confidence)
            used_fallback = True

        return Response({'questions': questions, 'used_fallback': used_fallback})

    # ------------------------------------------------------------------ #
    def _generate_with_openai(self, primary_field, top_skills,
                               education_extracted, confidence, experience):
        api_key = _get_openai_key()   # raises ValueError if missing

        import openai
        client = openai.OpenAI(api_key=api_key)

        try:

            difficulty = {'High': 'advanced', 'Medium': 'intermediate', 'Low': 'beginner'}.get(
                confidence, 'intermediate'
            )
            skills_str  = ', '.join(top_skills[:8]) if top_skills else 'Not specified'
            degree      = education_extracted.get('degree', 'Unknown')
            edu_field   = education_extracted.get('field', 'Unknown')
            exp_years   = experience.get('total_years') if isinstance(experience, dict) else None
            exp_label   = f'{exp_years} years' if exp_years is not None else 'Not specified'

            system_prompt = (
                "You are an expert technical interviewer for engineering positions.\n"
                "Generate TARGETED questions based STRICTLY on the candidate's resume.\n"
                "Every question must test a REAL skill from the provided skill list.\n"
                "Never generate generic or off-topic questions.\n"
                "Return ONLY valid JSON — no markdown, no explanation."
            )

            user_prompt = (
                f"Generate exactly 7 assessment questions for a candidate with:\n"
                f"- Primary Field: {primary_field}\n"
                f"- Education: {degree} in {edu_field}\n"
                f"- Experience: {exp_label}\n"
                f"- Top Skills: {skills_str}\n"
                f"- Difficulty: {difficulty}\n\n"
                f"STRICT RULES:\n"
                f"- ALL questions MUST relate to {primary_field}\n"
                f"- Questions MUST test skills from: {skills_str}\n"
                f"- Include: 4 technical MCQs, 2 behavioral (open text), 1 situational (open text)\n"
                f"- For MCQ: exactly 4 options labeled A–D\n"
                f"- For behavioral/situational: options = []\n\n"
                "Return ONLY this JSON (no extra text):\n"
                '{\n'
                '  "questions": [\n'
                '    {\n'
                '      "id": 1,\n'
                '      "question": "<specific question targeting a resume skill>",\n'
                '      "type": "mcq",\n'
                '      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],\n'
                '      "expected_skill": "<skill name from resume>",\n'
                '      "correct_answer": "A"\n'
                '    },\n'
                '    {\n'
                '      "id": 2,\n'
                '      "question": "<behavioral question>",\n'
                '      "type": "behavioral",\n'
                '      "options": [],\n'
                '      "expected_skill": "<skill name>",\n'
                '      "correct_answer": ""\n'
                '    }\n'
                '  ]\n'
                '}'
            )

            response = client.chat.completions.create(
                model='gpt-4o-mini',
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user',   'content': user_prompt},
                ],
                temperature=0.3,
                max_tokens=2500,
            )

            result_text = _strip_fences(response.choices[0].message.content.strip())
            logger.debug(f'[Assessment] Raw OpenAI response: {result_text[:300]}')
            parsed    = json.loads(result_text)
            questions = parsed.get('questions', [])
            logger.info(f'[Assessment] Generated {len(questions)} questions for field={primary_field}')
            return questions

        except json.JSONDecodeError as jde:
            logger.error(f'[Assessment] JSON parse error — raw text: {result_text[:500]}')
            raise RuntimeError(f'OpenAI returned invalid JSON: {jde}') from jde
        except Exception as exc:
            raise RuntimeError(str(exc)) from exc


# ─────────────────────────────────────────────────────────────────────── #

class AssessmentSubmitView(APIView):
    """POST /api/jobs/assessment/submit/

    Body:
        resume_analysis  dict   (full analysis object from resume upload)
        questions        list   (generated questions)
        answers          dict   { "<question_id>": "<answer_text>" }

    Returns:
        { "career_matches": [ { title, match_score, reason,
                                 required_skills, missing_skills, learning_path } ] }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        resume_analysis = request.data.get('resume_analysis', {})
        questions       = request.data.get('questions', [])
        answers         = request.data.get('answers', {})

        used_fallback = False
        try:
            career_matches = self._match_with_openai(resume_analysis, questions, answers)
            if not career_matches:
                raise RuntimeError('OpenAI returned empty career matches')
        except Exception as exc:
            if _is_quota_error(exc):
                logger.warning('[CareerMatch] OpenAI quota/rate-limit — using offline fallback')
            else:
                logger.error(f'[CareerMatch] OpenAI failed ({exc}) — using offline fallback')
            career_matches = _fallback_career_matches(resume_analysis)
            used_fallback = True

        return Response({'career_matches': career_matches, 'used_fallback': used_fallback})

    # ------------------------------------------------------------------ #
    def _match_with_openai(self, resume_analysis, questions, answers):
        api_key = _get_openai_key()   # raises ValueError if missing

        import openai
        client = openai.OpenAI(api_key=api_key)

        try:

            primary_field       = resume_analysis.get('primary_field', 'Other')
            top_skills          = resume_analysis.get('top_skills', [])
            confidence          = resume_analysis.get('confidence', 'Medium')
            education_extracted = resume_analysis.get('education_extracted', {})

            # Build a readable Q&A transcript
            qa_lines = []
            for q in questions:
                qid    = str(q.get('id', ''))
                q_text = q.get('question', '')
                q_type = q.get('type', '')
                answer = answers.get(qid, 'Not answered')
                if q_type == 'mcq':
                    correct = q.get('correct_answer', '')
                    correctness = '✓ Correct' if answer == correct else '✗ Incorrect'
                    qa_lines.append(f'[MCQ] Q: {q_text}\n  Selected: {answer} | {correctness}')
                else:
                    qa_lines.append(f'[{q_type.upper()}] Q: {q_text}\n  Answer: {answer}')

            qa_summary = '\n'.join(qa_lines) if qa_lines else 'No assessment answers provided.'

            system_prompt = (
                "You are a strict AI career advisor for an engineering career system.\n\n"
                "Your task: analyze the candidate's resume + assessment performance "
                "and produce precise career match recommendations.\n\n"
                "RULES:\n"
                "1. ALL career matches MUST belong to the detected engineering field.\n"
                "2. match_score must reflect BOTH resume strength AND assessment performance.\n"
                "3. If the candidate answered MCQs incorrectly, lower match scores accordingly.\n"
                "4. learning_path must list 3–5 REAL tools, certifications, or courses — not generic advice.\n"
                "5. DO NOT invent random job titles. Use real roles for the field.\n"
                "6. Return ONLY valid JSON — no markdown, no explanation."
            )

            user_prompt = (
                f"Candidate Profile:\n"
                f"- Primary Field: {primary_field}\n"
                f"- Confidence Level: {confidence}\n"
                f"- Education: {education_extracted.get('degree', 'Unknown')} "
                f"in {education_extracted.get('field', 'Unknown')}\n"
                f"- Top Skills: {', '.join(top_skills[:10])}\n\n"
                f"Assessment Transcript:\n{qa_summary}\n\n"
                "Generate exactly 5 career matches. Return ONLY this JSON:\n"
                '{\n'
                '  "career_matches": [\n'
                '    {\n'
                '      "title": "<real job title>",\n'
                '      "match_score": <integer 40-98>,\n'
                '      "reason": "<why this role fits based on resume + assessment performance>",\n'
                '      "required_skills": ["skill1", "skill2", "skill3"],\n'
                '      "missing_skills": ["skill1", "skill2"],\n'
                '      "learning_path": ["step1: ...", "step2: ...", "step3: ..."]\n'
                '    }\n'
                '  ]\n'
                '}\n\n'
                f'CRITICAL: ALL titles MUST belong to {primary_field}. '
                'Sort by match_score descending.'
            )

            response = client.chat.completions.create(
                model='gpt-4o-mini',
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user',   'content': user_prompt},
                ],
                temperature=0.2,
                max_tokens=3000,
            )

            result_text    = _strip_fences(response.choices[0].message.content.strip())
            logger.debug(f'[CareerMatch] Raw OpenAI response: {result_text[:300]}')
            parsed         = json.loads(result_text)
            career_matches = parsed.get('career_matches', [])
            career_matches.sort(key=lambda x: x.get('match_score', 0), reverse=True)
            logger.info(
                f'[CareerMatch] Generated {len(career_matches)} matches for field={primary_field}'
            )
            return career_matches

        except json.JSONDecodeError as jde:
            logger.error(f'[CareerMatch] JSON parse error — raw text: {result_text[:500]}')
            raise RuntimeError(f'OpenAI returned invalid JSON: {jde}') from jde
        except Exception as exc:
            raise RuntimeError(str(exc)) from exc
