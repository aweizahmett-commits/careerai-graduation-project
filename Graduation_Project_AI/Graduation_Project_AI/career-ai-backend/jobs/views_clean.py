import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)

class JobListView(APIView):
    """
    Minimal API endpoint to test basic functionality
    GET /api/jobs/
    """
    permission_classes = []  # Allow public access
    
    def get(self, request):
        """Minimal test endpoint"""
        try:
            logger.info("JobListView.get() called successfully")
            return Response({
                'message': 'Job list view working',
                'status': 'success',
                'test': True
            })
        except Exception as e:
            logger.error(f"Error in minimal JobListView: {str(e)}")
            return Response({
                'error': 'Failed to fetch jobs',
                'details': str(e),
                'test': False
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
