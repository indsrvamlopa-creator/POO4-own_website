import logging

from django.conf import settings
from django.core.mail import EmailMessage
from django.core.exceptions import ImproperlyConfigured
from django.contrib import messages
from django.shortcuts import redirect, render
from .forms import ContactInquiryForm

logger = logging.getLogger(__name__)


def home(request):
	form = ContactInquiryForm(request.POST or None)
	if request.method == 'POST' and form.is_valid():
		inquiry = form.save()
		body = '\n'.join([
			f'Name: {inquiry.name}',
			f'Company: {inquiry.company or "Not provided"}',
			f'Email: {inquiry.email}',
			f'Area of interest: {inquiry.get_service_display()}',
			'',
			inquiry.message,
		])
		email = EmailMessage(
			subject=f'New AMLOPA project inquiry from {inquiry.name}',
			body=body,
			from_email=settings.DEFAULT_FROM_EMAIL,
			to=[settings.PROJECT_INQUIRY_TO_EMAIL],
			reply_to=[inquiry.email],
		)
		try:
			if not settings.EMAIL_HOST_PASSWORD:
				raise ImproperlyConfigured('EMAIL_HOST_PASSWORD is not configured')
			email.send(fail_silently=False)
		except Exception:
			logger.exception('Could not send notification for project inquiry %s', inquiry.pk)
			messages.error(request, 'Your inquiry was saved, but its email notification could not be sent. Please contact us again later.')
		else:
			messages.success(request, 'Thanks for reaching out. Your note is with our team.')
		return redirect('home')
	return render(request, 'webapp/home.html', {'form': form})
