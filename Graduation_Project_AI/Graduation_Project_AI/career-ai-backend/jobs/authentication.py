"""
Custom authentication for Career AI Connected
Handles JWT token authentication from simple job server
"""

from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.models import User
from django.conf import settings
import jwt
from datetime import datetime, timedelta


class SimpleJWTAuthentication(BaseAuthentication):
    """
    Custom JWT authentication that works with the simple job server tokens
    """
    
    def authenticate(self, request):
        """
        Authenticate the request and return a two-tuple of (user, token).
        """
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        
        if not auth_header:
            return None
            
        try:
            # Extract token from "Bearer <token>" format
            prefix, token = auth_header.split(' ')
            if prefix.lower() != 'bearer':
                return None
        except ValueError:
            return None
        
        try:
            # For mock JWT tokens from simple job server, we'll use a simple approach
            # In production, this would use proper JWT validation
            if token == 'mock-jwt-access-token-12345':
                # Return a mock user for development
                try:
                    user = User.objects.get(username='testuser')
                except User.DoesNotExist:
                    # Create a test user if it doesn't exist
                    user = User.objects.create_user(
                        username='testuser',
                        email='testuser@example.com',
                        first_name='Test',
                        last_name='User'
                    )
                return (user, token)
            else:
                # Try to decode as real JWT
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
                user = User.objects.get(id=payload['user_id'])
                return (user, token)
                
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Invalid token')
        except User.DoesNotExist:
            raise AuthenticationFailed('User not found')
        except Exception as e:
            # For development, allow mock tokens
            if token.startswith('mock-'):
                try:
                    user = User.objects.get(username='mockuser')
                except User.DoesNotExist:
                    user = User.objects.create_user(
                        username='mockuser',
                        email='mockuser@example.com',
                        first_name='Mock',
                        last_name='User'
                    )
                return (user, token)
            else:
                raise AuthenticationFailed(f'Authentication failed: {str(e)}')
    
    def authenticate_header(self, request):
        """
        Return a string to be used as the value of the `WWW-Authenticate`
        header in a `401 Unauthenticated` response.
        """
        return 'Bearer'
