from django.contrib import admin
from .models import ResumeUpload


@admin.register(ResumeUpload)
class ResumeUploadAdmin(admin.ModelAdmin):
    list_display = ('user', 'original_filename', 'file_type', 'file_size', 'processed', 'created_at')
    list_filter = ('file_type', 'processed', 'created_at')
    search_fields = ('user__username', 'original_filename')
    readonly_fields = ('created_at',)
