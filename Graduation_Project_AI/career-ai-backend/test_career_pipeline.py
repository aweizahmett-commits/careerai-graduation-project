#!/usr/bin/env python3
"""
Test script for the complete Career AI Connected pipeline
Tests the entire user flow from registration to job search
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"

class CareerPipelineTester:
    def __init__(self):
        self.session = requests.Session()
        self.user_token = None
        self.test_results = []
        
    def log_test(self, test_name, success, message=""):
        """Log test results"""
        status = "PASS" if success else "FAIL"
        self.test_results.append({
            "test": test_name,
            "status": status,
            "message": message,
            "timestamp": datetime.now().isoformat()
        })
        print(f"[{status}] {test_name}")
        if message:
            print(f"    {message}")
    
    def test_health_check(self):
        """Test if backend is running"""
        try:
            response = requests.get(f"{API_BASE}/health/")
            success = response.status_code == 200
            self.log_test("Backend Health Check", success, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("Backend Health Check", False, f"Error: {str(e)}")
            return False
    
    def test_user_registration(self):
        """Test user registration"""
        try:
            user_data = {
                "username": f"testuser_{int(time.time())}",
                "email": f"test_{int(time.time())}@example.com",
                "password": "testpassword123",
                "first_name": "Test",
                "last_name": "User"
            }
            
            response = requests.post(f"{API_BASE}/register/", json=user_data)
            success = response.status_code == 201
            
            if success:
                data = response.json()
                self.user_token = data.get('tokens', {}).get('access')
                self.session.headers.update({'Authorization': f'Bearer {self.user_token}'})
                self.log_test("User Registration", success, f"User: {user_data['username']}")
            else:
                self.log_test("User Registration", False, f"Status: {response.status_code}")
            
            return success
        except Exception as e:
            self.log_test("User Registration", False, f"Error: {str(e)}")
            return False
    
    def test_user_login(self):
        """Test user login"""
        try:
            login_data = {
                "username": "testuser",
                "password": "password123"
            }
            
            response = requests.post(f"{API_BASE}/login/", json=login_data)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                self.user_token = data.get('user', {}).get('lastLogin')
                self.session.headers.update({'Authorization': f'Bearer mock-jwt-access-token-12345'})
                self.log_test("User Login", success, f"Login time: {data.get('user', {}).get('lastLogin')}")
            else:
                self.log_test("User Login", False, f"Status: {response.status_code}")
            
            return success
        except Exception as e:
            self.log_test("User Login", False, f"Error: {str(e)}")
            return False
    
    def test_user_progress(self):
        """Test user progress tracking"""
        try:
            response = self.session.get(f"{API_BASE}/progress/")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                self.log_test("User Progress", success, f"Current step: {data.get('current_step')}")
                return data
            else:
                self.log_test("User Progress", False, f"Status: {response.status_code}")
                return None
        except Exception as e:
            self.log_test("User Progress", False, f"Error: {str(e)}")
            return None
    
    def test_resume_upload(self):
        """Test resume upload"""
        try:
            # Create a mock PDF file
            resume_content = b"Mock PDF content for testing"
            files = {'file': ('test_resume.pdf', resume_content, 'application/pdf')}
            
            response = self.session.post(f"{API_BASE}/upload-resume/", files=files)
            success = response.status_code == 201
            
            if success:
                data = response.json()
                self.log_test("Resume Upload", success, f"Skills extracted: {len(data.get('resume_data', {}).get('extracted_skills', []))}")
            else:
                self.log_test("Resume Upload", False, f"Status: {response.status_code}")
            
            return success
        except Exception as e:
            self.log_test("Resume Upload", False, f"Error: {str(e)}")
            return False
    
    def test_assessment_submission(self):
        """Test assessment submission"""
        try:
            assessment_data = {
                "answers": {
                    "q1": "analytical",
                    "q2": "problem-solving",
                    "q3": "data analysis",
                    "q4": "team collaboration",
                    "q5": "creative thinking"
                }
            }
            
            response = self.session.post(f"{API_BASE}/assessment/submit/", json=assessment_data)
            success = response.status_code == 201
            
            if success:
                data = response.json()
                personality = data.get('assessment_result', {}).get('personality_type')
                self.log_test("Assessment Submission", success, f"Personality: {personality}")
            else:
                self.log_test("Assessment Submission", False, f"Status: {response.status_code}")
            
            return success
        except Exception as e:
            self.log_test("Assessment Submission", False, f"Error: {str(e)}")
            return False
    
    def test_career_matches(self):
        """Test career matching"""
        try:
            response = self.session.get(f"{API_BASE}/career-matches/")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                matches = data if isinstance(data, list) else []
                self.log_test("Career Matches", success, f"Found {len(matches)} career matches")
                
                # Show top 3 matches
                for i, match in enumerate(matches[:3]):
                    title = match.get('job_title', 'Unknown')
                    score = match.get('match_score', 0)
                    print(f"    {i+1}. {title} - {score}% match")
            else:
                self.log_test("Career Matches", False, f"Status: {response.status_code}")
            
            return success
        except Exception as e:
            self.log_test("Career Matches", False, f"Error: {str(e)}")
            return False
    
    def test_filtered_jobs(self):
        """Test job filtering based on career matches"""
        try:
            response = self.session.get(f"{API_BASE}/jobs/")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                jobs = data.get('filtered_jobs', [])
                careers = data.get('career_matches', [])
                
                self.log_test("Filtered Jobs", success, f"Found {len(jobs)} jobs for {len(careers)} careers")
                
                # Show sample jobs
                for i, job in enumerate(jobs[:3]):
                    title = job.get('title', 'Unknown')
                    company = job.get('company', 'Unknown')
                    print(f"    {i+1}. {title} at {company}")
            else:
                self.log_test("Filtered Jobs", False, f"Status: {response.status_code}")
            
            return success
        except Exception as e:
            self.log_test("Filtered Jobs", False, f"Error: {str(e)}")
            return False
    
    def test_profile_api(self):
        """Test profile API"""
        try:
            response = self.session.get(f"{API_BASE}/profile/")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                self.log_test("Profile API", success, f"User: {data.get('firstName', 'Unknown')} {data.get('lastName', 'Unknown')}")
            else:
                self.log_test("Profile API", False, f"Status: {response.status_code}")
            
            return success
        except Exception as e:
            self.log_test("Profile API", False, f"Error: {str(e)}")
            return False
    
    def test_job_search(self):
        """Test job search API"""
        try:
            response = requests.get(f"{API_BASE}/search/?keyword=Software%20Engineer")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                jobs = data.get('results', [])
                self.log_test("Job Search", success, f"Found {len(jobs)} jobs")
            else:
                self.log_test("Job Search", False, f"Status: {response.status_code}")
            
            return success
        except Exception as e:
            self.log_test("Job Search", False, f"Error: {str(e)}")
            return False
    
    def run_complete_test(self):
        """Run the complete career pipeline test"""
        print("=" * 60)
        print("CAREER AI CONNECTED - COMPLETE PIPELINE TEST")
        print("=" * 60)
        
        # Test basic connectivity
        if not self.test_health_check():
            print("Backend server is not running. Please start the server first.")
            return False
        
        # Test authentication
        if not self.test_user_login():
            print("Login failed. Please check authentication.")
            return False
        
        # Test user progress
        progress = self.test_user_progress()
        
        # Test profile
        self.test_profile_api()
        
        # Test job search (existing functionality)
        self.test_job_search()
        
        # Step 1: Upload Resume
        if self.test_resume_upload():
            print("\n--- Resume Upload Complete ---")
        
        # Step 2: Assessment
        if self.test_assessment_submission():
            print("\n--- Assessment Complete ---")
        
        # Step 3: Career Matches
        if self.test_career_matches():
            print("\n--- Career Matching Complete ---")
        
        # Step 4: Filtered Jobs
        if self.test_filtered_jobs():
            print("\n--- Job Filtering Complete ---")
        
        # Final progress check
        final_progress = self.test_user_progress()
        
        # Print summary
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['status'] == 'PASS')
        total = len(self.test_results)
        
        print(f"Tests Passed: {passed}/{total}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if passed == total:
            print("\nAll tests passed! Career pipeline is working correctly.")
        else:
            print("\nSome tests failed. Please check the implementation.")
        
        # Print detailed results
        print("\nDETAILED RESULTS:")
        for result in self.test_results:
            status_icon = "PASS" if result['status'] == 'PASS' else 'FAIL'
            print(f"  [{status_icon}] {result['test']}")
            if result['message']:
                print(f"      {result['message']}")
        
        return passed == total

if __name__ == "__main__":
    tester = CareerPipelineTester()
    tester.run_complete_test()
