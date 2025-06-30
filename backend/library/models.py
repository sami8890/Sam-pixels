from django.db import models
from django.utils import timezone
from accounts.models import User
import uuid

class LibraryItem(models.Model):
    PROCESSING_TYPES = [
        ('background-removal', 'Background Removal'),
        ('upscaling', 'Image Upscaling'),
        ('watermark', 'Text Watermark'),
        ('crop-resize', 'Crop & Resize'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='library_items')
    
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=PROCESSING_TYPES)
    
    # File information
    original_file = models.FileField(upload_to='library/originals/')
    processed_file = models.FileField(upload_to='library/processed/')
    file_size = models.BigIntegerField()  # in bytes
    
    # Image dimensions
    original_width = models.IntegerField()
    original_height = models.IntegerField()
    processed_width = models.IntegerField()
    processed_height = models.IntegerField()
    
    # Processing settings (JSON field for flexibility)
    settings = models.JSONField(default=dict, blank=True)
    
    # Metadata
    is_favorite = models.BooleanField(default=False)
    tags = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'library_items'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'type']),
            models.Index(fields=['user', 'is_favorite']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.name}"
    
    @property
    def file_size_mb(self):
        return round(self.file_size / (1024 * 1024), 2)

class LibraryFolder(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='library_folders')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default='#3B82F6')  # Hex color
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'library_folders'
        unique_together = ['user', 'name']
        ordering = ['name']
    
    def __str__(self):
        return f"{self.user.email} - {self.name}"
    
    @property
    def item_count(self):
        return self.items.count()

class LibraryItemFolder(models.Model):
    """Many-to-many relationship between items and folders"""
    item = models.ForeignKey(LibraryItem, on_delete=models.CASCADE, related_name='folders')
    folder = models.ForeignKey(LibraryFolder, on_delete=models.CASCADE, related_name='items')
    added_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'library_item_folders'
        unique_together = ['item', 'folder']

class SharedLibraryItem(models.Model):
    """For sharing library items with other users or publicly"""
    item = models.OneToOneField(LibraryItem, on_delete=models.CASCADE, related_name='share')
    share_token = models.CharField(max_length=64, unique=True)
    is_public = models.BooleanField(default=False)
    password = models.CharField(max_length=128, blank=True)  # Optional password protection
    expires_at = models.DateTimeField(null=True, blank=True)
    view_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'shared_library_items'
    
    def __str__(self):
        return f"Shared: {self.item.name}"
    
    @property
    def is_expired(self):
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False