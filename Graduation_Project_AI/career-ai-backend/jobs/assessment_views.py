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
             'options': ['A) O(n)', 'B) O(log n)', 'C) O(n\u00b2)', 'D) O(1)'],
             'expected_skill': 'Algorithms', 'correct_answer': 'B',
             'explanation': 'Binary search halves the search space each step, giving O(log n) time.'},
            {'question': 'Which data structure follows LIFO order?',
             'options': ['A) Queue', 'B) Array', 'C) Stack', 'D) Heap'],
             'expected_skill': 'Data Structures', 'correct_answer': 'C',
             'explanation': 'A Stack follows Last-In, First-Out (LIFO) order.'},
            {'question': 'In SQL, which clause filters results after GROUP BY?',
             'options': ['A) WHERE', 'B) HAVING', 'C) ORDER BY', 'D) FILTER'],
             'expected_skill': 'Databases', 'correct_answer': 'B',
             'explanation': 'HAVING filters grouped results, while WHERE filters individual rows before grouping.'},
            {'question': 'Which HTTP method is idempotent and used for full updates?',
             'options': ['A) POST', 'B) PATCH', 'C) PUT', 'D) DELETE'],
             'expected_skill': 'APIs', 'correct_answer': 'C',
             'explanation': 'PUT replaces the entire resource and is idempotent; calling it multiple times has the same effect.'},
            {'question': 'Which design pattern ensures only one instance of a class exists?',
             'options': ['A) Factory', 'B) Observer', 'C) Singleton', 'D) Decorator'],
             'expected_skill': 'Design Patterns', 'correct_answer': 'C',
             'explanation': 'The Singleton pattern restricts instantiation to a single object.'},
            {'question': 'In Git, which command creates a new branch and switches to it?',
             'options': ['A) git branch new', 'B) git checkout -b new', 'C) git merge new', 'D) git commit -b new'],
             'expected_skill': 'Version Control', 'correct_answer': 'B',
             'explanation': 'git checkout -b <name> creates and switches to the new branch in one step.'},
            {'question': 'What does REST stand for in web services?',
             'options': ['A) Remote Execution Service Technology', 'B) Representational State Transfer', 'C) Resource Encapsulation Standard Template', 'D) Rapid Event Streaming Technology'],
             'expected_skill': 'Web Services', 'correct_answer': 'B',
             'explanation': 'REST (Representational State Transfer) is an architectural style for distributed hypermedia systems.'},
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
             'options': ['A) V = IR', 'B) V = I/R', 'C) P = VI\u00b2', 'D) I = VR'],
             'expected_skill': 'Circuit Analysis', 'correct_answer': 'A',
             'explanation': "Ohm's Law states V = IR, where V is voltage, I is current, and R is resistance."},
            {'question': 'A NAND gate with all HIGH inputs produces which output?',
             'options': ['A) HIGH', 'B) LOW', 'C) UNDEFINED', 'D) FLOATING'],
             'expected_skill': 'Digital Electronics', 'correct_answer': 'B',
             'explanation': 'A NAND gate outputs LOW only when all inputs are HIGH.'},
            {'question': 'What is the unit of electrical capacitance?',
             'options': ['A) Henry', 'B) Ohm', 'C) Farad', 'D) Tesla'],
             'expected_skill': 'Electronics', 'correct_answer': 'C',
             'explanation': 'Capacitance is measured in Farads (F). Henry is for inductance, Ohm for resistance.'},
            {'question': 'Which transformer type increases voltage from primary to secondary?',
             'options': ['A) Step-down', 'B) Step-up', 'C) Isolation', 'D) Auto'],
             'expected_skill': 'Power Systems', 'correct_answer': 'B',
             'explanation': 'A step-up transformer has more secondary turns than primary, increasing the output voltage.'},
            {'question': 'What does PWM stand for in power electronics?',
             'options': ['A) Pulse Width Modulation', 'B) Power Wave Management', 'C) Periodic Waveform Mode', 'D) Phase Width Multiplier'],
             'expected_skill': 'Power Electronics', 'correct_answer': 'A',
             'explanation': 'PWM (Pulse Width Modulation) controls power delivery by varying the duty cycle of a signal.'},
            {'question': 'Which component stores energy in a magnetic field?',
             'options': ['A) Capacitor', 'B) Resistor', 'C) Inductor', 'D) Diode'],
             'expected_skill': 'Electronics', 'correct_answer': 'C',
             'explanation': 'An inductor stores energy in its magnetic field when current flows through it.'},
            {'question': "Kirchhoff's Voltage Law (KVL) states that in a closed loop:",
             'options': ['A) The sum of currents equals zero', 'B) The sum of voltages equals zero', 'C) Power is conserved', 'D) Resistance is constant'],
             'expected_skill': 'Circuit Analysis', 'correct_answer': 'B',
             'explanation': 'KVL states that the algebraic sum of all voltages around a closed loop equals zero.'},
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
             'expected_skill': 'Mechanics of Materials', 'correct_answer': 'B',
             'explanation': 'Stress = Force / Area, measured in Pascals (Pa = N/m\u00b2).'},
            {'question': 'Which law is the basis of the First Law of Thermodynamics?',
             'options': ['A) Conservation of momentum', 'B) Conservation of energy', "C) Newton's second law", "D) Boyle's law"],
             'expected_skill': 'Thermodynamics', 'correct_answer': 'B',
             'explanation': 'The First Law of Thermodynamics is based on the conservation of energy: energy cannot be created or destroyed.'},
            {'question': "Bernoulli's principle relates fluid velocity to:",
             'options': ['A) Temperature', 'B) Viscosity', 'C) Pressure', 'D) Density'],
             'expected_skill': 'Fluid Mechanics', 'correct_answer': 'C',
             'explanation': "Bernoulli's principle states that as fluid velocity increases, pressure decreases."},
            {'question': 'CAD software is primarily used for:',
             'options': ['A) Financial modeling', 'B) Creating engineering drawings and models', 'C) Statistical analysis', 'D) Project scheduling'],
             'expected_skill': 'CAD', 'correct_answer': 'B',
             'explanation': 'CAD (Computer-Aided Design) software is used to create precision engineering drawings and 3D models.'},
            {'question': 'Young\'s modulus is a measure of a material\'s:',
             'options': ['A) Hardness', 'B) Toughness', 'C) Stiffness (resistance to elastic deformation)', 'D) Yield strength'],
             'expected_skill': 'Mechanics of Materials', 'correct_answer': 'C',
             'explanation': "Young's modulus (E = stress/strain) describes how stiff a material is under elastic loading."},
            {'question': 'Which heat transfer mode requires a medium (fluid or solid) to transfer energy?',
             'options': ['A) Radiation', 'B) Convection', 'C) Both A and B', 'D) Neither'],
             'expected_skill': 'Thermodynamics', 'correct_answer': 'B',
             'explanation': 'Convection transfers heat through fluid motion and requires a medium; radiation does not.'},
            {'question': 'In gear systems, if the driver gear has 20 teeth and the driven gear has 40, the gear ratio is:',
             'options': ['A) 0.5', 'B) 1', 'C) 2', 'D) 4'],
             'expected_skill': 'Machine Design', 'correct_answer': 'C',
             'explanation': 'Gear ratio = driven/driver = 40/20 = 2. The driven gear turns at half the speed of the driver.'},
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
             'options': ['A) 5\u201310 MPa', 'B) 20\u201340 MPa', 'C) 60\u201380 MPa', 'D) 100\u2013120 MPa'],
             'expected_skill': 'Structural Materials', 'correct_answer': 'B',
             'explanation': 'Normal-weight concrete typically has a compressive strength of 20\u201340 MPa (f\'c).'},
            {'question': 'Pile foundations are chosen when:',
             'options': ['A) Soil bearing capacity is high', 'B) The load is very light',
                         'C) Soil bearing capacity is low or variable', 'D) The site is fully exposed'],
             'expected_skill': 'Foundation Engineering', 'correct_answer': 'C',
             'explanation': 'Piles transfer loads to deeper, more stable strata when shallow soil is weak or variable.'},
            {'question': 'What does BOQ stand for in construction?',
             'options': ['A) Bill of Quantities', 'B) Board of Quality', 'C) Budget of Quality', 'D) Bill of Quality'],
             'expected_skill': 'Project Management', 'correct_answer': 'A',
             'explanation': 'BOQ (Bill of Quantities) is a document listing materials, labor, and costs for a construction project.'},
            {'question': 'Soil liquefaction is primarily triggered by:',
             'options': ['A) Heavy rainfall', 'B) Seismic vibrations in saturated loose soils',
                         'C) Groundwater depletion', 'D) Freeze-thaw cycles'],
             'expected_skill': 'Geotechnical Engineering', 'correct_answer': 'B',
             'explanation': 'Liquefaction occurs when seismic shaking causes saturated loose soil to behave like a liquid.'},
            {'question': 'The critical path in project scheduling is:',
             'options': ['A) The shortest route through the project', 'B) The path with the most resources', 'C) The longest path determining project duration', 'D) The path with the least risk'],
             'expected_skill': 'Project Management', 'correct_answer': 'C',
             'explanation': 'The critical path is the longest sequence of dependent tasks, determining the minimum project duration.'},
            {'question': 'Reinforced concrete combines concrete with steel primarily to:',
             'options': ['A) Reduce weight', 'B) Improve tensile strength', 'C) Enhance thermal insulation', 'D) Lower cost'],
             'expected_skill': 'Structural Materials', 'correct_answer': 'B',
             'explanation': 'Concrete is strong in compression but weak in tension; steel reinforcement provides the tensile strength.'},
            {'question': 'Which survey instrument measures horizontal and vertical angles?',
             'options': ['A) Level', 'B) Theodolite', 'C) GPS receiver', 'D) Planimeter'],
             'expected_skill': 'Surveying', 'correct_answer': 'B',
             'explanation': 'A theodolite (or total station) measures both horizontal and vertical angles precisely.'},
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
             'expected_skill': 'Manufacturing', 'correct_answer': 'A',
             'explanation': 'OEE (Overall Equipment Effectiveness) = Availability \u00d7 Performance \u00d7 Quality.'},
            {'question': 'The primary goal of Lean Manufacturing is to:',
             'options': ['A) Maximize speed', 'B) Eliminate all waste', 'C) Reduce headcount', 'D) Increase automation'],
             'expected_skill': 'Lean', 'correct_answer': 'B',
             'explanation': 'Lean focuses on eliminating all forms of waste (muda) to improve flow and value delivery.'},
            {'question': 'In Six Sigma, DMAIC stands for:',
             'options': ['A) Define, Measure, Analyze, Improve, Control',
                         'B) Design, Monitor, Assess, Implement, Check',
                         'C) Data, Method, Analysis, Integration, Completion',
                         'D) Define, Manage, Analyze, Improve, Certify'],
             'expected_skill': 'Six Sigma', 'correct_answer': 'A',
             'explanation': 'DMAIC is a data-driven improvement cycle: Define, Measure, Analyze, Improve, Control.'},
            {'question': 'Economic Order Quantity (EOQ) is used to minimize:',
             'options': ['A) Production time', 'B) Total inventory holding and ordering costs',
                         'C) Safety stock', 'D) Lead time'],
             'expected_skill': 'Inventory Management', 'correct_answer': 'B',
             'explanation': 'EOQ finds the order quantity that minimizes total inventory holding and ordering costs.'},
            {'question': 'Which technique breaks a process into sequential steps to identify non-value-added activities?',
             'options': ['A) FMEA', 'B) Value Stream Mapping', 'C) Control Chart', 'D) Regression Analysis'],
             'expected_skill': 'Lean', 'correct_answer': 'B',
             'explanation': 'Value Stream Mapping (VSM) visualizes material and information flow to highlight waste.'},
            {'question': 'In ergonomics, the primary goal is to:',
             'options': ['A) Maximize output speed', 'B) Minimize cost', 'C) Fit the work environment to the worker', 'D) Increase machine uptime'],
             'expected_skill': 'Ergonomics', 'correct_answer': 'C',
             'explanation': 'Ergonomics designs workplaces and tools to fit human capabilities, reducing strain and errors.'},
            {'question': 'A fishbone (Ishikawa) diagram is used to:',
             'options': ['A) Track production output over time', 'B) Identify root causes of a problem', 'C) Schedule project milestones', 'D) Calculate inventory costs'],
             'expected_skill': 'Quality Engineering', 'correct_answer': 'B',
             'explanation': 'The Ishikawa diagram organizes potential causes of a problem into categories for root-cause analysis.'},
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
    extra_mcq = bank['mcq']
    for q in extra_mcq[4:7]:
        result.append({'id': qid, 'type': 'mcq', **q})
        qid += 1
    return result


