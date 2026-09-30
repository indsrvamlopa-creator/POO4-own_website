from django.db import models


class ContactInquiry(models.Model):
	SERVICE_CHOICES = [
		('ai-machine-learning', 'AI and machine learning'),
		('custom-software', 'Custom software'),
		('web-applications', 'Web applications'),
		('mobile-applications', 'Mobile applications'),
		('business-automation', 'Business automation'),
		('digital-platforms', 'Digital platforms'),
		('other', 'Something else'),
	]
	STATUS_CHOICES = [
		('new', 'New'),
		('contacted', 'Contacted'),
		('closed', 'Closed'),
	]

	name = models.CharField(max_length=100)
	company = models.CharField(max_length=120, blank=True)
	email = models.EmailField()
	service = models.CharField(max_length=32, choices=SERVICE_CHOICES)
	message = models.TextField(max_length=2000)
	status = models.CharField(max_length=12, choices=STATUS_CHOICES, default='new')
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['-created_at']

	def __str__(self):
		return f'{self.name} - {self.get_service_display()}'
