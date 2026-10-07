import logging

from django.conf import settings
from django.core.mail import EmailMessage
from django.contrib import messages
from django.http import JsonResponse
from django.shortcuts import redirect, render
from .forms import ContactInquiryForm

logger = logging.getLogger(__name__)


def home(request):
	form = ContactInquiryForm(request.POST or None)
	is_ajax = request.headers.get('x-requested-with') == 'XMLHttpRequest'
	if request.method == 'POST' and not form.is_valid() and is_ajax:
		errors = {field: [e['message'] for e in errs] for field, errs in form.errors.get_json_data().items()}
		return JsonResponse({'ok': False, 'errors': errors}, status=400)
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
			email.send(fail_silently=False)
		except Exception:
			logger.exception('Could not send notification for project inquiry %s', inquiry.pk)
			ok, text = False, 'Your inquiry was saved, but its email notification could not be sent. Please contact us again later.'
		else:
			ok, text = True, 'Thanks for reaching out. Your note is with our team.'
		if is_ajax:
			return JsonResponse({'ok': ok, 'message': text})
		(messages.success if ok else messages.error)(request, text)
		return redirect('home')
	return render(request, 'webapp/home.html', {'form': form})
