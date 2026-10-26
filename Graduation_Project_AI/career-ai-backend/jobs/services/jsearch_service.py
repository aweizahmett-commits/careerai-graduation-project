import requests
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

BASE_URL = "https://jsearch.p.rapidapi.com/search"

def fetch_jobs(query="software engineer", page=1):
    """
    Fetch real jobs from JSearch API (RapidAPI)
    Returns job listings from LinkedIn, Glassdoor, and other job boards
    """
    headers = {
        "x-rapidapi-key": settings.JSEARCH_API_KEY,
        "x-rapidapi-host": settings.JSEARCH_HOST,
    }

    params = {
        "query": query,
        "page": page,
    }

    try:
        response = requests.get(BASE_URL, headers=headers, params=params, timeout=10)
        
        if response.status_code != 200:
            logger.error(f"JSearch API error: {response.status_code} - {response.text}")
            return {"error": f"Failed to fetch jobs: HTTP {response.status_code}"}

        data = response.json()
        
        if "data" not in data:
            logger.error(f"JSearch API invalid response: {data}")
            return {"error": "Invalid response from JSearch API"}

        jobs = []

        for job in data.get("data", []):
            # Ensure we have a valid apply link for real job applications
            apply_link = job.get("job_apply_link")
            if not apply_link:
                # Fallback to job link if apply link is not available
                apply_link = job.get("job_link", "#")
            
            # Format location to include country if available
            location_parts = []
            if job.get("job_city"):
                location_parts.append(job.get("job_city"))
            if job.get("job_country"):
                location_parts.append(job.get("job_country"))
            location = ", ".join(location_parts) if location_parts else "Remote"
            
            job_data = {
                "title": job.get("job_title", "Unknown Position"),
                "company": job.get("employer_name", "Unknown Company"),
                "location": location,
                "salary": job.get("job_salary", "Not specified"),
                "apply_link": apply_link,
                "description": job.get("job_description", "No description available"),
                "source": job.get("job_publisher", "Unknown Source"),
                "logo": job.get("employer_logo", ""),
                "job_type": job.get("job_employment_type", "Not specified"),
                "posted_date": job.get("job_posted_at_timestamp", ""),
                "is_remote": job.get("job_is_remote", False),
            }
            jobs.append(job_data)

        logger.info(f"Successfully fetched {len(jobs)} jobs from JSearch API")
        return jobs

    except requests.exceptions.RequestException as e:
        logger.error(f"JSearch API request failed: {e}")
        return {"error": f"Network error: {str(e)}"}
    except Exception as e:
        logger.error(f"Unexpected error in JSearch service: {e}")
        return {"error": f"Unexpected error: {str(e)}"}
