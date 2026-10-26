from django.contrib import admin
from .models import JobListing


@admin.register(JobListing)
class JobAdmin(admin.ModelAdmin):
    list_display = ('title', 'company', 'location', 'salary', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at', 'company', 'location')
    search_fields = ('title', 'company', 'description')
    readonly_fields = ('created_at', 'updated_at')
    list_editable = ('is_active',)
