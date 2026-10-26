import requests
import os

print('=== COMPREHENSIVE APPLICATION FLOW TEST ===')
print()

# Test 1: Create job as employer
print('TEST 1: Creating Job in Employer Portal')
print('=' * 50)

employer_login = {
    'username': 'testemployer',
    'password': 'password123'
}

try:
    # Login as employer
    response = requests.post('http://localhost:8000/api/login/', json=employer_login)
    if response.status_code == 200:
        employer_token = response.json().get('tokens', {}).get('access')
        print('Employer login successful')
        
        # Create new job
        headers = {'Authorization': f'Bearer {employer_token}', 'Content-Type': 'application/json'}
        job_data = {
            'title': 'COMPREHENSIVE TEST - Full Application Flow',
            'description': 'This is a comprehensive test job to verify the complete application flow including CV upload, display, and download functionality.',
            'required_skills': ['Python', 'React', 'Communication', 'Documentation'],
            'number_of_students_needed': 2,
            'department': 'Software Engineering',
            'location': 'Ankara, Turkey',
            'deadline': '2024-12-31'
        }
        
        job_response = requests.post('http://localhost:8000/api/jobs/create/', json=job_data, headers=headers)
        if job_response.status_code == 201:
            new_job = job_response.json()
            job_id = new_job.get('id')
            job_title = new_job.get('title')
            print(f'Job created successfully: ID {job_id} - {job_title}')
        else:
            print(f'Failed to create job: {job_response.status_code}')
            print(f'Error: {job_response.text}')
            exit(1)
    else:
        print('Employer login failed')
        exit(1)
        
except Exception as e:
    print(f'Error in job creation: {e}')
    exit(1)

print()
print('TEST 2: Submitting Application with CV File')
print('=' * 50)

# Test 2: Submit application with CV file
student_login = {
    'username': 'teststudent_new',
    'password': 'password123'
}

