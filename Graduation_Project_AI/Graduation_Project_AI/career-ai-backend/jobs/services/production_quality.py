import logging
from datetime import datetime, timedelta
from django.db.models import Q, Count, Case, When, Value, IntegerField, F
from ..models import AggregatedJob
from .data_normalizer import normalize_job_data

logger = logging.getLogger(__name__)

class ProductionQualityService:
    """
    Service to ensure production-level quality and reliability of job listings
    """
    
    def __init__(self):
        # List of big companies to boost in search results
        self.big_companies = [
            'google', 'alphabet', 'amazon', 'microsoft', 'apple', 'meta', 'facebook',
            'netflix', 'tesla', 'spotify', 'uber', 'lyft', 'airbnb', 'linkedin',
            'twitter', 'instagram', 'tiktok', 'snapchat', 'discord', 'slack',
            'adobe', 'salesforce', 'oracle', 'sap', 'ibm', 'intel', 'nvidia',
            'amd', 'qualcomm', 'broadcom', 'cisco', 'juniper', 'palo alto',
            'vmware', 'red hat', 'canonical', 'docker', 'kubernetes', 'hashicorp',
            'twilio', 'stripe', 'paypal', 'square', 'block', 'coinbase', 'binance',
            'robinhood', 'plaid', 'brex', 'ramp', 'notion', 'airtable', 'figma',
            'canva', 'zoom', 'webex', 'teams', 'slack', 'dropbox', 'box',
            'github', 'gitlab', 'bitbucket', 'atlassian', 'jira', 'confluence',
            'microsoft', 'office', 'azure', 'aws', 'gcp', 'oracle cloud'
        ]
        
        # Minimum description length to filter out low-quality jobs
        self.min_description_length = 50
        
        # Maximum description length to avoid extremely long descriptions
        self.max_description_length = 5000
    
    def filter_high_quality_jobs(self, queryset):
        """
        Filter out low-quality jobs with invalid apply_url or short descriptions
        """
        logger.info("Filtering high-quality jobs")
        
        # Filter out jobs with invalid apply_url
        queryset = queryset.exclude(
            Q(apply_url__isnull=True) |
            Q(apply_url='') |
            Q(apply_url='#') |
            Q(apply_url__icontains='example.com') |
            Q(apply_url__icontains='test.com') |
            Q(apply_url__icontains='localhost') |
            Q(apply_url__icontains='127.0.0.1')
        )
        
        # Filter out jobs with short descriptions
        queryset = queryset.exclude(
            Q(description__isnull=True) |
            Q(description='')
        )
        
        # Filter out jobs with extremely long descriptions (likely spam)
        # Note: Django doesn't support length__gt for TextField, so we'll handle this in Python
        filtered_jobs = []
        for job in queryset:
            if job.description and len(job.description) >= self.min_description_length and len(job.description) <= self.max_description_length:
                filtered_jobs.append(job.id)
        
        queryset = queryset.filter(id__in=filtered_jobs)
        
        # Filter out jobs with placeholder text
        placeholder_patterns = [
            'no description available',
            'description not available',
            'no description provided',
            'tbd',
            'to be determined',
            'coming soon',
            'more details soon'
        ]
        
        placeholder_query = Q()
        for pattern in placeholder_patterns:
            placeholder_query |= Q(description__icontains=pattern)
        
        queryset = queryset.exclude(placeholder_query)
        
        # Filter out jobs with generic titles
        generic_titles = [
            'job', 'position', 'role', 'opportunity', 'opening', 'vacancy',
            'hiring', 'recruiting', 'now hiring', 'immediate hire'
        ]
        
        title_query = Q()
        for title in generic_titles:
            title_query |= Q(title__iexact=title)
        
        queryset = queryset.exclude(title_query)
        
        # Filter out jobs with generic companies
        generic_companies = [
            'company', 'organization', 'firm', 'agency', 'consultant',
            'private', 'confidential', 'anonymous', 'undisclosed'
        ]
        
        company_query = Q()
        for company in generic_companies:
            company_query |= Q(company__iexact=company)
        
        queryset = queryset.exclude(company_query)
        
        filtered_count = queryset.count()
        logger.info(f"Filtered to {filtered_count} high-quality jobs")
        
        return queryset
    
    def remove_duplicates(self, queryset):
        """
        Remove duplicates across all APIs using normalized title + company
        """
        logger.info("Removing duplicate jobs")
        
        # Get all jobs and group by normalized title + company
        jobs = list(queryset)
        seen_jobs = set()
        unique_jobs = []
        duplicate_count = 0
        
        for job in jobs:
            # Normalize title and company for comparison
            normalized_title = self._normalize_text(job.title)
            normalized_company = self._normalize_text(job.company)
            
            # Create unique key
            unique_key = (normalized_title, normalized_company)
            
            if unique_key not in seen_jobs:
                seen_jobs.add(unique_key)
                unique_jobs.append(job)
            else:
                duplicate_count += 1
                logger.debug(f"Duplicate found: {job.title} at {job.company}")
        
        logger.info(f"Removed {duplicate_count} duplicate jobs")
        
        # Return queryset with unique jobs
        unique_job_ids = [job.id for job in unique_jobs]
        return queryset.filter(id__in=unique_job_ids)
    
    def _normalize_text(self, text):
        """
        Normalize text for duplicate detection
        """
        if not text:
            return ""
        
        # Convert to lowercase and remove extra whitespace
        normalized = text.lower().strip()
        
        # Remove common suffixes and prefixes
        suffixes_to_remove = ['inc', 'llc', 'ltd', 'corp', 'corporation', 'company', 'co']
        for suffix in suffixes_to_remove:
            normalized = normalized.replace(f' {suffix}', '').replace(f'{suffix} ', '')
        
        # Remove punctuation and extra spaces
        import re
        normalized = re.sub(r'[^\w\s]', '', normalized)
        normalized = re.sub(r'\s+', ' ', normalized)
        
        return normalized.strip()
    
    def add_recent_jobs_filter(self, queryset, days=7):
        """
        Add filter for recent jobs (last 7 days)
        """
        logger.info(f"Filtering recent jobs from last {days} days")
        
        cutoff_date = datetime.now() - timedelta(days=days)
        recent_queryset = queryset.filter(created_at__gte=cutoff_date)
        
        recent_count = recent_queryset.count()
        logger.info(f"Found {recent_count} recent jobs from last {days} days")
        
        return recent_queryset
    
    def boost_big_companies(self, queryset):
        """
        Boost big companies (Google, Amazon, Microsoft) in search results
        """
        logger.info("Boosting big companies in search results")
        
        # Create boost query for big companies
        boost_query = Q()
        for company in self.big_companies:
            boost_query |= Q(company__icontains=company)
        
        # Annotate with boost score
        queryset = queryset.annotate(
            company_boost=Case(
                When(boost_query, then=Value(2)),
                default=Value(0),
                output_field=IntegerField(),
            )
        )
        
        boosted_count = queryset.filter(company_boost=2).count()
        logger.info(f"Boosted {boosted_count} jobs from big companies")
        
        return queryset
    
    def calculate_relevance_score(self, queryset, search_query="", skills="", location=""):
        """
        Improve relevance scoring for job search
        """
        logger.info("Calculating relevance scores for jobs")
        
        # Initialize base score
        queryset = queryset.annotate(
            relevance_score=Value(0, output_field=IntegerField())
        )
        
        # Title match scoring (highest weight)
        if search_query:
            search_terms = search_query.split()
            for term in search_terms:
                if len(term) > 2:  # Skip very short terms
                    queryset = queryset.annotate(
                        relevance_score=F('relevance_score') + Case(
                            When(title__icontains=term, then=Value(10)),
                            default=Value(0),
                            output_field=IntegerField(),
                        )
                    )
        
        # Skills match scoring
        if skills:
            skill_terms = skills.split()
            for skill in skill_terms:
                if len(skill) > 2:
                    queryset = queryset.annotate(
                        relevance_score=F('relevance_score') + Case(
                            When(description__icontains=skill, then=Value(5)),
                            When(title__icontains=skill, then=Value(8)),
                            default=Value(0),
                            output_field=IntegerField(),
                        )
                    )
        
        # Location match scoring
        if location:
            location_terms = location.split()
            for term in location_terms:
                if len(term) > 2:
                    queryset = queryset.annotate(
                        relevance_score=F('relevance_score') + Case(
                            When(location__icontains=term, then=Value(3)),
                            default=Value(0),
                            output_field=IntegerField(),
                        )
                    )
        
        # Company boost scoring is handled separately in boost_big_companies method
        # This method focuses on search relevance scoring only
        
        # Recent job boost (jobs posted in last 7 days)
        recent_cutoff = datetime.now() - timedelta(days=7)
        queryset = queryset.annotate(
            relevance_score=F('relevance_score') + Case(
                When(created_at__gte=recent_cutoff, then=Value(2)),
                default=Value(0),
                output_field=IntegerField(),
            )
        )
        
        # Quality boost (jobs with good descriptions)
        # Note: We can't use length__gte for TextField, so we'll handle this differently
        # For now, we'll skip this boost or use a different approach
        pass
        
        # Log score distribution (avoid filtering on sliced queryset)
        try:
            scored_jobs = queryset.filter(relevance_score__gt=0)
            logger.info(f"Calculated relevance scores for {scored_jobs.count()} jobs")
        except TypeError:
            # If queryset is sliced, just log total count
            logger.info(f"Calculated relevance scores for jobs")
        
        return queryset.order_by('-relevance_score', '-created_at')
    
    def get_production_quality_jobs(self, search_query="", skills="", location="", recent_only=False):
        """
        Get production-quality jobs with all filters and scoring applied
        """
        logger.info("Getting production-quality jobs")
        
        # Start with base queryset
        queryset = AggregatedJob.objects.filter(is_active=True)
        
        # Apply quality filters
        queryset = self.filter_high_quality_jobs(queryset)
        
        # Remove duplicates
        queryset = self.remove_duplicates(queryset)
        
        # Apply recent filter if requested
        if recent_only:
            queryset = self.add_recent_jobs_filter(queryset)
        
        # Boost big companies
        queryset = self.boost_big_companies(queryset)
        
        # Calculate relevance scores
        queryset = self.calculate_relevance_score(queryset, search_query, skills, location)
        
        final_count = queryset.count()
        logger.info(f"Returning {final_count} production-quality jobs")
        
        return queryset
    
    def get_job_quality_metrics(self):
        """
        Get quality metrics for monitoring
        """
        logger.info("Calculating job quality metrics")
        
        total_jobs = AggregatedJob.objects.filter(is_active=True).count()
        
        # Jobs with valid apply URLs
        valid_apply_urls = AggregatedJob.objects.filter(
            is_active=True,
            apply_url__isnull=False
        ).exclude(
            apply_url__in=['', '#']
        ).count()
        
        # Jobs with good descriptions
        good_descriptions = AggregatedJob.objects.filter(
            is_active=True,
            description__length__gte=self.min_description_length
        ).count()
        
        # Recent jobs
        recent_cutoff = datetime.now() - timedelta(days=7)
        recent_jobs = AggregatedJob.objects.filter(
            is_active=True,
            created_at__gte=recent_cutoff
        ).count()
        
        # Big company jobs
        big_company_query = Q()
        for company in self.big_companies:
            big_company_query |= Q(company__icontains=company)
        
        big_company_jobs = AggregatedJob.objects.filter(
            is_active=True
        ).filter(big_company_query).count()
        
        metrics = {
            'total_jobs': total_jobs,
            'valid_apply_urls': valid_apply_urls,
            'good_descriptions': good_descriptions,
            'recent_jobs': recent_jobs,
            'big_company_jobs': big_company_jobs,
            'apply_url_quality': (valid_apply_urls / total_jobs * 100) if total_jobs > 0 else 0,
            'description_quality': (good_descriptions / total_jobs * 100) if total_jobs > 0 else 0,
            'recency_rate': (recent_jobs / total_jobs * 100) if total_jobs > 0 else 0,
            'big_company_rate': (big_company_jobs / total_jobs * 100) if total_jobs > 0 else 0,
        }
        
        logger.info(f"Quality metrics: {metrics}")
        return metrics


# Convenience function for easy import
def get_production_quality_jobs(search_query="", skills="", location="", recent_only=False):
    """
    Convenience function to get production-quality jobs
    """
    service = ProductionQualityService()
    return service.get_production_quality_jobs(search_query, skills, location, recent_only)
