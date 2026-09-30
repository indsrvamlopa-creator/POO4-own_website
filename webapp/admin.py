from django.contrib import admin
from .models import ContactInquiry


@admin.register(ContactInquiry)
class ContactInquiryAdmin(admin.ModelAdmin):
	list_display = ('name', 'company', 'email', 'service', 'status', 'created_at')
	list_filter = ('service', 'status', 'created_at')
	search_fields = ('name', 'company', 'email', 'message')
	readonly_fields = ('created_at',)