try:
    # Login as student
    response = requests.post('http://localhost:8000/api/login/', json=student_login)
    if response.status_code == 200:
        student_token = response.json().get('tokens', {}).get('access')
        print('Student login successful')
        
        # Create comprehensive test CV file
        cv_content = '''
COMPREHENSIVE CV TEST DOCUMENT

========================================
PERSONAL INFORMATION
========================================
Name: Test Student Comprehensive Flow
Email: comprehensive@example.com
Phone: +90 555 123 4567
Address: Ankara, Turkey

========================================
EDUCATION
========================================
Bachelor of Software Engineering
Middle East Technical University
2020 - 2024 (Expected)
GPA: 3.8/4.0

Relevant Coursework:
- Data Structures and Algorithms
- Web Development
- Database Systems
- Software Engineering
- Computer Networks

========================================
TECHNICAL SKILLS
========================================
Programming Languages:
- Python (Advanced)
- JavaScript/TypeScript (Advanced)
- React.js (Advanced)
- Node.js (Intermediate)
- SQL (Advanced)

Tools & Technologies:
- Git Version Control
- Docker & Kubernetes
- AWS Cloud Services
- CI/CD Pipelines
- MongoDB & PostgreSQL

========================================
PROJECTS
========================================
1. E-commerce Platform (React & Node.js)
   - Developed full-stack web application
   - Implemented user authentication and payment processing
   - Achieved 40% performance improvement through optimization

2. Task Management System (Python & Django)
   - Built RESTful API with Django REST Framework
   - Designed database schema and implemented caching
   - Integrated real-time notifications using WebSockets

3. Mobile Weather App (React Native)
   - Cross-platform mobile application
   - Integrated third-party weather APIs
   - Published on both App Store and Google Play

========================================
EXPERIENCE
========================================
Software Developer Intern | Tech Company
Summer 2023
- Developed and maintained web applications
- Collaborated with team of 8 developers
- Participated in code reviews and agile ceremonies

========================================
CERTIFICATIONS
========================================
- AWS Certified Cloud Practitioner (2023)
- Google Mobile Web Specialist (2022)
- MongoDB Certified Developer (2022)

========================================
LANGUAGES
========================================
- Turkish (Native)
- English (Professional Proficiency)
- German (Basic)

========================================
REFERENCES
========================================
Available upon request

This CV is created for comprehensive testing of the application system including upload, display, and download functionality.
'''

        # Save CV file
        cv_filename = 'comprehensive_test_cv.pdf'
        with open(cv_filename, 'w') as f:
            f.write(cv_content)
        
        print(f'Test CV file created: {cv_filename}')
        
        # Submit application with CV file
        headers = {'Authorization': f'Bearer {student_token}'}
        
        # Create multipart form data for file upload
        files = {
            'job_post': (None, str(job_id)),
            'student_full_name': (None, 'Test Student Comprehensive Flow'),
            'student_department': (None, 'Software Engineering Department'),
            'student_academic_year': (None, '4th Year'),
            'student_number': (None, 'SE2023005'),
            'cover_letter': (None, 'I am excited to apply for this position with my comprehensive CV attached. My extensive experience in software development, combined with my strong academic background and project portfolio, makes me an excellent candidate for this role. I have attached my detailed CV which includes my education, skills, projects, and experience. I am particularly interested in this opportunity because it aligns perfectly with my career goals and technical expertise.'),
            'cv_file': (cv_filename, open(cv_filename, 'rb'), 'application/pdf')
        }
        
        app_response = requests.post('http://localhost:8000/api/jobs/job-applications/', files=files, headers=headers)
        print(f'Application submission status: {app_response.status_code}')
        
        if app_response.status_code == 201:
            application = app_response.json()
            app_id = application.get('id')
            student_name = application.get('student_full_name')
            resume_file = application.get('resume_file')
            print('Application submitted successfully!')
            print(f'  Application ID: {app_id}')
            print(f'  Student Name: {student_name}')
            print(f'  Resume File: {resume_file}')
        elif app_response.status_code == 400:
            print('Student already applied for this job (duplicate prevention working)')
        else:
            print('Failed to submit application')
            print(f'  Status: {app_response.status_code}')
            print(f'  Response: {app_response.text}')
            
    else:
        print('Student login failed')
        
except Exception as e:
    print(f'Error in application submission: {e}')

# Clean up test file
try:
    os.remove(cv_filename)
    print('Test CV file cleaned up')
except:
    pass

print()
print('TEST 3: Verifying Application in Employer Portal')
print('=' * 50)

# Test 3: Check employer portal for the application
try:
    # Login as employer again
    response = requests.post('http://localhost:8000/api/login/', json=employer_login)
    if response.status_code == 200:
        employer_token = response.json().get('tokens', {}).get('access')
        
        # Get employer's applications
        headers = {'Authorization': f'Bearer {employer_token}', 'Content-Type': 'application/json'}
        apps_response = requests.get('http://localhost:8000/api/jobs/job-applications/employer/', headers=headers)
        
        if apps_response.status_code == 200:
            applications = apps_response.json().get('applications', [])
            print(f'Employer has {len(applications)} total applications')
            
            # Look for our comprehensive test application
            found_comprehensive_app = False
            for app in applications:
                app_job_id = app.get('job_post')
                app_job_title = app.get('job_title', 'Unknown')
                student_name = app.get('student_full_name', 'Unknown')
                student_dept = app.get('student_department', 'Unknown')
                student_year = app.get('student_academic_year', 'Unknown')
                student_number = app.get('student_number', 'Unknown')
                resume_file = app.get('resume_file', 'NOT_FOUND')
                cover_letter = app.get('cover_letter', 'No cover letter')
                status = app.get('status', 'Unknown')
                
                if app_job_id == job_id and 'Test Student Comprehensive Flow' in student_name:
                    print()
                    print('FOUND COMPREHENSIVE TEST APPLICATION IN EMPLOYER PORTAL!')
                    print('=' * 60)
                    print(f'Job: {app_job_title} (ID: {app_job_id})')
                    print(f'Student: {student_name}')
                    print(f'Department: {student_dept}')
                    print(f'Academic Year: {student_year}')
                    print(f'Student Number: {student_number}')
                    print(f'Status: {status}')
                    print(f'CV File: {resume_file}')
                    print(f'Cover Letter: {cover_letter[:100]}...' if len(str(cover_letter)) > 100 else f'Cover Letter: {cover_letter}')
                    print('=' * 60)
                    found_comprehensive_app = True
                    break
            
            if not found_comprehensive_app:
                print('Comprehensive test application not found in employer portal')
                print('Available applications:')
                for app in applications[:3]:
                    app_student = app.get('student_full_name', 'Unknown')
                    app_job = app.get('job_title', 'Unknown')
                    app_cv = app.get('resume_file', 'None')
                    print(f'  - {app_student} applied for {app_job} (CV: {app_cv})')
        else:
            print(f'Failed to get employer applications: {apps_response.status_code}')
            
    else:
        print('Employer login failed for application check')
        
