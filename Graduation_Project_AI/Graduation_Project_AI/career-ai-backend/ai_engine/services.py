import json
import re
import spacy
from typing import List, Dict, Any, Tuple, Optional
import PyPDF2
from docx import Document
from datetime import datetime
import logging
from jobs.skills_data import COMPREHENSIVE_SKILLS_DATABASE, get_all_skill_names, get_skill_by_name, get_high_demand_skills

logger = logging.getLogger(__name__)

# Load spaCy model for NLP processing
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    logger.warning("spaCy model not found. Using basic text processing.")
    nlp = None


class AdvancedResumeProcessor:
    """Advanced AI-powered resume analysis service with comprehensive skills database"""
    
    def __init__(self):
        self.skills_database = self._load_comprehensive_skills_database()
        self.education_patterns = self._load_education_patterns()
        self.experience_patterns = self._load_experience_patterns()
    
    def _load_comprehensive_skills_database(self) -> Dict[str, Dict]:
        """Load comprehensive skills database with all metadata"""
        skills_dict = {}
        for skill in COMPREHENSIVE_SKILLS_DATABASE:
            skills_dict[skill['name'].lower()] = skill
            # Add synonyms as keys pointing to the same skill
            for synonym in skill['synonyms']:
                skills_dict[synonym.lower()] = skill
        return skills_dict
    
    def _load_education_patterns(self) -> List[Dict[str, str]]:
        """Load education degree patterns"""
        return [
            {'pattern': r'phd|ph\.d|doctorate', 'level': 'PhD'},
            {'pattern': r'master|ms|m\.s|mba|m\.ba', 'level': 'Masters'},
            {'pattern': r'bachelor|bs|b\.s|ba|b\.a|undergraduate', 'level': 'Bachelors'},
            {'pattern': r'associate|aa|a\.a', 'level': 'Associates'},
            {'pattern': r'certificate|cert|certification', 'level': 'Certificate'},
            {'pattern': r'diploma', 'level': 'Diploma'}
        ]
    
    def _load_experience_patterns(self) -> List[Dict[str, str]]:
        """Load experience extraction patterns"""
        return [
            {'pattern': r'(\d+)\+?\s*years?', 'type': 'total_years'},
            {'pattern': r'(\d+)\s*-\s*(\d+)\s*years?', 'type': 'range_years'},
            {'pattern': r'since\s*(\d{4})', 'type': 'since_year'},
            {'pattern': r'(\d{4})\s*-\s*(\d{4}|present)', 'type': 'date_range'}
        ]
    
    def analyze_resume(self, file_path: str, file_type: str) -> Dict[str, Any]:
        """Comprehensive resume analysis.

        OpenAI (if key present) is called ONCE and supplies:
          primary_field, confidence, education_extracted, top_skills, recommended_jobs.
        Keyword detection is the fallback when OpenAI is unavailable or fails.
        """
        start_time = datetime.now()

        try:
            text = self._extract_text(file_path, file_type)
            skills = self._extract_skills(text)

            # ── Primary classification path ───────────────────────────────
            ai_result = self._analyze_with_openai(text)

            if ai_result and 'recommended_jobs' in ai_result:
                primary_field      = ai_result.get('primary_field', 'Other')
                confidence         = ai_result.get('confidence', 'Low')
                education_extracted = ai_result.get('education_extracted', {})
                top_skills         = ai_result.get('top_skills', skills[:10])

                recommended_jobs = []
                for job in ai_result['recommended_jobs']:
                    try:
                        score = float(job.get('match_score', 70))
                    except (ValueError, TypeError):
                        score = 70.0
                    recommended_jobs.append({
                        'title':          job.get('title', ''),
                        'match_score':    round(min(score, 97.0), 1),
                        'matched_skills': job.get('matched_skills', []),
                        'missing_skills': job.get('missing_skills', []),
                        'reason':         job.get('reason', ''),
                        'primary_field':  primary_field,
                    })
                recommended_jobs.sort(key=lambda x: x['match_score'], reverse=True)
                career_suggestions = recommended_jobs[:8]

            else:
                # ── Fallback: keyword-based detection ────────────────────
                field_data          = self._detect_primary_field(text)
                primary_field       = field_data['primary_field']
                confidence          = field_data['confidence']
                education_extracted = {}
                top_skills          = skills[:10]
                career_suggestions  = self._get_field_specific_suggestions(primary_field, skills)
                recommended_jobs    = [
                    {
                        'title':          s.get('title', ''),
                        'match_score':    s.get('match_score', 0),
                        'matched_skills': s.get('matched_skills', []),
                        'missing_skills': s.get('missing_skills', []),
                        'reason':         s.get('reason', ''),
                    }
                    for s in career_suggestions
                ]

            analysis_result = {
                'extracted_text':     text,
                'primary_field':      primary_field,
                'confidence':         confidence,
                'education_extracted': education_extracted,
                'top_skills':         top_skills,
                'recommended_jobs':   recommended_jobs,
                'skills':             skills,
                'experience':         self._analyze_experience(text),
                'education':          self._analyze_education(text),
                'job_titles':         self._extract_job_titles(text),
                'companies':          self._extract_companies(text),
                'certifications':     self._extract_certifications(text),
                'languages':          self._extract_languages(text),
                'projects':           self._extract_projects(text),
                'skill_categories':   self._categorize_skills(text),
                'career_suggestions': career_suggestions,
                'confidence_score':   self._calculate_confidence_score(text),
                'processing_time':    (datetime.now() - start_time).total_seconds(),
            }

            return analysis_result

        except Exception as e:
            logger.error(f"Resume analysis failed: {str(e)}")
            raise Exception(f"Resume analysis failed: {str(e)}")
    
    def _extract_text(self, file_path: str, file_type: str) -> str:
        """Extract text from different file formats"""
        if file_type.lower() == 'pdf':
            return self._extract_text_from_pdf(file_path)
        elif file_type.lower() in ['docx', 'doc']:
            return self._extract_text_from_docx(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
    
    def _extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF using a 3-strategy fallback cascade.

        Strategy 1 — pdfplumber (handles complex fonts, tables, modern PDFs)
        Strategy 2 — PyPDF2 with strict=False (tolerant of minor structural errors)
        Strategy 3 — raw binary scrape (last resort for non-standard PDFs)
        """
        text = ""

        # ── Strategy 1: pdfplumber ──────────────────────────────────────────
        try:
            import pdfplumber
            with pdfplumber.open(file_path) as pdf:
                pages_text = []
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        pages_text.append(page_text)
                text = "\n".join(pages_text)
            if text.strip():
                logger.info("[PDF] Extracted with pdfplumber")
                return text
        except ImportError:
            logger.warning("[PDF] pdfplumber not installed, trying PyPDF2")
        except Exception as e:
            logger.warning(f"[PDF] pdfplumber failed ({e}), trying PyPDF2")

        # ── Strategy 2: PyPDF2 strict=False ────────────────────────────────
        try:
            with open(file_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f, strict=False)
                pages_text = []
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        pages_text.append(page_text)
                text = "\n".join(pages_text)
            if text.strip():
                logger.info("[PDF] Extracted with PyPDF2")
                return text
        except Exception as e:
            logger.warning(f"[PDF] PyPDF2 failed ({e}), trying raw binary scrape")

        # ── Strategy 3: raw binary text scrape ─────────────────────────────
        try:
            with open(file_path, 'rb') as f:
                raw = f.read()
            # Pull printable ASCII runs out of the binary content
            parts = re.findall(rb'[\x20-\x7E]{4,}', raw)
            text = " ".join(p.decode('ascii', errors='ignore') for p in parts)
            if text.strip():
                logger.info("[PDF] Extracted with raw binary scrape")
                return text
        except Exception as e:
            logger.warning(f"[PDF] Raw scrape also failed: {e}")

        if not text.strip():
            raise Exception(
                "Could not extract text from this PDF. "
                "The file may be a scanned image without a text layer, "
                "or it may be encrypted/password-protected."
            )
        return text
    
    def _extract_text_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        try:
            doc = Document(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text
        except Exception as e:
            raise Exception(f"Error reading DOCX file: {str(e)}")
    
    def _extract_skills(self, text: str) -> List[str]:
        """Extract skills using comprehensive database and advanced NLP"""
        found_skills = set()
        text_lower = text.lower()
        
        # Enhanced skill extraction using comprehensive database
        for skill_key, skill_data in self.skills_database.items():
            # Check for exact skill name matches
            if skill_key in text_lower:
                found_skills.add(skill_data['name'])
                continue
            
            # Check for skill with word boundaries to avoid partial matches
            skill_name = skill_data['name'].lower()
            # Create regex pattern with word boundaries
            pattern = r'\b' + re.escape(skill_name) + r'\b'
            if re.search(pattern, text_lower):
                found_skills.add(skill_data['name'])
                continue
            
            # Check for synonyms with word boundaries
            for synonym in skill_data['synonyms']:
                synonym_lower = synonym.lower()
                pattern = r'\b' + re.escape(synonym_lower) + r'\b'
                if re.search(pattern, text_lower):
                    found_skills.add(skill_data['name'])
                    break
        
        # Use spaCy for named entity recognition if available
        if nlp:
            doc = nlp(text)
            for ent in doc.ents:
                ent_text = ent.text.lower()
                # Check if entity matches any skills in our database
                if ent_text in self.skills_database:
                    found_skills.add(self.skills_database[ent_text]['name'])
                
                # Check for partial matches in multi-word entities
                for skill_key, skill_data in self.skills_database.items():
                    if skill_key in ent_text or ent_text in skill_key:
                        found_skills.add(skill_data['name'])
        
        # Advanced pattern matching for compound skills
        compound_patterns = [
            r'(machine\s+learning|deep\s+learning|artificial\s+intelligence)',
            r'(natural\s+language\s+processing|computer\s+vision)',
            r'(continuous\s+integration|continuous\s+deployment)',
            r'(user\s+interface|user\s+experience)',
            r'(business\s+intelligence|data\s+analysis)',
            r'(software\s+development|web\s+development)',
            r'(mobile\s+development|cloud\s+computing)',
            r'(database\s+administration|system\s+administration)',
            r'(project\s+management|product\s+management)',
            r'(quality\s+assurance|risk\s+management)',
        ]
        
        for pattern in compound_patterns:
            matches = re.findall(pattern, text_lower, re.IGNORECASE)
            for match in matches:
                skill_key = match.replace(' ', '_')
                if skill_key in self.skills_database:
                    found_skills.add(self.skills_database[skill_key]['name'])
        
        # Convert to list and sort by demand level and name
        skills_list = list(found_skills)
        skills_with_metadata = []
        
        for skill in skills_list:
            skill_data = self.skills_database.get(skill.lower())
            if skill_data:
                skills_with_metadata.append({
                    'name': skill,
                    'demand_level': skill_data.get('demand_level', 3),
                    'category': skill_data.get('category', 'unknown')
                })
        
        # Sort by demand level (highest first) then by name
        skills_with_metadata.sort(key=lambda x: (-x['demand_level'], x['name']))
        
        # Return just the skill names
        return [skill['name'] for skill in skills_with_metadata]
    
    def _categorize_skills(self, text: str) -> Dict[str, List[str]]:
        """Categorize extracted skills using comprehensive database"""
        categorized = {}
        text_lower = text.lower()
        
        # Extract skills first
        extracted_skills = self._extract_skills(text)
        
        # Categorize each extracted skill
        for skill_name in extracted_skills:
            skill_data = get_skill_by_name(skill_name)
            if skill_data:
                category = skill_data['category']
                if category not in categorized:
                    categorized[category] = []
                if skill_name not in categorized[category]:
                    categorized[category].append(skill_name)
        
        return categorized
    
    def _analyze_experience(self, text: str) -> Dict[str, Any]:
        """Analyze work experience using a 4-strategy cascade."""
        from datetime import datetime as _dt
        experience_data = {
            'total_years': None,
            'job_titles': [],
            'companies': [],
            'summary': ''
        }
        current_year = _dt.now().year

        # ── Strategy 1: explicit "X years of experience" ─────────────────
        explicit = re.findall(
            r'\b(\d{1,2})\+?\s*years?\s+of\s+(?:work\s+|professional\s+)?experience\b',
            text, re.IGNORECASE
        )
        if explicit:
            vals = [int(n) for n in explicit if 1 <= int(n) <= 50]
            if vals:
                experience_data['total_years'] = float(max(vals))
                return experience_data

        # ── Strategy 2: standalone "X years" (broadest explicit match) ───
        standalone = re.findall(r'\b(\d{1,2})\+?\s*years?\b', text, re.IGNORECASE)
        candidates = [int(n) for n in standalone if 1 <= int(n) <= 40]
        if candidates:
            experience_data['total_years'] = float(max(candidates))
            return experience_data

        # ── Strategy 3: calculate from date ranges ────────────────────────
        ranges = re.findall(
            r'\b(20\d{2}|19\d{2})\s*[-\u2013\u2014\/to]+\s*(20\d{2}|19\d{2}|present|current|now)\b',
            text, re.IGNORECASE
        )
        if ranges:
            intervals = []
            for start_str, end_str in ranges:
                try:
                    s = int(start_str)
                    e = current_year if end_str.lower() in ('present', 'current', 'now') else int(end_str)
                    if 1990 <= s <= current_year and s <= e <= current_year:
                        intervals.append((s, e))
                except ValueError:
                    continue
            if intervals:
                intervals.sort()
                merged = [list(intervals[0])]
                for s, e in intervals[1:]:
                    if s <= merged[-1][1]:
                        merged[-1][1] = max(merged[-1][1], e)
                    else:
                        merged.append([s, e])
                total = sum(e - s for s, e in merged)
                if total > 0:
                    experience_data['total_years'] = float(min(total, 50))
                    return experience_data

        # ── Strategy 4: "since YYYY" ──────────────────────────────────────
        since = re.findall(r'\bsince\s+(20\d{2}|19\d{2})\b', text, re.IGNORECASE)
        if since:
            try:
                earliest = min(int(y) for y in since)
                experience_data['total_years'] = float(current_year - earliest)
            except ValueError:
                pass

        return experience_data
    
    def _analyze_education(self, text: str) -> Dict[str, Any]:
        """Analyse education using word-boundary patterns.

        Previous bug: bare 'ms' matched inside common words like 'algorithms',
        'programs', 'problems', 'terms' → falsely reported Masters.
        Fix: use \\b word-boundary anchors for all abbreviations and collect
        ALL levels found, then return the highest one (not the first hit).
        """
        education_data = {
            'highest_level': None,
            'institutions': [],
            'degrees': [],
            'summary': ''
        }

        # Word-boundary-aware patterns — abbreviations are anchored with \b
        # so 'ms' no longer fires inside 'algorithms', 'programs', etc.
        level_checks = [
            (r'\b(?:ph\.?\s*d\.?|doctorate|doctoral)\b',                        'PhD'),
            (r'\b(?:master(?:s|\'s)?|m\.sc\.?|msc|m\.s\.?|m\.ba\.?|mba'
             r'|m\.eng\.?|meng|m\.tech\.?|mtech|magister)\b',                  'Masters'),
            (r'\b(?:bachelor(?:s|\'s)?|b\.sc\.?|bsc|b\.s\.?|b\.e\.?'
             r'|b\.eng\.?|beng|b\.tech\.?|btech|b\.a\.?|undergraduate'
             r'|licen[cs]iate?)\b',                                              'Bachelors'),
            (r'\b(?:associate(?:s|s\')?)\b',                                    'Associates'),
            (r'\b(?:certificate|certification)\b',                              'Certificate'),
            (r'\b(?:diploma)\b',                                                'Diploma'),
        ]
        level_rank = {
            'PhD': 5, 'Masters': 4, 'Bachelors': 3,
            'Associates': 2, 'Certificate': 1, 'Diploma': 1
        }

        found = []
        for pattern, level in level_checks:
            if re.search(pattern, text, re.IGNORECASE):
                found.append(level)

        if found:
            education_data['highest_level'] = max(found, key=lambda l: level_rank.get(l, 0))

        return education_data
    
    def _extract_job_titles(self, text: str) -> List[str]:
        """Extract job titles using NLP"""
        job_titles = []
        
        # Common job title patterns
        job_patterns = [
            r'(senior|junior|lead|principal|staff)?\s*(software|web|mobile|data|machine\slearning|devops)\s*(engineer|developer|architect|scientist|analyst)',
            r'(product|project|program)\s*manager',
            r'(ui|ux|frontend|backend|full\sstack)\s*(designer|developer)',
            r'(data|business)\s*analyst',
            r'(technical)\s*(lead|manager)',
            r'(chief|head|vp)\s*(technology|engineering|technical)'
        ]
        
        for pattern in job_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    job_title = ' '.join(filter(None, match))
                else:
                    job_title = match
                job_titles.append(job_title.title())
        
        return list(set(job_titles))
    
    def _extract_companies(self, text: str) -> List[str]:
        """Extract company names"""
        companies = []
        
        # Use spaCy for organization extraction if available
        if nlp:
            doc = nlp(text)
            for ent in doc.ents:
                if ent.label_ == 'ORG' and len(ent.text.split()) <= 3:
                    companies.append(ent.text)
        
        return list(set(companies))
    
    def _extract_certifications(self, text: str) -> List[str]:
        """Extract certifications"""
        cert_patterns = [
            r'(aws|azure|gcp)\s*(certified|certification)',
            r'(pmp|csm|csd|cspo)',
            r'(oracle|java|python)\s*(certified|certification)',
            r'(google|facebook|microsoft)\s*(certified|certification)',
            r'(ccna|ccnp|mcse|rhce)'
        ]
        
        certifications = []
        for pattern in cert_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    cert = ' '.join(match)
                else:
                    cert = match
                certifications.append(cert.upper())
        
        return list(set(certifications))
    
    def _extract_languages(self, text: str) -> List[str]:
        """Extract languages known"""
        languages = []
        common_languages = [
            'english', 'spanish', 'french', 'german', 'chinese', 'japanese',
            'korean', 'portuguese', 'russian', 'arabic', 'hindi', 'italian'
        ]
        
        text_lower = text.lower()
        for lang in common_languages:
            if lang in text_lower:
                languages.append(lang.title())
        
        return languages
    
    def _extract_projects(self, text: str) -> List[Dict[str, str]]:
        """Extract project information"""
        projects = []
        
        # Simple project extraction patterns
        project_patterns = [
            r'project[:\s]+([^.]+)',
            r'developed\s+([^.]+)',
            r'built\s+([^.]+)',
            r'created\s+([^.]+)'
        ]
        
        for pattern in project_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                projects.append({
                    'name': match.strip(),
                    'description': ''
                })
        
        return projects[:10]  # Limit to 10 projects
    
    def _detect_primary_field(self, text: str) -> Dict[str, Any]:
        """Detect primary professional field.

        Strategy (applied in order):
        1. Degree regex patterns  → immediate High-confidence winner
        2. Field-exclusive keyword scoring (only keywords that cannot appear in other fields)
        """
        text_lower = text.lower()

        # ── STEP 1: Degree detection (highest authority) ──────────────────────────
        # Regex patterns that unambiguously indicate a specific degree field.
        # Python / MATLAB / Git found alongside these degrees must NOT change the result.
        degree_patterns: List[tuple] = [
            ('Electrical Engineering', [
                r'b\.?s\.?\s+electrical',
                r'b\.?e\.?\s+electrical',
                r'bachelor.{0,30}electrical engineering',
                r'electrical engineering.{0,30}(degree|graduate|student|major|department)',
                r'electronics engineering',
                r'electronics\s+and\s+(communication|electrical)',
                r'electrical\s+and\s+electronics',
                r'electrical\s+power',
                r'power\s+engineering',
            ]),
            ('Mechanical Engineering', [
                r'b\.?s\.?\s+mechanical',
                r'b\.?e\.?\s+mechanical',
                r'bachelor.{0,30}mechanical engineering',
                r'mechanical engineering.{0,30}(degree|graduate|student|major|department)',
                r'mechatronics engineering',
            ]),
            ('Civil Engineering', [
                r'b\.?s\.?\s+civil',
                r'b\.?e\.?\s+civil',
                r'bachelor.{0,30}civil engineering',
                r'civil engineering.{0,30}(degree|graduate|student|major|department)',
                r'structural engineering',
                r'construction engineering',
            ]),
            ('Computer Engineering', [
                r'b\.?s\.?\s+computer engineering',
                r'b\.?e\.?\s+computer engineering',
                r'bachelor.{0,30}computer engineering',
                r'computer engineering.{0,30}(degree|graduate|student|major|department)',
            ]),
            ('Industrial Engineering', [
                r'b\.?s\.?\s+industrial',
                r'b\.?e\.?\s+industrial',
                r'bachelor.{0,30}industrial engineering',
                r'industrial engineering.{0,30}(degree|graduate|student|major|department)',
                r'manufacturing engineering',
            ]),
            ('Data Science', [
                r'b\.?s\.?\s+(data science|statistics)',
                r'bachelor.{0,30}(data science|statistics)',
                r'(data science|statistics).{0,30}(degree|graduate|student|major)',
                r'computational science',
            ]),
            ('Software Engineering', [
                r'b\.?s\.?\s+(software engineering|computer science)',
                r'b\.?e\.?\s+software',
                r'bachelor.{0,30}(software engineering|computer science)',
                r'(software engineering|computer science).{0,30}(degree|graduate|student|major|department)',
                r'information technology.{0,30}(degree|graduate|student|major)',
                r'information systems.{0,30}(degree|graduate|student|major)',
            ]),
            ('Business', [
                r'\bb\.?b\.?a\.?\b',
                r'\bmba\b',
                r'master.{0,20}business administration',
                r'bachelor.{0,30}(business|commerce)',
                r'(business administration|commerce).{0,30}(degree|graduate|student|major)',
            ]),
            ('Healthcare', [
                r'\bmbbs\b',
                r'\bm\.?d\.?\b',
                r'bachelor.{0,30}(medicine|nursing|pharmacy)',
                r'medical degree',
                r'doctor of medicine',
            ]),
        ]

        for field, patterns in degree_patterns:
            for pattern in patterns:
                if re.search(pattern, text_lower):
                    logger.info(f"[FieldDetect] Degree match → {field} (pattern: {pattern})")
                    return {'primary_field': field, 'confidence': 'High', 'all_scores': {field: 100}}

        # ── STEP 2: Field-exclusive keyword scoring ───────────────────────────────
        # ONLY include keywords that are genuinely unique to one field.
        # Generic terms (python, git, agile, java, matlab, sql) are intentionally excluded.
        exclusive_keywords: Dict[str, List[str]] = {
            'Mechanical Engineering': [
                'solidworks', 'ansys', 'thermodynamics', 'fluid mechanics', 'hvac',
                'machine design', 'heat transfer', 'statics and dynamics', 'cnc machining',
                'turbine design', 'combustion', 'casting', 'welding design', 'fatigue analysis',
                'vibration analysis', 'finite element analysis', 'mechanical design',
            ],
            'Electrical Engineering': [
                'power systems', 'high voltage', 'plc programming', 'scada system', 'simulink',
                'power electronics', 'motor control', 'transformer design', 'pcb design',
                'circuit design', 'switchgear', 'protection relay', 'inverter', 'rectifier',
                'electromagnetic', 'power distribution', 'electrical installation',
            ],
            'Computer Engineering': [
                'vhdl', 'verilog', 'fpga', 'microcontroller', 'embedded systems',
                'firmware', 'rtos', 'computer architecture', 'rtl design',
                'digital circuit', 'processor design', 'hardware description language',
            ],
            'Civil Engineering': [
                'structural analysis', 'reinforced concrete', 'soil mechanics', 'geotechnical',
                'revit', 'staad', 'etabs', 'hydrology', 'bridge design',
                'pile foundation', 'road design', 'quantity surveying', 'bill of quantities',
            ],
            'Industrial Engineering': [
                'lean manufacturing', 'six sigma', 'operations research', 'supply chain',
                'production planning', 'time and motion study', 'plant layout', 'kaizen',
                'inventory management', 'value stream mapping', 'process optimization',
            ],
            'Data Science': [
                'machine learning', 'deep learning', 'neural network', 'tensorflow', 'pytorch',
                'natural language processing', 'computer vision', 'data mining',
                'feature engineering', 'model training', 'predictive modeling',
                'regression model', 'clustering algorithm', 'data pipeline',
            ],
            'Software Engineering': [
                'web development', 'react', 'angular', 'vue.js', 'node.js', 'django framework',
                'spring boot', 'rest api', 'full stack development', 'frontend development',
                'backend development', 'microservices architecture', 'devops pipeline',
                'mobile app development', 'android development', 'ios development',
                'software architecture', 'api development',
            ],
            'Business': [
                'financial modeling', 'market research', 'business strategy', 'investment banking',
                'business development', 'sales management', 'marketing strategy',
                'customer relationship management', 'financial reporting',
            ],
            'Healthcare': [
                'patient care', 'clinical trials', 'medical diagnosis', 'pharmacology',
                'surgical', 'public health', 'epidemiology', 'hospital administration',
            ],
        }

        scores: Dict[str, int] = {
            field: sum(3 for kw in kws if kw in text_lower)
            for field, kws in exclusive_keywords.items()
        }

        best_field = max(scores, key=lambda f: scores[f]) if scores else 'Other'
        best_score = scores.get(best_field, 0)

        if best_score == 0:
            best_field = 'Other'
            confidence = 'Low'
        elif best_score < 4:
            confidence = 'Low'
        elif best_score < 10:
            confidence = 'Medium'
        else:
            confidence = 'High'

        logger.info(f"[FieldDetect] Keyword scores: {scores} → {best_field} ({confidence})")
        return {'primary_field': best_field, 'confidence': confidence, 'all_scores': scores}

    def _analyze_with_openai(self, text: str) -> 'Optional[Dict]':
        """Strict ATS-style resume analysis via OpenAI (gpt-4o-mini).

        Returns a dict with keys:
          primary_field, confidence, education_extracted, top_skills, recommended_jobs
        Returns None if OPENAI_API_KEY is missing or the call fails
        (caller falls back to keyword detection).
        """
        import os
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            return None
        try:
            import openai  # type: ignore
            client = openai.OpenAI(api_key=api_key)

            system_prompt = (
                "You are a highly accurate Resume Analysis AI used in a professional ATS "
                "(Applicant Tracking System).\n\n"
                "Your job is to extract structured information from a resume and determine "
                "the candidate's PRIMARY FIELD and career direction.\n\n"
                "You must be STRICT, CONSERVATIVE, and EVIDENCE-BASED.\n"
                "Do NOT guess. If information is unclear, mark it as uncertain.\n\n"
                "CORE PRINCIPLE:\n"
                "Rely only on verified evidence from the resume text.\n"
                "If education is unclear, incomplete, or noisy → set field to 'Uncertain' "
                "and lower confidence. Do NOT assume a field from noisy data.\n\n"
                "EDUCATION EXTRACTION RULES:\n"
                "- Extract ONLY explicit degree titles (Bachelor, Master, PhD, Diploma).\n"
                "- Extract ONLY explicitly stated fields of study.\n"
                "- Do NOT infer a degree from course lists or certificates.\n"
                "- If multiple entries exist, pick the highest valid degree.\n"
                "- If degree or field is missing/ambiguous → use 'Unknown' / 'Uncertain'.\n\n"
                "FIELD CLASSIFICATION RULES:\n"
                "1. Clear degree in the resume → strongest signal (high weight).\n"
                "2. Unclear degree → fall back to long-term job experience only.\n"
                "3. Internships alone are NOT enough to change the detected field.\n"
                "4. Python, Java, Git, MATLAB, SQL are cross-field tools — NOT decisive signals.\n"
                "5. NEVER override a clearly stated degree without strong contradicting experience.\n\n"
                "VALID PRIMARY FIELDS (choose exactly one):\n"
                "Computer Engineering | Electrical Engineering | Mechanical Engineering | "
                "Civil Engineering | Industrial Engineering | Other\n\n"
                "CONFIDENCE RULES:\n"
                "High   → Clear degree + consistent multi-year experience in that field.\n"
                "Medium → Partial/noisy education but strong supporting job experience.\n"
                "Low    → Missing or unclear education with weak or conflicting signals.\n\n"
                "FORBIDDEN:\n"
                "- Do NOT guess education fields.\n"
                "- Do NOT infer degree from skills.\n"
                "- Do NOT assume Computer Engineering because Python exists.\n"
                "- Do NOT hallucinate missing education details.\n"
                "- Do NOT output anything outside JSON."
            )

            user_prompt = (
                f"Analyze this resume text and return ONLY valid JSON:\n\n{text[:12000]}\n\n"
                "Required JSON (no markdown, no extra text):\n"
                "{\n"
                '  "primary_field": "<Computer Engineering|Electrical Engineering|'
                'Mechanical Engineering|Civil Engineering|Industrial Engineering|Other>",\n'
                '  "confidence": "High|Medium|Low",\n'
                '  "education_extracted": {\n'
                '    "degree": "<Bachelor|Master|PhD|Diploma|Unknown>",\n'
                '    "field": "<field of study or Uncertain>",\n'
                '    "university": "<university name or Unknown>",\n'
                '    "status": "<Graduated|In Progress|Unknown>"\n'
                '  },\n'
                '  "top_skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],\n'
                '  "recommended_jobs": [\n'
                '    {"title": "<job>", "match_score": <50-97>, '
                '"matched_skills": ["s1"], "missing_skills": ["s2"]},\n'
                '    {"title": "<job>", "match_score": <50-97>, '
                '"matched_skills": ["s1"], "missing_skills": ["s2"]},\n'
                '    {"title": "<job>", "match_score": <50-97>, '
                '"matched_skills": ["s1"], "missing_skills": ["s2"]}\n'
                "  ]\n}"
                "\n\nRULE: recommended_jobs MUST only contain roles aligned with the primary_field."
            )

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user",   "content": user_prompt},
                ],
                temperature=0.0,   # maximum conservatism
                max_tokens=1500,
            )
            result_text = response.choices[0].message.content.strip()

            # Strip markdown code fences if GPT wraps the JSON
            if result_text.startswith('```'):
                result_text = re.sub(r'^```[a-zA-Z]*\n?', '', result_text)
                result_text = re.sub(r'\n?```$', '', result_text).strip()

            parsed = json.loads(result_text)
            edu = parsed.get('education_extracted', {})
            logger.info(
                f"[OpenAI] field={parsed.get('primary_field')} "
                f"confidence={parsed.get('confidence')} "
                f"edu_field={edu.get('field', 'N/A')} "
                f"edu_degree={edu.get('degree', 'N/A')}"
            )
            return parsed
        except Exception as e:
            logger.warning(f"OpenAI analysis failed, falling back to keyword detection: {str(e)}")
            return None

    def _get_field_specific_suggestions(self, primary_field: str, skills: List[str]) -> List[Dict[str, Any]]:
        """Return job suggestions that belong strictly to the detected primary field."""
        field_job_mappings: Dict[str, List[Dict]] = {
            'Mechanical Engineering': [
                {'title': 'Mechanical Design Engineer', 'required': ['AutoCAD', 'SolidWorks', 'CAD', 'Machine Design']},
                {'title': 'Manufacturing Engineer', 'required': ['Manufacturing', 'CNC', 'Lean Manufacturing', 'Quality Control']},
                {'title': 'HVAC Engineer', 'required': ['HVAC', 'Thermodynamics', 'Fluid Mechanics']},
                {'title': 'Automotive Engineer', 'required': ['Dynamics', 'Materials Science', 'Automotive']},
                {'title': 'Maintenance Engineer', 'required': ['Maintenance', 'Machine Design', 'Reliability Engineering']},
                {'title': 'Thermal Engineer', 'required': ['Heat Transfer', 'Thermodynamics', 'ANSYS']},
            ],
            'Computer Engineering': [
                {'title': 'Embedded Systems Engineer', 'required': ['Embedded Systems', 'Microcontroller', 'Firmware']},
                {'title': 'FPGA Engineer', 'required': ['FPGA', 'VHDL', 'Verilog']},
                {'title': 'Hardware Design Engineer', 'required': ['Digital Circuits', 'PCB', 'Computer Architecture']},
                {'title': 'IoT Engineer', 'required': ['Embedded Systems', 'Microcontroller', 'Firmware']},
                {'title': 'Systems Engineer', 'required': ['Real-Time Systems', 'Computer Architecture', 'Firmware']},
            ],
            'Electrical Engineering': [
                {'title': 'Power Systems Engineer', 'required': ['Power Systems', 'High Voltage', 'Transformer']},
                {'title': 'Control Systems Engineer', 'required': ['Control Systems', 'PLC', 'SCADA', 'MATLAB']},
                {'title': 'Electronics Engineer', 'required': ['PCB', 'Circuit Design', 'Signal Processing']},
                {'title': 'Instrumentation Engineer', 'required': ['SCADA', 'PLC', 'Signal Processing']},
                {'title': 'Electrical Design Engineer', 'required': ['AutoCAD', 'Power Electronics', 'Circuit Design']},
            ],
            'Civil Engineering': [
                {'title': 'Structural Engineer', 'required': ['Structural Analysis', 'Concrete', 'Reinforcement']},
                {'title': 'Construction Manager', 'required': ['Construction Management', 'Project Management']},
                {'title': 'Geotechnical Engineer', 'required': ['Geotechnical', 'Soil Mechanics', 'Foundation']},
                {'title': 'Transportation Engineer', 'required': ['Transportation Engineering', 'AutoCAD', 'Surveying']},
                {'title': 'Site Engineer', 'required': ['Construction Management', 'Surveying', 'Concrete']},
            ],
            'Industrial Engineering': [
                {'title': 'Industrial Engineer', 'required': ['Operations Research', 'Lean Manufacturing', 'Six Sigma']},
                {'title': 'Supply Chain Analyst', 'required': ['Supply Chain', 'Logistics', 'Inventory Management']},
                {'title': 'Quality Engineer', 'required': ['Quality Control', 'Six Sigma', 'Lean Manufacturing']},
                {'title': 'Production Planner', 'required': ['Production Planning', 'ERP', 'Scheduling']},
                {'title': 'Logistics Manager', 'required': ['Logistics', 'Supply Chain', 'Warehouse']},
            ],
            'Data Science': [
                {'title': 'Data Scientist', 'required': ['Python', 'Machine Learning', 'Data Science', 'Statistics']},
                {'title': 'Machine Learning Engineer', 'required': ['TensorFlow', 'PyTorch', 'Machine Learning', 'Python']},
                {'title': 'Data Analyst', 'required': ['Data Analysis', 'SQL', 'Python', 'Statistics']},
                {'title': 'AI Research Scientist', 'required': ['Deep Learning', 'Neural Network', 'Python', 'Research']},
                {'title': 'NLP Engineer', 'required': ['Natural Language Processing', 'Python', 'TensorFlow']},
            ],
            'Software Engineering': [
                {'title': 'Software Engineer', 'required': ['Python', 'Java', 'JavaScript', 'Git']},
                {'title': 'Full Stack Developer', 'required': ['React', 'Node.js', 'SQL', 'JavaScript']},
                {'title': 'Backend Developer', 'required': ['Python', 'Django', 'REST API', 'SQL']},
                {'title': 'Frontend Developer', 'required': ['React', 'JavaScript', 'HTML', 'CSS']},
                {'title': 'DevOps Engineer', 'required': ['Docker', 'Kubernetes', 'CI/CD', 'Linux']},
                {'title': 'Mobile Developer', 'required': ['Android', 'iOS', 'React Native', 'Flutter']},
            ],
            'Business': [
                {'title': 'Business Analyst', 'required': ['Business Analysis', 'Data Analysis', 'SQL']},
                {'title': 'Financial Analyst', 'required': ['Financial Analysis', 'Accounting', 'Economics']},
                {'title': 'Marketing Manager', 'required': ['Marketing', 'Strategy', 'Sales']},
                {'title': 'Management Consultant', 'required': ['Management', 'Strategy', 'Business Administration']},
                {'title': 'Operations Manager', 'required': ['Management', 'Operations Research', 'ERP']},
            ],
            'Healthcare': [
                {'title': 'Clinical Research Associate', 'required': ['Clinical', 'Research', 'Medical']},
                {'title': 'Healthcare Data Analyst', 'required': ['Data Analysis', 'Healthcare', 'Public Health']},
                {'title': 'Biomedical Engineer', 'required': ['Biomedical', 'Medical', 'Clinical']},
                {'title': 'Public Health Specialist', 'required': ['Public Health', 'Epidemiology', 'Healthcare']},
            ],
            'Other': [
                {'title': 'General Engineer', 'required': []},
                {'title': 'Technical Consultant', 'required': []},
            ],
        }

        jobs = field_job_mappings.get(primary_field, field_job_mappings['Other'])
        suggestions = []
        skills_lower = [s.lower() for s in skills]

        for job in jobs:
            required = job['required']
            matched = [r for r in required if any(r.lower() in sl for sl in skills_lower)]
            missing = [r for r in required if not any(r.lower() in sl for sl in skills_lower)]
            if required:
                score = round((len(matched) / len(required)) * 75 + 20, 1)
            else:
                score = 50.0
            suggestions.append({
                'title': job['title'],
                'match_score': min(score, 97.0),
                'matched_skills': matched,
                'missing_skills': missing,
                'primary_field': primary_field,
            })

        suggestions.sort(key=lambda x: x['match_score'], reverse=True)
        return suggestions[:8]

    def _generate_career_suggestions(self, text: str) -> List[Dict[str, Any]]:
        """Generate field-aware career suggestions.

        Priority order:
        1. OpenAI GPT analysis (if OPENAI_API_KEY is set)
        2. Keyword-based primary field detection + field-specific job table
        """
        # --- Attempt 1: OpenAI smart analysis ---
        # NOTE: analyze_resume() calls _analyze_with_openai() directly and bypasses
        # this method when OpenAI succeeds.  This fallback path is only reached
        # when _generate_career_suggestions is called in isolation.
        ai_result = self._analyze_with_openai(text)
        if ai_result and 'recommended_jobs' in ai_result:
            primary_field = ai_result.get('primary_field', 'Other')
            top_skills    = ai_result.get('top_skills', [])
            suggestions   = []
            for job in ai_result['recommended_jobs']:
                try:
                    score = float(job.get('match_score', 70))
                except (ValueError, TypeError):
                    score = 70.0
                suggestions.append({
                    'title':          job.get('title', ''),
                    'match_score':    round(min(score, 97.0), 1),
                    'matched_skills': job.get('matched_skills', top_skills[:3]),
                    'missing_skills': job.get('missing_skills', []),
                    'reason':         job.get('reason', ''),
                    'primary_field':  primary_field,
                })
            suggestions.sort(key=lambda x: x['match_score'], reverse=True)
            return suggestions[:8]

        # --- Attempt 2: Keyword-based field detection + field-specific jobs ---
        skills = self._extract_skills(text)
        field_result = self._detect_primary_field(text)
        primary_field = field_result['primary_field']
        logger.info(f"Detected primary field: {primary_field} (confidence: {field_result['confidence']})")
        return self._get_field_specific_suggestions(primary_field, skills)
    
    def _calculate_confidence_score(self, text: str) -> float:
        """Calculate confidence score for the analysis"""
        score = 0.0
        
        # Check for resume sections
        sections = ['experience', 'education', 'skills', 'projects', 'summary']
        for section in sections:
            if section in text.lower():
                score += 0.2
        
        # Check for contact information
        if re.search(r'\b\d{10}\b', text):  # Phone number
            score += 0.1
        if re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text):  # Email
            score += 0.1
        
        # Check for length (should be substantial)
        if len(text) > 500:
            score += 0.2
        
        return min(score, 1.0)


# Keep the original ResumeProcessor for backward compatibility
class ResumeProcessor(AdvancedResumeProcessor):
    """Service for processing resume files and extracting skills"""
    
    @staticmethod
    def extract_text_from_pdf(file_path: str) -> str:
        """Extract text from PDF file"""
        processor = AdvancedResumeProcessor()
        return processor._extract_text_from_pdf(file_path)

    @staticmethod
    def extract_text_from_docx(file_path: str) -> str:
        """Extract text from DOCX file"""
        processor = AdvancedResumeProcessor()
        return processor._extract_text_from_docx(file_path)

    @staticmethod
    def extract_skills(text: str) -> List[str]:
        """Extract skills from resume text using keyword matching"""
        processor = AdvancedResumeProcessor()
        return processor._extract_skills(text)
        
        # Common soft skills
        soft_skills = [
            'leadership', 'communication', 'teamwork', 'problem solving', 'critical thinking',
            'creativity', 'adaptability', 'time management', 'project management',
            'analytical skills', 'attention to detail', 'multitasking', 'decision making',
            'negotiation', 'presentation skills', 'interpersonal skills', 'collaboration'
        ]
        
        all_skills = tech_skills + soft_skills
        
        # Convert text to lowercase for case-insensitive matching
        text_lower = text.lower()
        
        # Find skills in text
        found_skills = []
        for skill in all_skills:
            # Use word boundaries to avoid partial matches
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, text_lower):
                found_skills.append(skill.title())
        
        return list(set(found_skills))  # Remove duplicates


class CareerRecommendationEngine:
    """Service for generating career recommendations based on user profile"""
    
    @staticmethod
    def analyze_skills_and_answers(skills: List[str], answers: List[Dict]) -> Dict[str, float]:
        """Analyze user skills and questionnaire answers to generate career scores"""
        
        # Career categories with required skills and interests
        career_profiles = {
            'Software Developer': {
                'skills': ['Python', 'Java', 'JavaScript', 'React', 'Node.js'],
                'interests': ['technology', 'problem solving', 'programming'],
                'weight': 0.3
            },
            'Data Scientist': {
                'skills': ['Python', 'R', 'Machine Learning', 'Data Science', 'SQL'],
                'interests': ['data analysis', 'statistics', 'research'],
                'weight': 0.3
            },
            'DevOps Engineer': {
                'skills': ['Docker', 'Kubernetes', 'AWS', 'Linux', 'CI/CD'],
                'interests': ['automation', 'infrastructure', 'technology'],
                'weight': 0.25
            },
            'Product Manager': {
                'skills': ['Project Management', 'Communication', 'Leadership'],
                'interests': ['strategy', 'collaboration', 'business'],
                'weight': 0.2
            },
            'UX Designer': {
                'skills': ['Creativity', 'Communication', 'Problem Solving'],
                'interests': ['design', 'user experience', 'technology'],
                'weight': 0.2
            },
            'Business Analyst': {
                'skills': ['Analytical Skills', 'SQL', 'Communication'],
                'interests': ['business analysis', 'data', 'problem solving'],
                'weight': 0.2
            },
            'Machine Learning Engineer': {
                'skills': ['Python', 'TensorFlow', 'PyTorch', 'Machine Learning'],
                'interests': ['artificial intelligence', 'research', 'technology'],
                'weight': 0.25
            },
            'Full Stack Developer': {
                'skills': ['JavaScript', 'React', 'Node.js', 'SQL', 'Django'],
                'interests': ['programming', 'technology', 'web development'],
                'weight': 0.3
            }
        }
        
        career_scores = {}
        
        for career, profile in career_profiles.items():
            score = 0
            
            # Skills matching (60% of score)
            skill_matches = 0
            for skill in profile['skills']:
                if any(skill.lower() in user_skill.lower() for user_skill in skills):
                    skill_matches += 1
            
            skill_score = (skill_matches / len(profile['skills'])) * 60
            score += skill_score
            
            # Interest matching from questionnaire (40% of score)
            interest_score = 40  # Base score
            # This is simplified - in real implementation, would analyze actual questionnaire answers
            score += interest_score
            
            # Apply career weight
            final_score = score * profile['weight']
            career_scores[career] = min(final_score, 100)  # Cap at 100
        
        return career_scores
    
    @staticmethod
    def generate_recommendations(user_skills: List[str], questionnaire_answers: List[Dict]) -> List[Dict]:
        """Generate career recommendations with scores and reasoning"""
        
        # Get career scores
        career_scores = CareerRecommendationEngine.analyze_skills_and_answers(
            user_skills, questionnaire_answers
        )
        
        # Sort careers by score
        sorted_careers = sorted(career_scores.items(), key=lambda x: x[1], reverse=True)
        
        # Generate recommendations
        recommendations = []
        for career, score in sorted_careers[:5]:  # Top 5 recommendations
            reasoning = f"Based on your skills in {', '.join(user_skills[:3])} and interests, " \
                       f"{career} is a strong match with a compatibility score of {score:.1f}%."
            
            recommendations.append({
                'career_name': career,
                'score': round(score, 1),
                'reasoning': reasoning
            })
        
        return recommendations
