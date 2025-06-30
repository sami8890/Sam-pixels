from django.db import models
from django.utils import timezone
from accounts.models import User
import uuid

class SubscriptionPlan(models.Model):
    PLAN_TYPES = [
        ('free', 'Free'),
        ('starter', 'Starter'),
        ('pro', 'Pro'),
        ('enterprise', 'Enterprise'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, choices=PLAN_TYPES, unique=True)
    display_name = models.CharField(max_length=100)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    billing_period = models.CharField(max_length=20, default='monthly')
    stripe_price_id = models.CharField(max_length=100, blank=True)
    
    # Feature limits
    monthly_processing_limit = models.IntegerField(null=True, blank=True)  # None = unlimited
    max_file_size_mb = models.IntegerField(default=5)
    max_resolution = models.CharField(max_length=20, default='HD')
    
    # Feature flags
    background_removal = models.BooleanField(default=True)
    image_upscaling = models.BooleanField(default=True)
    text_watermark = models.BooleanField(default=False)
    crop_resize = models.BooleanField(default=False)
    batch_processing = models.BooleanField(default=False)
    api_access = models.BooleanField(default=False)
    white_label = models.BooleanField(default=False)
    priority_support = models.BooleanField(default=False)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'subscription_plans'
        ordering = ['price']
    
    def __str__(self):
        return self.display_name
    
    def get_features_list(self):
        """Return list of available features"""
        features = []
        if self.background_removal:
            features.append('Background Removal')
        if self.image_upscaling:
            features.append('Image Upscaling')
        if self.text_watermark:
            features.append('Text Watermark')
        if self.crop_resize:
            features.append('Crop & Resize')
        if self.batch_processing:
            features.append('Batch Processing')
        if self.api_access:
            features.append('API Access')
        if self.white_label:
            features.append('White Label')
        if self.priority_support:
            features.append('Priority Support')
        return features

class Subscription(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('cancelled', 'Cancelled'),
        ('past_due', 'Past Due'),
        ('unpaid', 'Unpaid'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscriptions')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.CASCADE)
    
    stripe_subscription_id = models.CharField(max_length=100, blank=True)
    stripe_customer_id = models.CharField(max_length=100, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    current_period_start = models.DateTimeField()
    current_period_end = models.DateTimeField()
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'subscriptions'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.plan.display_name}"
    
    @property
    def is_active(self):
        return self.status == 'active' and self.current_period_end > timezone.now()
    
    @property
    def days_remaining(self):
        if self.is_active:
            return (self.current_period_end - timezone.now()).days
        return 0

class PaymentHistory(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('succeeded', 'Succeeded'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='payments')
    
    stripe_payment_intent_id = models.CharField(max_length=100, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payment_history'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - ${self.amount} - {self.status}"