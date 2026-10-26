from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

@csrf_exempt
def health_check(request):
    """Simple health check endpoint"""
    return JsonResponse({
        'status': 'healthy',
        'message': 'Backend is running'
    })

@csrf_exempt
def simple_job_search(request):
    """Simple job search endpoint without REST Framework"""
    if request.method == 'GET':
        keyword = request.GET.get('keyword', 'Software Engineer')
        
        # Mock job data
        mock_jobs = [
            {
                "title": f"Senior {keyword}",
                "company": "TechCorp Solutions",
                "location": "San Francisco, CA",
                "salary": "$150k-200k",
                "apply_link": "https://linkedin.com/jobs/view/1",
                "description": f"Senior {keyword} role at TechCorp Solutions.",
                "source": "LinkedIn",
                "logo": "",
                "job_type": "Full-time",
                "posted_date": 1648771200,
                "is_remote": True
            },
            {
                "title": f"Mid-Level {keyword}",
                "company": "Digital Innovations",
                "location": "New York, NY",
                "salary": "$120k-150k",
                "apply_link": "https://glassdoor.com/jobs/view/2",
                "description": f"Mid-Level {keyword} position at Digital Innovations.",
                "source": "Glassdoor",
                "logo": "",
                "job_type": "Remote",
                "posted_date": 1648684800,
                "is_remote": True
            },
            {
                "title": f"Junior {keyword}",
                "company": "Creative Studios",
                "location": "Austin, TX",
                "salary": "$80k-120k",
                "apply_link": "https://indeed.com/jobs/view/3",
                "description": f"Junior {keyword} opportunity at Creative Studios.",
                "source": "Indeed",
                "logo": "",
                "job_type": "Full-time",
                "posted_date": 1648598400,
                "is_remote": False
            }
        ]
        
        return JsonResponse({
            'count': len(mock_jobs),
            'next': None,
            'previous': None,
            'results': mock_jobs
        })
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)
