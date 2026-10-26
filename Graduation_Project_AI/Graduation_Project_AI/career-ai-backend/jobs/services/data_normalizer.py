import re
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class JobDataNormalizer:
    """
    Service to normalize job data from different sources (Adzuna, Remotive, Arbeitnow, JSearch)
    """
    
    def __init__(self):
        # Common job title mappings
        self.title_mappings = {
            # Seniority levels
            'sr': 'senior',
            'jr': 'junior',
            'sr.': 'senior',
            'jr.': 'junior',
            'mid': 'mid-level',
            'mid-level': 'mid-level',
            'entry level': 'entry-level',
            'entry-level': 'entry-level',
            
            # Common variations
            'software developer': 'software engineer',
            'software dev': 'software engineer',
            'dev': 'software engineer',
            'programmer': 'software engineer',
            'coder': 'software engineer',
            
            'full stack developer': 'full stack engineer',
            'fullstack developer': 'full stack engineer',
            'full-stack developer': 'full stack engineer',
            
            'front end developer': 'frontend developer',
            'frontend dev': 'frontend developer',
            'front-end developer': 'frontend developer',
            
            'back end developer': 'backend developer',
            'backend dev': 'backend developer',
            'back-end developer': 'backend developer',
            
            'data analyst': 'data analyst',
            'data scientist': 'data scientist',
            'ml engineer': 'machine learning engineer',
            'machine learning engineer': 'machine learning engineer',
            
            'product manager': 'product manager',
            'pm': 'product manager',
            
            'ux designer': 'ux designer',
            'ui designer': 'ui designer',
            'ux/ui designer': 'ux designer',
            
            'devops engineer': 'devops engineer',
            'dev ops engineer': 'devops engineer',
            
            'qa engineer': 'qa engineer',
            'quality assurance engineer': 'qa engineer',
            
            'sre': 'site reliability engineer',
            'site reliability engineer': 'site reliability engineer',
        }
        
        # Company name cleanup patterns
        self.company_cleanup_patterns = [
            r'\s+at\s+',  # Remove "at" in company names
            r'\s+inc\.?',  # Remove "inc" variations
            r'\s+llc\.?',  # Remove "llc" variations
            r'\s+ltd\.?',  # Remove "ltd" variations
            r'\s+corp\.?',  # Remove "corp" variations
            r'\s+limited',  # Remove "limited"
            r'\s+gmbh',  # Remove "gmbh"
            r'\s+co\.?',  # Remove "co" variations
        ]
        
        # Location normalization
        self.location_mappings = {
            # Country mappings
            'usa': 'United States',
            'uk': 'United Kingdom',
            'gb': 'United Kingdom',
            'ca': 'Canada',
            'au': 'Australia',
            'de': 'Germany',
            'fr': 'France',
            'es': 'Spain',
            'it': 'Italy',
            'nl': 'Netherlands',
            
            # City mappings
            'nyc': 'New York',
            'sf': 'San Francisco',
            'la': 'Los Angeles',
            'chi': 'Chicago',
            'dc': 'Washington DC',
            'london': 'London',
            'berlin': 'Berlin',
            'paris': 'Paris',
            'tokyo': 'Tokyo',
            'sydney': 'Sydney',
            'toronto': 'Toronto',
            'vancouver': 'Vancouver',
            'montreal': 'Montreal',
        }
        
        # Job type mappings
        self.job_type_mappings = {
            'full-time': 'full-time',
            'full time': 'full-time',
            'fulltime': 'full-time',
            'ft': 'full-time',
            
            'part-time': 'part-time',
            'part time': 'part-time',
            'parttime': 'part-time',
            'pt': 'part-time',
            
            'contract': 'contract',
            'contractor': 'contract',
            'temporary': 'contract',
            
            'internship': 'internship',
            'intern': 'internship',
            
            'remote': 'remote',
            'work from home': 'remote',
            'wfh': 'remote',
            'telecommute': 'remote',
            
            'hybrid': 'hybrid',
            'mixed': 'hybrid',
        }
    
    def normalize_job_data(self, job_data: Dict[str, Any], source: str) -> Dict[str, Any]:
        """
        Normalize job data from any source
        """
        try:
            normalized = job_data.copy()
            
            # Normalize title
            normalized['title'] = self.normalize_title(job_data.get('title', ''))
            
            # Normalize company
            normalized['company'] = self.normalize_company(job_data.get('company', ''))
            
            # Normalize location
            normalized['location'] = self.normalize_location(job_data.get('location', ''))
            
            # Normalize description
            normalized['description'] = self.normalize_description(job_data.get('description', ''))
            
            # Normalize job type
            normalized['job_type'] = self.normalize_job_type(job_data.get('job_type', ''))
            
            # Normalize remote type
            normalized['remote_type'] = self.normalize_remote_type(
                job_data.get('job_type', ''),
                job_data.get('title', ''),
                job_data.get('description', '')
            )
            
            # Normalize salary
            normalized['salary'] = self.normalize_salary(job_data.get('salary', ''))
            
            # Validate apply URL
            normalized['apply_url'] = self.validate_apply_url(job_data.get('apply_url', ''))
            
            # Add source-specific normalizations
            normalized = self.apply_source_specific_normalization(normalized, source)
            
            logger.debug(f"Normalized job data for {source}: {normalized['title']} at {normalized['company']}")
            return normalized
            
        except Exception as e:
            logger.error(f"Error normalizing job data: {str(e)}")
            return job_data
    
    def normalize_title(self, title: str) -> str:
        """Normalize job title"""
        if not title:
            return 'Unknown Position'
        
        # Convert to lowercase for processing
        title_lower = title.lower().strip()
        
        # Apply title mappings
        for old, new in self.title_mappings.items():
            if old in title_lower:
                title_lower = title_lower.replace(old, new)
        
        # Capitalize properly
        normalized_title = ' '.join(word.capitalize() for word in title_lower.split())
        
        # Remove extra whitespace
        normalized_title = re.sub(r'\s+', ' ', normalized_title).strip()
        
        return normalized_title
    
    def normalize_company(self, company: str) -> str:
        """Normalize company name"""
        if not company:
            return 'Unknown Company'
        
        # Convert to lowercase for processing
        company_lower = company.lower().strip()
        
        # Apply cleanup patterns
        for pattern in self.company_cleanup_patterns:
            company_lower = re.sub(pattern, '', company_lower)
        
        # Remove extra whitespace
        company_lower = re.sub(r'\s+', ' ', company_lower).strip()
        
        # Capitalize properly
        normalized_company = ' '.join(word.capitalize() for word in company_lower.split())
        
        return normalized_company
    
    def normalize_location(self, location: str) -> str:
        """Normalize location"""
        if not location:
            return 'Remote'
        
        # Convert to lowercase for processing
        location_lower = location.lower().strip()
        
        # Apply location mappings
        for old, new in self.location_mappings.items():
            if old in location_lower:
                location_lower = location_lower.replace(old, new)
        
        # Capitalize properly
        normalized_location = ' '.join(word.capitalize() for word in location_lower.split())
        
        # Remove extra whitespace
        normalized_location = re.sub(r'\s+', ' ', normalized_location).strip()
        
        return normalized_location
    
    def normalize_description(self, description: str) -> str:
        """Normalize job description"""
        if not description:
            return 'No description available'
        
        # Remove HTML tags
        clean_desc = re.sub(r'<[^>]+>', '', description)
        
        # Remove excessive whitespace
        clean_desc = re.sub(r'\s+', ' ', clean_desc).strip()
        
        # Remove special characters
        clean_desc = re.sub(r'&[a-zA-Z0-9#]+;', '', clean_desc)
        
        # Remove common junk
        clean_desc = re.sub(r'[\r\n\t]', ' ', clean_desc)
        
        # Limit length
        if len(clean_desc) > 2000:
            clean_desc = clean_desc[:2000] + '...'
        
        return clean_desc.strip()
    
    def normalize_job_type(self, job_type: str) -> str:
        """Normalize job type"""
        if not job_type:
            return ''
        
        # Convert to lowercase for processing
        job_type_lower = job_type.lower().strip()
        
        # Apply job type mappings
        for old, new in self.job_type_mappings.items():
            if old in job_type_lower:
                job_type_lower = new
                break
        
        return job_type_lower
    
    def normalize_remote_type(self, job_type: str, title: str, description: str) -> str:
        """Determine remote type from job data"""
        # Check for remote indicators
        remote_indicators = ['remote', 'work from home', 'wfh', 'telecommute', 'hybrid']
        
        # Check title
        title_lower = title.lower()
        for indicator in remote_indicators:
            if indicator in title_lower:
                return 'remote' if indicator != 'hybrid' else 'hybrid'
        
        # Check job type
        job_type_lower = job_type.lower()
        for indicator in remote_indicators:
            if indicator in job_type_lower:
                return 'remote' if indicator != 'hybrid' else 'hybrid'
        
        # Check description
        desc_lower = description.lower()
        for indicator in remote_indicators:
            if indicator in desc_lower:
                return 'remote' if indicator != 'hybrid' else 'hybrid'
        
        return ''
    
    def normalize_salary(self, salary: str) -> str:
        """Normalize salary information"""
        if not salary:
            return ''
        
        # Remove extra whitespace
        salary = re.sub(r'\s+', ' ', salary).strip()
        
        # Standardize currency symbols
        salary = re.sub(r'[$£]', '$', salary)
        
        # Standardize salary format
        salary = re.sub(r'(\d+)\s*-\s*(\d+)', r'$\1 - $\2', salary)
        
        return salary
    
    def validate_apply_url(self, apply_url: str) -> str:
        """Validate and normalize apply URL"""
        if not apply_url or apply_url == '#':
            return ''
        
        # Ensure URL starts with http
        if not apply_url.startswith(('http://', 'https://')):
            if apply_url.startswith('www.'):
                apply_url = 'https://' + apply_url
            else:
                apply_url = 'https://' + apply_url
        
        return apply_url
    
    def apply_source_specific_normalization(self, job_data: Dict[str, Any], source: str) -> Dict[str, Any]:
        """Apply source-specific normalizations"""
        if source.lower() == 'adzuna':
            # Adzuna-specific normalizations
            job_data = self._normalize_adzuna_data(job_data)
        elif source.lower() == 'remotive':
            # Remotive-specific normalizations
            job_data = self._normalize_remotive_data(job_data)
        elif source.lower() == 'arbeitnow':
            # Arbeitnow-specific normalizations
            job_data = self._normalize_arbeitnow_data(job_data)
        elif source.lower() == 'jsearch':
            # JSearch-specific normalizations
            job_data = self._normalize_jsearch_data(job_data)
        
        return job_data
    
    def _normalize_adzuna_data(self, job_data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize Adzuna-specific data"""
        # Adzuna often has salary_min, salary_max, salary_currency
        if 'salary_min' in job_data or 'salary_max' in job_data:
            salary_min = job_data.get('salary_min', 0)
            salary_max = job_data.get('salary_max', 0)
            currency = job_data.get('salary_currency', 'USD')
            
            if salary_min and salary_max:
                job_data['salary'] = f"{currency} {salary_min:,.0f} - {salary_max:,.0f}"
            elif salary_max:
                job_data['salary'] = f"Up to {currency} {salary_max:,.0f}"
            elif salary_min:
                job_data['salary'] = f"From {currency} {salary_min:,.0f}"
        
        return job_data
    
    def _normalize_remotive_data(self, job_data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize Remotive-specific data"""
        # Remotive jobs are typically remote
        if not job_data.get('remote_type'):
            job_data['remote_type'] = 'remote'
        
        return job_data
    
    def _normalize_arbeitnow_data(self, job_data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize Arbeitnow-specific data"""
        # Arbeitnow is Germany-focused, might need location normalization
        location = job_data.get('location', '')
        if location and 'de' not in location.lower():
            job_data['location'] = f"{location}, Germany"
        
        return job_data
    
    def _normalize_jsearch_data(self, job_data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize JSearch-specific data"""
        # JSearch might have different field names
        if 'job_description' in job_data:
            job_data['description'] = job_data['job_description']
        
        if 'job_employment_type' in job_data:
            job_data['job_type'] = job_data['job_employment_type']
        
        return job_data


# Convenience function for easy import
def normalize_job_data(job_data: Dict[str, Any], source: str) -> Dict[str, Any]:
    """Convenience function to normalize job data"""
    normalizer = JobDataNormalizer()
    return normalizer.normalize_job_data(job_data, source)
