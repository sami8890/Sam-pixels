from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.middleware.csrf import get_token
from django.utils import timezone
from django_ratelimit.decorators import ratelimit
import json
import logging

from .models import User, LoginAttempt, UserSession
from subscriptions.models import Subscription, SubscriptionPlan

logger = logging.getLogger(__name__)

def get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

@method_decorator(csrf_exempt, name='dispatch')
@method_decorator(ratelimit(key='ip', rate='5/m', method='POST'), name='post')
class LoginView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            email = data.get('email', '').lower().strip()
            password = data.get('password', '')
            
            if not email or not password:
                return JsonResponse({
                    'error': 'Email and password are required'
                }, status=400)
            
            # Get client info
            ip_address = get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            
            # Authenticate user
            user = authenticate(request, username=email, password=password)
            
            if user is not None:
                if user.is_active:
                    login(request, user)
                    
                    # Update last login info
                    user.last_login = timezone.now()
                    user.last_login_ip = ip_address
                    user.save()
                    
                    # Create session record
                    UserSession.objects.create(
                        user=user,
                        session_key=request.session.session_key,
                        ip_address=ip_address,
                        user_agent=user_agent
                    )
                    
                    # Log successful login
                    LoginAttempt.objects.create(
                        email=email,
                        ip_address=ip_address,
                        success=True,
                        user_agent=user_agent
                    )
                    
                    # Get user data with subscription
                    subscription = user.subscription
                    user_data = {
                        'id': str(user.id),
                        'email': user.email,
                        'name': user.name,
                        'subscription': {
                            'plan': subscription.plan.name if subscription else 'free',
                            'status': subscription.status if subscription else 'inactive',
                            'expiresAt': subscription.current_period_end.isoformat() if subscription else None,
                            'features': subscription.plan.get_features_list() if subscription else []
                        },
                        'profile': {
                            'avatar': user.avatar.url if user.avatar else None,
                            'createdAt': user.created_at.isoformat(),
                            'lastLogin': user.last_login.isoformat() if user.last_login else None
                        },
                        'dailyLimits': user.daily_limits
                    }
                    
                    return JsonResponse({
                        'success': True,
                        'user': user_data
                    })
                else:
                    return JsonResponse({
                        'error': 'Account is disabled'
                    }, status=403)
            else:
                # Log failed login
                LoginAttempt.objects.create(
                    email=email,
                    ip_address=ip_address,
                    success=False,
                    user_agent=user_agent
                )
                
                return JsonResponse({
                    'error': 'Invalid email or password'
                }, status=401)
                
        except json.JSONDecodeError:
            return JsonResponse({
                'error': 'Invalid JSON data'
            }, status=400)
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return JsonResponse({
                'error': 'An error occurred during login'
            }, status=500)

@method_decorator(csrf_exempt, name='dispatch')
@method_decorator(ratelimit(key='ip', rate='3/m', method='POST'), name='post')
class RegisterView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            email = data.get('email', '').lower().strip()
            password = data.get('password', '')
            name = data.get('name', '').strip()
            
            if not all([email, password, name]):
                return JsonResponse({
                    'error': 'Email, password, and name are required'
                }, status=400)
            
            # Validate email format
            if '@' not in email or '.' not in email:
                return JsonResponse({
                    'error': 'Invalid email format'
                }, status=400)
            
            # Check if user already exists
            if User.objects.filter(email=email).exists():
                return JsonResponse({
                    'error': 'User with this email already exists'
                }, status=409)
            
            # Validate password strength
            if len(password) < 8:
                return JsonResponse({
                    'error': 'Password must be at least 8 characters long'
                }, status=400)
            
            # Create user
            user = User.objects.create_user(
                email=email,
                password=password,
                name=name
            )
            
            # Create free subscription
            free_plan = SubscriptionPlan.objects.get(name='free')
            Subscription.objects.create(
                user=user,
                plan=free_plan,
                current_period_start=timezone.now(),
                current_period_end=timezone.now() + timezone.timedelta(days=365)  # Free plan lasts 1 year
            )
            
            # Log in the user
            login(request, user)
            
            # Get client info
            ip_address = get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            
            # Create session record
            UserSession.objects.create(
                user=user,
                session_key=request.session.session_key,
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            # Log successful registration
            LoginAttempt.objects.create(
                email=email,
                ip_address=ip_address,
                success=True,
                user_agent=user_agent
            )
            
            # Return user data
            subscription = user.subscription
            user_data = {
                'id': str(user.id),
                'email': user.email,
                'name': user.name,
                'subscription': {
                    'plan': subscription.plan.name,
                    'status': subscription.status,
                    'expiresAt': subscription.current_period_end.isoformat(),
                    'features': subscription.plan.get_features_list()
                },
                'profile': {
                    'avatar': None,
                    'createdAt': user.created_at.isoformat(),
                    'lastLogin': user.last_login.isoformat() if user.last_login else None
                },
                'dailyLimits': user.daily_limits
            }
            
            return JsonResponse({
                'success': True,
                'user': user_data
            })
            
        except json.JSONDecodeError:
            return JsonResponse({
                'error': 'Invalid JSON data'
            }, status=400)
        except Exception as e:
            logger.error(f"Registration error: {str(e)}")
            return JsonResponse({
                'error': 'An error occurred during registration'
            }, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class LogoutView(View):
    def post(self, request):
        if request.user.is_authenticated:
            # Deactivate session record
            UserSession.objects.filter(
                user=request.user,
                session_key=request.session.session_key
            ).update(is_active=False)
            
            logout(request)
        
        return JsonResponse({'success': True})

@login_required
def me_view(request):
    """Get current user information"""
    user = request.user
    subscription = user.subscription
    
    user_data = {
        'id': str(user.id),
        'email': user.email,
        'name': user.name,
        'subscription': {
            'plan': subscription.plan.name if subscription else 'free',
            'status': subscription.status if subscription else 'inactive',
            'expiresAt': subscription.current_period_end.isoformat() if subscription else None,
            'features': subscription.plan.get_features_list() if subscription else []
        },
        'profile': {
            'avatar': user.avatar.url if user.avatar else None,
            'createdAt': user.created_at.isoformat(),
            'lastLogin': user.last_login.isoformat() if user.last_login else None
        },
        'dailyLimits': user.daily_limits
    }
    
    return JsonResponse(user_data)

def csrf_token_view(request):
    """Get CSRF token for frontend"""
    return JsonResponse({
        'csrfToken': get_token(request)
    })