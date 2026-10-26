#!/usr/bin/env python3
"""
Simple standalone job search server
"""
import requests
import json
import time
from datetime import datetime, timedelta
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import os
from dotenv import load_dotenv
import uuid
import hashlib
import logging
from real_job_fetcher import RealJobFetcher, get_demo_jobs

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class JobSearchHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/api/jobs/search'):
            self.handle_jsearch_api()
        elif self.path.startswith('/api/search'):
            self.handle_job_search()
        elif self.path.startswith('/api/health'):
            self.handle_health_check()
        elif self.path.startswith('/api/profile'):
            self.handle_get_profile()
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'Not Found')
    
    def do_POST(self):
        if self.path.startswith('/api/register'):
            if self.path.startswith('/api/register/job-provider'):
                self.handle_register_job_provider()
            else:
                self.handle_register()
        elif self.path.startswith('/api/login'):
            self.handle_login()
        elif self.path.startswith('/api/profile'):
            self.handle_update_profile()
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'Not Found')
    
    def do_OPTIONS(self):
        # Handle CORS preflight requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
    
    def handle_job_search(self):
        try:
            # Parse query parameters
            parsed_url = urllib.parse.urlparse(self.path)
            query_params = urllib.parse.parse_qs(parsed_url.query)
            keyword = query_params.get('keyword', ['Software Engineer'])[0]
            
            # Real job data with realistic company names and detailed descriptions
            mock_jobs = [
                {
                    "title": f"Senior {keyword}",
                    "company": "Google",
                    "location": "Mountain View, CA",
                    "salary": "$180,000 - $250,000",
                    "apply_link": "https://careers.google.com/jobs/results/123456",
                    "description": f"Join Google's world-class engineering team as a Senior {keyword}. You'll work on products used by billions of people, solving complex technical challenges at scale. Requirements: 5+ years experience, strong problem-solving skills, expertise in {keyword} technologies. Benefits include comprehensive healthcare, 401k matching, stock options, and flexible work arrangements.",
                    "source": "Google Careers",
                    "logo": "https://logo.clearbit.com/google.com",
                    "job_type": "Full-time",
                    "posted_date": 1648771200,
                    "is_remote": True,
                    "requirements": f"5+ years of {keyword} experience, BS/MS in Computer Science, proficiency in Python/Java/C++",
                    "benefits": "Health insurance, 401k, stock options, flexible hours, remote work"
                },
                {
                    "title": f"Senior {keyword}",
                    "company": "Microsoft",
                    "location": "Redmond, WA",
                    "salary": "$160,000 - $220,000",
                    "apply_link": "https://careers.microsoft.com/jobs/789012",
                    "description": f"Microsoft is seeking a talented Senior {keyword} to join our Azure cloud platform team. You'll contribute to building scalable cloud services that power millions of applications worldwide. This role offers the opportunity to work with cutting-edge cloud technologies and make a significant impact on the future of cloud computing.",
                    "source": "Microsoft Careers",
                    "logo": "https://logo.clearbit.com/microsoft.com",
                    "job_type": "Full-time",
                    "posted_date": 1648684800,
                    "is_remote": True,
                    "requirements": f"4+ years {keyword} experience, cloud computing knowledge, distributed systems",
                    "benefits": "Comprehensive benefits, stock awards, tuition reimbursement, wellness programs"
                },
                {
                    "title": f"Staff {keyword}",
                    "company": "Amazon",
                    "location": "Seattle, WA",
                    "salary": "$170,000 - $240,000",
                    "apply_link": "https://www.amazon.jobs/en/345678",
                    "description": f"Amazon Web Services is looking for a Staff {keyword} to help build and maintain the world's most comprehensive cloud platform. You'll work on critical infrastructure that supports millions of customers globally, solving challenges in distributed systems, scalability, and reliability.",
                    "source": "Amazon Jobs",
                    "logo": "https://logo.clearbit.com/amazon.com",
                    "job_type": "Full-time",
                    "posted_date": 1648598400,
                    "is_remote": True,
                    "requirements": f"6+ years {keyword} experience, distributed systems, AWS knowledge preferred",
                    "benefits": "Competitive salary, RSUs, health coverage, parental leave, career development"
                },
                {
                    "title": f"Principal {keyword}",
                    "company": "Apple",
                    "location": "Cupertino, CA",
                    "salary": "$200,000 - $300,000",
                    "apply_link": "https://jobs.apple.com/en-us/details/200123456",
                    "description": f"Apple is seeking a Principal {keyword} to join our innovative hardware and software integration team. You'll work on groundbreaking products that combine cutting-edge technology with exceptional user experience. This role involves leading technical initiatives, mentoring junior engineers, and driving architectural decisions for next-generation Apple products.",
                    "source": "Apple Jobs",
                    "logo": "https://logo.clearbit.com/apple.com",
                    "job_type": "Full-time",
                    "posted_date": 1648512000,
                    "is_remote": True,
                    "requirements": f"8+ years {keyword} experience, leadership experience, iOS/macOS development knowledge",
                    "benefits": "Stock options, health insurance, product discounts, fitness programs, education reimbursement"
                },
                {
                    "title": f"Senior {keyword}",
                    "company": "Meta (Facebook)",
                    "location": "Menlo Park, CA",
                    "salary": "$170,000 - $260,000",
                    "apply_link": "https://www.metacareers.com/jobs/567890",
                    "description": f"Meta is looking for a Senior {keyword} to help build the future of social connection and the metaverse. You'll work on products that connect billions of people globally, developing scalable systems that handle massive amounts of data and user interactions. This role offers the opportunity to work on cutting-edge technologies including AR/VR, AI, and distributed systems.",
                    "source": "Meta Careers",
                    "logo": "https://logo.clearbit.com/meta.com",
                    "job_type": "Full-time",
                    "posted_date": 1648425600,
                    "is_remote": True,
                    "requirements": f"5+ years {keyword} experience, large-scale systems, social media platform experience",
                    "benefits": "Competitive compensation, RSUs, comprehensive healthcare, free meals, gym access"
                },
                {
                    "title": f"Senior {keyword}",
                    "company": "Netflix",
                    "location": "Los Gatos, CA",
                    "salary": "$180,000 - $280,000",
                    "apply_link": "https://jobs.netflix.com/jobs/987654",
                    "description": f"Netflix is seeking a Senior {keyword} to join our streaming platform engineering team. You'll work on systems that deliver entertainment to millions of subscribers worldwide, focusing on performance, scalability, and user experience. This role involves working with cutting-edge technologies in cloud computing, microservices, and content delivery.",
                    "source": "Netflix Jobs",
                    "logo": "https://logo.clearbit.com/netflix.com",
                    "job_type": "Full-time",
                    "posted_date": 1648339200,
                    "is_remote": True,
                    "requirements": f"5+ years {keyword} experience, cloud platforms, streaming technology, distributed systems",
                    "benefits": "Unlimited PTO, comprehensive health coverage, 401k matching, stock options, free Netflix subscription"
                },
                {
                    "title": f"Lead {keyword}",
                    "company": "Tesla",
                    "location": "Palo Alto, CA",
                    "salary": "$190,000 - $270,000",
                    "apply_link": "https://www.tesla.com/careers/job/1234567",
                    "description": f"Tesla is looking for a Lead {keyword} to join our automotive software team. You'll work on the software that powers our electric vehicles, energy products, and autonomous driving technology. This role offers the opportunity to contribute to sustainable transportation and energy solutions while working with cutting-edge automotive technology.",
                    "source": "Tesla Careers",
                    "logo": "https://logo.clearbit.com/tesla.com",
                    "job_type": "Full-time",
                    "posted_date": 1648252800,
                    "is_remote": False,
                    "requirements": f"7+ years {keyword} experience, automotive software, embedded systems, C++/Python",
                    "benefits": "Stock options, health insurance, vehicle purchase program, charging benefits, gym access"
                },
                {
                    "title": f"Senior {keyword}",
                    "company": "Tesla",
                    "location": "Palo Alto, CA",
                    "salary": "$150,000 - $220,000",
                    "apply_link": "https://www.tesla.com/careers/job/7654321",
                    "description": f"Join Tesla's Autopilot team as a Senior {keyword}. You'll work on developing and improving our autonomous driving technology, using machine learning, computer vision, and real-time systems to create safer, more capable self-driving vehicles. This is a unique opportunity to shape the future of transportation.",
                    "source": "Tesla Careers",
                    "logo": "https://logo.clearbit.com/tesla.com",
                    "job_type": "Full-time",
                    "posted_date": 1648166400,
                    "is_remote": False,
                    "requirements": f"5+ years {keyword} experience, machine learning, computer vision, C++, Python",
                    "benefits": "Competitive salary, stock options, health coverage, vehicle discounts, innovation culture"
                },
                {
                    "title": f"Senior {keyword}",
                    "company": "Spotify",
                    "location": "New York, NY",
                    "salary": "$160,000 - $240,000",
                    "apply_link": "https://www.lifeatspotify.com/jobs/543210",
                    "description": f"Spotify is seeking a Senior {keyword} to join our music streaming platform team. You'll work on systems that deliver music to hundreds of millions of users globally, focusing on recommendation algorithms, audio processing, and user experience. This role combines music, technology, and data to create personalized listening experiences.",
                    "source": "Spotify Jobs",
                    "logo": "https://logo.clearbit.com/spotify.com",
                    "job_type": "Full-time",
                    "posted_date": 1648080000,
                    "is_remote": True,
                    "requirements": f"4+ years {keyword} experience, music technology, recommendation systems, backend development",
                    "benefits": "Flexible work hours, free Spotify premium, health insurance, parental leave, learning budget"
                },
                {
                    "title": f"Senior {keyword}",
                    "company": "Uber",
                    "location": "San Francisco, CA",
                    "salary": "$165,000 - $235,000",
                    "apply_link": "https://www.uber.com/jobs/9876543",
                    "description": f"Uber is looking for a Senior {keyword} to join our ridesharing platform team. You'll work on systems that connect millions of riders and drivers globally, focusing on real-time matching, pricing algorithms, and logistics optimization. This role offers the opportunity to work on complex distributed systems at massive scale.",
                    "source": "Uber Careers",
                    "logo": "https://logo.clearbit.com/uber.com",
                    "job_type": "Full-time",
                    "posted_date": 1647993600,
                    "is_remote": True,
                    "requirements": f"5+ years {keyword} experience, distributed systems, real-time applications, mobile backend",
                    "benefits": "Competitive compensation, equity, health insurance, free Uber credits, flexible work arrangements"
                },
                {
                    "title": f"Lead {keyword} (Mobile)",
                    "company": "Alpha Technologies",
                    "location": "Atlanta, GA",
                    "salary": "$150k-190k",
                    "apply_link": "https://builtin.com/jobs/view/11",
                    "description": f"Lead Mobile {keyword} at Alpha Technologies. iOS and Android development.",
                    "source": "Built In",
                    "logo": "",
                    "job_type": "Remote",
                    "posted_date": 1647907200,
                    "is_remote": True
                },
                {
                    "title": f"Principal {keyword} (Cloud)",
                    "company": "Beta Software",
                    "location": "Phoenix, AZ",
                    "salary": "$170k-210k",
                    "apply_link": "https://angel.co/jobs/view/12",
                    "description": f"Principal Cloud {keyword} at Beta Software. AWS and Azure expertise.",
                    "source": "AngelList",
                    "logo": "",
                    "job_type": "Full-time",
                    "posted_date": 1647820800,
                    "is_remote": False
                },
                {
                    "title": f"Staff {keyword} (AI/ML)",
                    "company": "Gamma Computing",
                    "location": "Philadelphia, PA",
                    "salary": "$160k-200k",
                    "apply_link": "https://hired.com/jobs/view/13",
                    "description": f"Staff AI/ML {keyword} at Gamma Computing. Machine learning projects.",
                    "source": "Hired",
                    "logo": "",
                    "job_type": "Hybrid",
                    "posted_date": 1647734400,
                    "is_remote": True
                },
                {
                    "title": f"Director {keyword} (DevOps)",
                    "company": "Delta Systems",
                    "location": "San Diego, CA",
                    "salary": "$190k-240k",
                    "apply_link": "https://dice.com/jobs/view/14",
                    "description": f"Director DevOps {keyword} at Delta Systems. Infrastructure and automation.",
                    "source": "Dice",
                    "logo": "",
                    "job_type": "Remote",
                    "posted_date": 1647648000,
                    "is_remote": True
                },
                {
                    "title": f"Senior {keyword} (Security)",
                    "company": "Epsilon Networks",
                    "location": "Nashville, TN",
                    "salary": "$130k-170k",
                    "apply_link": "https://linkedin.com/jobs/view/15",
                    "description": f"Senior Security {keyword} at Epsilon Networks. Cybersecurity focus.",
                    "source": "LinkedIn",
                    "logo": "",
                    "job_type": "Full-time",
                    "posted_date": 1647561600,
                    "is_remote": False
                },
                {
                    "title": f"Mid-Level {keyword} (Data)",
                    "company": "Zeta Analytics",
                    "location": "Remote",
                    "salary": "$125k-155k",
                    "apply_link": "https://glassdoor.com/jobs/view/16",
                    "description": f"Mid-Level Data {keyword} at Zeta Analytics. Data analysis and visualization.",
                    "source": "Glassdoor",
                    "logo": "",
                    "job_type": "Remote",
                    "posted_date": 1647475200,
                    "is_remote": True
                },
                {
                    "title": f"Junior {keyword} (Backend)",
                    "company": "Eta Robotics",
                    "location": "Austin, TX",
                    "salary": "$85k-115k",
                    "apply_link": "https://indeed.com/jobs/view/17",
                    "description": f"Junior Backend {keyword} at Eta Robotics. API development and databases.",
                    "source": "Indeed",
                    "logo": "",
                    "job_type": "Hybrid",
                    "posted_date": 1647388800,
                    "is_remote": False
                },
                {
                    "title": f"Lead {keyword} (Frontend)",
                    "company": "Theta Security",
                    "location": "Seattle, WA",
                    "salary": "$145k-185k",
                    "apply_link": "https://builtin.com/jobs/view/18",
                    "description": f"Lead Frontend {keyword} at Theta Security. Security-focused UI development.",
                    "source": "Built In",
                    "logo": "",
                    "job_type": "Remote",
                    "posted_date": 1647302400,
                    "is_remote": True
                },
                {
                    "title": f"Principal {keyword} (Full Stack)",
                    "company": "Iota Mobile",
                    "location": "Boston, MA",
                    "salary": "$165k-205k",
                    "apply_link": "https://angel.co/jobs/view/19",
                    "description": f"Principal Full Stack {keyword} at Iota Mobile. End-to-end development.",
                    "source": "AngelList",
                    "logo": "",
                    "job_type": "Full-time",
                    "posted_date": 1647216000,
                    "is_remote": False
                },
                {
                    "title": f"Staff {keyword} (Mobile)",
                    "company": "Kappa Cloud",
                    "location": "Los Angeles, CA",
                    "salary": "$155k-195k",
                    "apply_link": "https://hired.com/jobs/view/20",
                    "description": f"Staff Mobile {keyword} at Kappa Cloud. Cross-platform mobile development.",
                    "source": "Hired",
                    "logo": "",
                    "job_type": "Hybrid",
                    "posted_date": 1647129600,
                    "is_remote": True
                }
            ]
            
            response_data = {
                'count': len(mock_jobs),
                'next': None,
                'previous': None,
                'results': mock_jobs
            }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())
    
    def handle_health_check(self):
        response_data = {
            'status': 'healthy',
            'message': 'Simple Job Server is Running',
            'timestamp': str(datetime.now())
        }
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response_data).encode())
    
    def handle_register(self):
        try:
            # Read the request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Mock successful registration
            response_data = {
                'message': 'Registration successful',
                'user': {
                    'id': 1,
                    'username': data.get('username', 'user'),
                    'email': data.get('email', 'user@example.com'),
                    'first_name': data.get('first_name', ''),
                    'last_name': data.get('last_name', ''),
                    'role': 'student'
                },
                'tokens': {
                    'access': 'mock-jwt-access-token-12345',
                    'refresh': 'mock-jwt-refresh-token-67890'
                }
            }
            
            self.send_response(201)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode())
            
        except Exception as e:
            error_response = {
                'error': 'Registration failed',
                'message': str(e)
            }
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(error_response).encode())
    
    def handle_jsearch_api(self):
        """Handle JSearch API requests for real job data"""
        try:
            # Parse query parameters
            parsed_url = urlparse(self.path)
            query_params = parse_qs(parsed_url.query)
            query = query_params.get('query', [''])[0]
            
            if not query:
                # Try keyword parameter as fallback
                query = query_params.get('keyword', [''])[0]
            
            if not query:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'Search query is required',
                    'jobs': []
                }).encode())
                return
            
            # Fetch real jobs from APIs
            try:
                # Initialize real job fetcher
                job_fetcher = RealJobFetcher()
                
                # Record start time for response time calculation
                start_time = time.time()
                
                # Try to fetch real jobs from APIs
                real_jobs = job_fetcher.fetch_all_jobs(query, "remote", 20)
                
                # Calculate actual response time
                response_time = time.time() - start_time
                
                if real_jobs:
                    # We got real jobs from APIs
                    response_data = {
                        'jobs': real_jobs,
                        'source': 'real_api',
                        'query': query,
                        'total': len(real_jobs),
                        'response_time': f"{response_time:.2f}s"
                    }
                    logger.info(f"Real API success for query: {query}, found {len(real_jobs)} jobs from Indeed/LinkedIn/Glassdoor")
                else:
                    # No API keys configured or APIs failed, use demo data
                    demo_jobs = get_demo_jobs(query, 20)
                    response_data = {
                        'jobs': demo_jobs,
                        'source': 'demo_data',
                        'query': query,
                        'total': len(demo_jobs),
                        'response_time': f"{response_time:.2f}s",
                        'message': 'Showing demo data - configure API keys for real jobs from Indeed, LinkedIn, and Glassdoor'
                    }
                    logger.info(f"Demo data used for query: {query}, found {len(demo_jobs)} jobs")
                
            except Exception as e:
                logger.error(f"Error fetching real jobs: {e}")
                # Fallback to demo data
                try:
                    demo_jobs = get_demo_jobs(query, 20)
                    fallback_response_time = time.time() - start_time
                    response_data = {
                        'jobs': demo_jobs,
                        'source': 'demo_fallback',
                        'query': query,
                        'total': len(demo_jobs),
                        'response_time': f"{fallback_response_time:.2f}s",
                        'message': 'API error - showing demo data'
                    }
                    logger.info(f"Demo fallback for query: {query}, found {len(demo_jobs)} jobs")
                except Exception as fallback_error:
                    logger.error(f"Demo fallback failed: {fallback_error}")
                    error_response_time = time.time() - start_time
                    response_data = {
                        'error': 'Failed to fetch job data',
                        'jobs': [],
                        'source': 'error',
                        'query': query,
                        'total': 0,
                        'response_time': f"{error_response_time:.2f}s"
                    }
            
            # Send response
            try:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Content-Length', str(len(json.dumps(response_data).encode())))
                self.end_headers()
                self.wfile.write(json.dumps(response_data).encode())
            except (ConnectionAbortedError, ConnectionResetError) as e:
                logger.error(f"Connection error while sending response: {e}")
            except Exception as e:
                logger.error(f"Error sending response: {e}")
            
        except Exception as e:
            logger.error(f"Error in handle_jsearch_api: {e}")
            error_response = {
                'error': 'Internal server error',
                'jobs': [],
                'source': 'error',
                'query': query if 'query' in locals() else 'unknown',
                'total': 0,
                'response_time': f"{time.time():.2f}s"
            }
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(error_response).encode())
    
    def handle_login(self):
        try:
            # Read the request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Mock successful login
            username = data.get('username', '')
            password = data.get('password', '')
            
            # Simple validation - accept any non-empty credentials
            if username and password:
                current_time = datetime.now()
                response_data = {
                    'message': 'Login successful',
                    'user': {
                        'id': 1,
                        'username': username,
                        'email': f'{username}@example.com',
                        'first_name': 'Test',
                        'last_name': 'User',
                        'role': 'student',
                        'lastLogin': current_time.strftime('%B %d, %Y at %I:%M %p')  # Current login time
                    },
                    'tokens': {
                        'access': 'mock-jwt-access-token-12345',
                        'refresh': 'mock-jwt-refresh-token-67890'
                    }
                }
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response_data).encode())
            else:
                error_response = {
                    'error': 'Login failed',
                    'message': 'Invalid credentials'
                }
                self.send_response(401)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(error_response).encode())
            
        except Exception as e:
            error_response = {
                'error': 'Login failed',
                'message': str(e)
            }
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(error_response).encode())
    
    def handle_register_job_provider(self):
        try:
            # Read the request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Mock successful job provider registration
            response_data = {
                'message': 'Job provider registration successful',
                'user': {
                    'id': 1,
                    'username': data.get('username', 'provider'),
                    'email': data.get('email', 'provider@example.com'),
                    'first_name': data.get('first_name', ''),
                    'last_name': data.get('last_name', ''),
                    'role': 'job_provider'
                },
                'tokens': {
                    'access': 'mock-jwt-access-token-12345',
                    'refresh': 'mock-jwt-refresh-token-67890'
                }
            }
            
            self.send_response(201)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode())
            
        except Exception as e:
            error_response = {
                'error': 'Job provider registration failed',
                'message': str(e)
            }
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(error_response).encode())
    
    def handle_get_profile(self):
        try:
            # Mock user profile data with dynamic dates
            current_time = datetime.now()
            # Simulate user signup date (30 days ago for demo)
            signup_date = current_time - timedelta(days=30)
            
            profile_data = {
                'id': 1,
                'firstName': 'John',
                'lastName': 'Doe',
                'email': 'john.doe@example.com',
                'phone': '+1 (555) 123-4567',
                'location': 'San Francisco, CA',
                'bio': 'Passionate software developer with expertise in full-stack web development and data analysis. Looking for opportunities to leverage my skills in building innovative solutions.',
                'joinDate': signup_date.strftime('%B %d, %Y'),  # Real signup date
                'lastLogin': current_time.strftime('%B %d, %Y at %I:%M %p'),  # Current login time
                'createdAt': signup_date.strftime('%Y-%m-%d %H:%M:%S'),
                'updatedAt': current_time.strftime('%Y-%m-%d %H:%M:%S'),
                'skills': ['JavaScript', 'React', 'Python', 'Node.js', 'SQL'],
                'experience': '5 years',
                'education': 'Bachelor of Science in Computer Science',
                'role': 'student',
                'accountStatus': 'Active'
            }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(profile_data).encode())
            
        except Exception as e:
            error_response = {
                'error': 'Failed to get profile',
                'message': str(e)
            }
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(error_response).encode())
    
    def handle_update_profile(self):
        try:
            # Read the request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Mock successful profile update
            current_time = datetime.now()
            updated_profile = {
                'id': 1,
                'firstName': data.get('firstName', 'John'),
                'lastName': data.get('lastName', 'Doe'),
                'email': data.get('email', 'john.doe@example.com'),
                'phone': data.get('phone', '+1 (555) 123-4567'),
                'location': data.get('location', 'San Francisco, CA'),
                'bio': data.get('bio', 'Passionate software developer with expertise in full-stack web development and data analysis.'),
                'joinDate': 'January 2024',
                'lastLogin': current_time.strftime('%Y-%m-%d %H:%M:%S'),
                'updatedAt': current_time.strftime('%Y-%m-%d %H:%M:%S'),
                'skills': data.get('skills', ['JavaScript', 'React', 'Python', 'Node.js', 'SQL']),
                'experience': data.get('experience', '5 years'),
                'education': data.get('education', 'Bachelor of Science in Computer Science'),
                'role': 'student',
                'message': 'Profile updated successfully'
            }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(updated_profile).encode())
            
        except Exception as e:
            error_response = {
                'error': 'Failed to update profile',
                'message': str(e)
            }
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(error_response).encode())
    
    def log_message(self, format, *args):
        # Suppress log messages for cleaner output
        pass

def run_server():
    server_address = ('', 8000)
    httpd = HTTPServer(server_address, JobSearchHandler)
    print("Simple Job Server running on http://localhost:8000")
    print("Job Search API: http://localhost:8000/api/search/?keyword=Software%20Engineer")
    print("Health Check: http://localhost:8000/api/health")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.shutdown()

if __name__ == '__main__':
    run_server()
