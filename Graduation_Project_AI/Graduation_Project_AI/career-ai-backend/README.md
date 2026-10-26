# AI Career Recommendation System Backend

A Django REST API backend for an AI-powered career recommendation system that processes resumes, analyzes user preferences, and provides career path recommendations.

## Features

- **User Authentication**: JWT-based registration and login system
- **Resume Processing**: Extract skills from PDF and DOCX files
- **Career Questionnaire**: Interactive questionnaire to understand user preferences
- **AI Recommendations**: Machine learning-based career path recommendations
- **Job Search**: Search and filter job listings
- **API Documentation**: Complete Swagger/OpenAPI documentation

## Setup Instructions

### 1. Create Virtual Environment

```bash
python -m venv venv
```

### 2. Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Run Database Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Create Superuser (Optional)

```bash
python manage.py createsuperuser
```

### 6. Start Development Server

```bash
python manage.py runserver
```

The server will start at `http://127.0.0.1:8000/`

## API Documentation

### Swagger UI
- URL: `http://127.0.0.1:8000/swagger/`
- Interactive API documentation

### ReDoc Documentation
- URL: `http://127.0.0.1:8000/redoc/`
- Clean, readable API documentation

### OpenAPI Schema
- URL: `http://127.0.0.1:8000/openapi/`
- Raw OpenAPI JSON schema

## API Endpoints

### Authentication
- `POST /api/register/` - User registration
- `POST /api/login/` - User login
- `GET /api/profile/` - Get user profile
- `PUT /api/profile/` - Update user profile

### Career Questionnaire
- `GET /api/career_questions/` - Get career questions
- `POST /api/questionnaire/answer/` - Submit questionnaire answers

### Resume Processing
- `POST /api/upload_resume/` - Upload and process resume

### AI Recommendations
- `GET /api/ai_recommendations/` - Get career recommendations

### Job Search
- `GET /api/jobs/search/` - Search jobs with filters
- `GET /api/jobs/` - Get all job listings

## Project Structure

```
career_ai_backend/
├── career_ai_backend/          # Main Django project
│   ├── __init__.py
│   ├── settings.py             # Django settings
│   ├── urls.py                # Main URL configuration
│   ├── wsgi.py
│   └── asgi.py
├── users/                     # User authentication app
│   ├── models.py              # User profile model
│   ├── serializers.py         # User serializers
│   ├── views.py               # Authentication views
│   └── urls.py                # User URLs
├── careers/                   # Career questionnaire app
│   ├── models.py              # Question and answer models
│   ├── serializers.py         # Career serializers
│   ├── views.py               # Career views
│   └── urls.py                # Career URLs
├── jobs/                      # Job search app
│   ├── models.py              # Job listing model
│   ├── serializers.py         # Job serializers
│   ├── views.py               # Job views
│   └── urls.py                # Job URLs
├── ai_engine/                 # AI processing app
│   ├── models.py              # Resume upload model
│   ├── services.py            # AI processing services
│   ├── serializers.py         # AI serializers
│   ├── views.py               # AI views
│   └── urls.py                # AI URLs
├── manage.py                  # Django management script
├── requirements.txt           # Python dependencies
└── README.md                  # This file
```

## Usage Examples

### Register a New User
```bash
curl -X POST http://127.0.0.1:8000/api/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "securepassword123",
    "password_confirm": "securepassword123",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

### Login
```bash
curl -X POST http://127.0.0.1:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "securepassword123"
  }'
```

### Upload Resume
```bash
curl -X POST http://127.0.0.1:8000/api/upload_resume/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/resume.pdf"
```

### Get AI Recommendations
```bash
curl -X GET http://127.0.0.1:8000/api/ai_recommendations/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Technology Stack

- **Backend**: Django 4.2+
- **API Framework**: Django REST Framework
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Documentation**: drf-yasg (Swagger/OpenAPI)
- **Resume Processing**: PyPDF2, python-docx
- **Database**: SQLite (development)
- **Python**: 3.8+

## Development Notes

- The project uses SQLite for development. For production, configure PostgreSQL or MySQL.
- File uploads are stored in the `media/` directory.
- JWT tokens expire after 60 minutes (access token) and 1 day (refresh token).
- Resume processing extracts common technical and soft skills.
- AI recommendations are based on skill matching and questionnaire answers.

## License

This project is licensed under the BSD License.