def _fallback_career_matches(resume_analysis: dict,
                             questions: list | None = None,
                             answers: dict | None = None) -> list:
    """Rule-based career matcher with dynamic scoring based on assessment performance.
    Formula: finalScore = baseScore * (resumeFactor*0.6 + assessmentFactor*0.4)
    """
    field   = resume_analysis.get('primary_field', 'Other')
    skills  = resume_analysis.get('top_skills', [])
    confidence = resume_analysis.get('confidence', 'Medium')
    careers = _FIELD_CAREERS.get(field, _FIELD_CAREERS['Other'])

    # Resume strength factor
    confidence_map = {'High': 0.85, 'Medium': 0.65, 'Low': 0.40}
    resume_factor  = confidence_map.get(confidence, 0.65)

    # Assessment factor from MCQ answers
    assessment_factor = 0.5   # default to 50% if no assessment data
    wrong_skills: set[str] = set()
    if questions and answers:
        mcq_qs     = [q for q in questions if q.get('type') == 'mcq']
        correct_n  = sum(
            1 for q in mcq_qs
            if str(q['id']) in answers and answers[str(q['id'])] == q.get('correct_answer')
        )
        if mcq_qs:
            assessment_factor = correct_n / len(mcq_qs)
            wrong_skills = {
                q.get('expected_skill', '').lower()
                for q in mcq_qs
                if str(q['id']) in answers
                and answers[str(q['id'])] != q.get('correct_answer')
                and q.get('expected_skill')
            }
            logger.info(f'[CareerMatch] fallback | assessment={round(assessment_factor*100)}% | wrong_skills={wrong_skills}')

    global_factor = resume_factor * 0.6 + assessment_factor * 0.4

    result = []
    for title, base_score in careers:
        score = base_score + len(skills) * 0.5

        # Category penalty: required skills overlapping weak categories reduce score
        # (Title-based heuristic since fallback has no required_skills per-career)
        title_lower = title.lower()
        penalty = sum(8 for ws in wrong_skills if ws and ws in title_lower) if wrong_skills else 0
        penalty = min(penalty, 24)

        score = round(score * global_factor) - penalty
        score = max(35, min(97, score))

        result.append({
            'title': title,
            'match_score': score,
            'reason': (
                f'Based on your {field} profile with {len(skills)} detected skills. '
                f'Assessment performance: {round(assessment_factor * 100)}%.'
            ),
            'required_skills': skills[:3] if skills else [],
            'missing_skills':  list(wrong_skills)[:3],
            'learning_path': [
                f'1. Deepen core {field} fundamentals',
                '2. Build 2–3 real-world portfolio projects',
                '3. Earn a relevant industry certification',
            ],
        })

    result.sort(key=lambda x: x['match_score'], reverse=True)
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
        seed                = request.data.get('seed', None)

        used_fallback = False
        try:
            questions = self._generate_with_openai(
                primary_field, top_skills, education_extracted, confidence, experience, seed
            )
            if not questions:
                raise RuntimeError('OpenAI returned empty question list')
        except Exception as exc:
            if _is_quota_error(exc):
                logger.warning('[Assessment] OpenAI quota/rate-limit — using offline fallback')
            else:
                logger.error(f'[Assessment] OpenAI failed ({exc}) — using offline fallback')
            questions = _fallback_questions(primary_field, top_skills, confidence)
            # Shuffle fallback questions to add variety across runs
            import random as _rnd
            _rnd.seed(seed if seed else None)
            _rnd.shuffle(questions)
            used_fallback = True

        return Response({'questions': questions, 'used_fallback': used_fallback})

    # ------------------------------------------------------------------ #
    def _generate_with_openai(self, primary_field, top_skills,
                               education_extracted, confidence, experience, seed=None):
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
                f"- Difficulty: {difficulty}\n"
                f"- Variation seed: {seed} (use this to vary question selection, phrasing, and focus areas — never repeat identical questions across runs)\n\n"
                f"STRICT RULES:\n"
                f"- ALL questions MUST relate to {primary_field}\n"
                f"- Questions MUST test skills from: {skills_str}\n"
                f"- ALL 7 questions must be MCQ type only. No open-text, no behavioral, no situational.\n"
                f"- Every question must have exactly 4 options labeled A, B, C, D.\n"
                f"- Every question must have one correct_answer (single letter: A, B, C, or D).\n"
                f"- Vary wording, scenario, difficulty level, and specific skill focus across questions.\n\n"
                "Return ONLY this JSON (no extra text):\n"
                '{\n'
                '  "questions": [\n'
                '    {\n'
                '      "id": 1,\n'
                '      "question": "<specific question targeting a resume skill>",\n'
                '      "type": "mcq",\n'
                '      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],\n'
                '      "expected_skill": "<skill name from resume>",\n'
                '      "correct_answer": "A",\n'
                '      "explanation": "<why this answer is correct>"}\n'
                '  ]\n'
                '}'
            )

            response = client.chat.completions.create(
                model='gpt-4o-mini',
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user',   'content': user_prompt},
                ],
                temperature=0.8,
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
            career_matches = _fallback_career_matches(resume_analysis, questions, answers)
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