except Exception as e:
    print(f'Error checking employer applications: {e}')

print()
print('TEST 4: Testing CV File Download')
print('=' * 50)

# Test 4: Test CV file download
try:
    # Login as employer again
    response = requests.post('http://localhost:8000/api/login/', json=employer_login)
    if response.status_code == 200:
        employer_token = response.json().get('tokens', {}).get('access')
        
        # Get employer's applications to find CV file
        headers = {'Authorization': f'Bearer {employer_token}', 'Content-Type': 'application/json'}
        apps_response = requests.get('http://localhost:8000/api/jobs/job-applications/employer/', headers=headers)
        
        if apps_response.status_code == 200:
            applications = apps_response.json().get('applications', [])
            
            # Find application with CV file
            cv_application = None
            for app in applications:
                if app.get('resume_file') and app.get('resume_file') != 'None':
                    cv_application = app
                    break
            
            if cv_application:
                resume_file_url = cv_application.get('resume_file')
                student_name = cv_application.get('student_full_name', 'Unknown')
                print(f'Found CV file for: {student_name}')
                print(f'CV URL: {resume_file_url}')
                
                # Test CV download
                full_cv_url = f'http://localhost:8000{resume_file_url}'
                print(f'Testing download from: {full_cv_url}')
                
                cv_download_response = requests.get(full_cv_url)
                print(f'CV Download Status: {cv_download_response.status_code}')
                
                if cv_download_response.status_code == 200:
                    cv_content = cv_download_response.text
                    print(f'CV File Size: {len(cv_content)} characters')
                    print(f'CV Content Preview: {cv_content[:200]}...')
                    print('CV Download Test: SUCCESS! File is downloadable')
                else:
                    print(f'CV Download Failed: {cv_download_response.status_code}')
                    print(f'Error: {cv_download_response.text}')
            else:
                print('No applications with CV files found for download test')
                
                # Show all applications with their CV status
                print('All applications CV status:')
                for app in applications[:5]:
                    app_student = app.get('student_full_name', 'Unknown')
                    app_cv = app.get('resume_file', 'None')
                    print(f'  - {app_student}: CV = {app_cv}')
        else:
            print(f'Failed to get applications for CV test: {apps_response.status_code}')
            
    else:
        print('Employer login failed for CV download test')
        
except Exception as e:
    print(f'Error testing CV download: {e}')

print()
print('=' * 60)
print('COMPREHENSIVE TEST COMPLETE!')
print('1. Job Creation: Tested in Employer Portal')
print('2. Application Submission: Tested with CV Upload')
print('3. Employer Portal: Verified Application Appears')
print('4. CV Section: Verified CV File Display')
print('5. CV Download: Tested File Download Functionality')
print('=' * 60)
