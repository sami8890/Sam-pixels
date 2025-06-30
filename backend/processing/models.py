from django.db import models
from django.utils import timezone
from accounts.models import User
import uuid

class DailyUsage(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='daily_usage')
    date = models.DateField()
    
    # Usage counters
    background_removal_count = models.IntegerField(default=0)
    image_upscaling_count = models.IntegerField(default=0)
    text_watermark_count = models.IntegerField(default=0)
    crop_resize_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'daily_usage'
        unique_together = ['user', 'date']
        indexes = [
            models.Index(fields=['user', 'date']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.date}"
    
    def get_limits_dict(self):
        """Return usage limits based on user's subscription"""
        subscription = self.user.subscription
        if not subscription:
            # Free tier limits
            limits = {
                'background-removal': {'used': self.background_removal_count, 'limit': 10},
                'image-upscaling': {'used': self.image_upscaling_count, 'limit': 5},
                'image-transform': {'used': self.text_watermark_count + self.crop_resize_count, 'limit': 20},
            }
        else:
            plan = subscription.plan
            if plan.monthly_processing_limit is None:
                # Unlimited plans
                limits = {
                    'background-removal': {'used': self.background_removal_count, 'limit': -1},
                    'image-upscaling': {'used': self.image_upscaling_count, 'limit': -1},
                    'image-transform': {'used': self.text_watermark_count + self.crop_resize_count, 'limit': -1},
                }
            else:
                # Limited plans
                total_used = (self.background_removal_count + self.image_upscaling_count + 
                            self.text_watermark_count + self.crop_resize_count)
                limits = {
                    'background-removal': {'used': self.background_removal_count, 'limit': plan.monthly_processing_limit},
                    'image-upscaling': {'used': self.image_upscaling_count, 'limit': plan.monthly_processing_limit},
                    'image-transform': {'used': self.text_watermark_count + self.crop_resize_count, 'limit': plan.monthly_processing_limit},
                }
        
        return limits
    
    def can_process(self, processing_type):
        """Check if user can process more images of given type"""
        limits = self.get_limits_dict()
        
        if processing_type == 'background-removal':
            limit = limits['background-removal']['limit']
            used = limits['background-removal']['used']
        elif processing_type == 'image-upscaling':
            limit = limits['image-upscaling']['limit']
            used = limits['image-upscaling']['used']
        else:  # text-watermark or crop-resize
            limit = limits['image-transform']['limit']
            used = limits['image-transform']['used']
        
        return limit == -1 or used < limit
    
    def increment_usage(self, processing_type):
        """Increment usage counter for given type"""
        if processing_type == 'background-removal':
            self.background_removal_count += 1
        elif processing_type == 'image-upscaling':
            self.image_upscaling_count += 1
        elif processing_type == 'text-watermark':
            self.text_watermark_count += 1
        elif processing_type == 'crop-resize':
            self.crop_resize_count += 1
        
        self.save()

class ProcessingJob(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='processing_jobs')
    
    type = models.CharField(max_length=20)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Input/Output files
    input_file = models.FileField(upload_to='processing/inputs/')
    output_file = models.FileField(upload_to='processing/outputs/', blank=True)
    
    # Processing settings
    settings = models.JSONField(default=dict)
    
    # Metadata
    processing_time = models.FloatField(null=True, blank=True)  # in seconds
    error_message = models.TextField(blank=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'processing_jobs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['status', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.type} - {self.status}"

class APIUsage(models.Model):
    """Track external API usage for cost monitoring"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='api_usage')
    api_name = models.CharField(max_length=50)  # 'removebg', 'clipdrop', etc.
    endpoint = models.CharField(max_length=100)
    
    # Request/Response data
    request_size = models.BigIntegerField()  # in bytes
    response_size = models.BigIntegerField(null=True, blank=True)  # in bytes
    processing_time = models.FloatField(null=True, blank=True)  # in seconds
    
    # Cost tracking
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    
    success = models.BooleanField()
    error_message = models.TextField(blank=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'api_usage'
        indexes = [
            models.Index(fields=['user', 'api_name', 'created_at']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.api_name} - {self.success}"