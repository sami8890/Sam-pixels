# Django Backend Setup Guide

## Prerequisites

1. **Python 3.9+** installed
2. **PostgreSQL** database
3. **Redis** server (for caching and sessions)

## Installation Steps

### 1. Create Virtual Environment

```bash
cd backend
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Environment Configuration

Create a `.env` file in the `backend` directory:

```env
# Django Settings
SECRET_KEY=your-super-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=sampixel
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379/0

# Email (for production)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
DEFAULT_FROM_EMAIL=noreply@sampixel.com

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_51RfY8L4Fdg6FLS0ShOSrboNFOl64dIugx1hNbiVi2GdKffs1RkC4z4eHVCBJvlTsVCSWEz8LFVPWG26ZsVwuOahT001XX9mMAO
STRIPE_SECRET_KEY=sk_test_51RfY8L4Fdg6FLS0S...
STRIPE_WEBHOOK_SECRET=whsec_...

# External APIs
REMOVEBG_API_KEY=9KxAS5jyWWAZW7vEgyA1FP64
CLIPDROP_API_KEY=5a5c65e37f3ea3229ab84d42bff19bd984e54499957d081f35437479bb41ff1f1d216d2e2e4692251fdf43228df85aa6
REPLICATE_API_TOKEN=your_replicate_token
IMGBB_API_KEY=d971bd5bb19eba768ac8c1e9a36cfc2b
OCR_SPACE_API_KEY=your_ocr_space_key

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AWS S3 (for production file storage)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_STORAGE_BUCKET_NAME=sampixel-storage
AWS_S3_REGION_NAME=us-east-1
```

### 4. Database Setup

```bash
# Create PostgreSQL database
createdb sampixel

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create subscription plans
python manage.py shell
```

In the Django shell, create the subscription plans:

```python
from subscriptions.models import SubscriptionPlan

# Free Plan
SubscriptionPlan.objects.create(
    name='free',
    display_name='Free',
    description='Basic image processing with daily limits',
    price=0,
    monthly_processing_limit=None,  # Will be handled by daily limits
    max_file_size_mb=5,
    background_removal=True,
    image_upscaling=True,
    text_watermark=False,
    crop_resize=False
)

# Starter Plan
SubscriptionPlan.objects.create(
    name='starter',
    display_name='Starter',
    description='100 image processes per month with all AI tools',
    price=9,
    stripe_price_id='price_1RfYRy4Fdg6FLS0S1XOJSWqZ',
    monthly_processing_limit=100,
    max_file_size_mb=10,
    background_removal=True,
    image_upscaling=True,
    text_watermark=True,
    crop_resize=True
)

# Pro Plan
SubscriptionPlan.objects.create(
    name='pro',
    display_name='Pro',
    description='Unlimited image processing with all premium features',
    price=19,
    stripe_price_id='price_1RfYT74Fdg6FLS0SNbcOIZ1p',
    monthly_processing_limit=None,  # Unlimited
    max_file_size_mb=50,
    background_removal=True,
    image_upscaling=True,
    text_watermark=True,
    crop_resize=True,
    batch_processing=True,
    api_access=True,
    priority_support=True
)

# Enterprise Plan
SubscriptionPlan.objects.create(
    name='enterprise',
    display_name='Enterprise',
    description='Everything in Pro plus white-label and team features',
    price=49,
    stripe_price_id='price_1RfYUC4Fdg6FLS0SVhIgjR9x',
    monthly_processing_limit=None,  # Unlimited
    max_file_size_mb=100,
    background_removal=True,
    image_upscaling=True,
    text_watermark=True,
    crop_resize=True,
    batch_processing=True,
    api_access=True,
    white_label=True,
    priority_support=True
)

exit()
```

### 5. Create Superuser

```bash
python manage.py createsuperuser
```

### 6. Run Development Server

```bash
python manage.py runserver 8000
```

## Security Features Implemented

### 1. **Secure Authentication**
- JWT tokens with refresh mechanism
- Session-based authentication with httpOnly cookies
- Rate limiting on login/register endpoints
- Login attempt tracking
- IP address and user agent logging

### 2. **Subscription Security**
- Role-based access control
- Feature-level permissions
- Usage tracking and limits
- Secure payment processing with Stripe

### 3. **Data Protection**
- CSRF protection
- SQL injection prevention (Django ORM)
- XSS protection
- Secure file uploads with validation
- Encrypted sensitive data storage

### 4. **API Security**
- Rate limiting
- Request/response logging
- Error handling without information leakage
- CORS configuration

## Frontend Integration

Update your frontend `.env` file to point to the Django backend:

```env
# Add to your frontend .env
VITE_API_BASE_URL=http://localhost:8000/api
```

## Production Deployment

For production deployment:

1. Set `DEBUG=False`
2. Configure proper `ALLOWED_HOSTS`
3. Use PostgreSQL with SSL
4. Set up Redis with authentication
5. Configure AWS S3 for file storage
6. Set up SSL certificates
7. Use environment variables for all secrets
8. Configure logging and monitoring

## API Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `GET /api/auth/csrf-token` - Get CSRF token
- `GET /api/library` - Get user's library items
- `POST /api/processing/background-removal` - Process background removal
- `POST /api/processing/upscaling` - Process image upscaling
- `POST /api/subscriptions/upgrade` - Upgrade subscription

The backend provides secure, scalable authentication and subscription management for your SamPixel application.