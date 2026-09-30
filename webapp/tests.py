from unittest.mock import patch

from django.core import mail
from django.test import TestCase, override_settings
from .models import ContactInquiry


class HomePageTests(TestCase):
	def test_homepage_renders_technology_company_site(self):
		response = self.client.get('/')

		self.assertEqual(response.status_code, 200)
		self.assertContains(response, 'AMLOPA INDSRV')
		self.assertContains(response, 'Build the future. Build intelligently. Build with AMLOPA.')
		self.assertContains(response, 'AI & Machine Learning')
		self.assertContains(response, 'FlowOS')
		self.assertContains(response, 'technology ecosystem')
		self.assertContains(response, 'Start Your Project')
		self.assertContains(response, 'mailto:indsrvamlopa@gmail.com')
		self.assertContains(response, 'tel:6382607244')
		self.assertContains(response, '63826 07244')

	@override_settings(
		EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
		DEFAULT_FROM_EMAIL='indsrvamlopa@gmail.com',
		PROJECT_INQUIRY_TO_EMAIL='indsrvamlopa@gmail.com',
		EMAIL_HOST_PASSWORD='test-password',
	)
	def test_valid_contact_inquiry_is_saved_and_emailed(self):
		response = self.client.post('/', {
			'name': 'Taylor Morgan',
			'company': 'Northstar Labs',
			'email': 'taylor@example.com',
			'service': 'custom-software',
			'message': 'We need help planning a new internal product.',
		})

		self.assertRedirects(response, '/')
		self.assertEqual(ContactInquiry.objects.count(), 1)
		self.assertEqual(ContactInquiry.objects.get().status, 'new')
		self.assertEqual(len(mail.outbox), 1)
		self.assertEqual(mail.outbox[0].to, ['indsrvamlopa@gmail.com'])
		self.assertEqual(mail.outbox[0].reply_to, ['taylor@example.com'])
		self.assertIn('Northstar Labs', mail.outbox[0].body)

	@override_settings(
		EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
		DEFAULT_FROM_EMAIL='indsrvamlopa@gmail.com',
		PROJECT_INQUIRY_TO_EMAIL='indsrvamlopa@gmail.com',
		EMAIL_HOST_PASSWORD='test-password',
	)
	@patch('webapp.views.EmailMessage.send', side_effect=OSError('SMTP unavailable'))
	def test_inquiry_is_kept_when_email_delivery_fails(self, send_email):
		response = self.client.post('/', {
			'name': 'Taylor Morgan',
			'email': 'taylor@example.com',
			'service': 'custom-software',
			'message': 'A project idea.',
		}, follow=True)

		self.assertEqual(ContactInquiry.objects.count(), 1)
		send_email.assert_called_once_with(fail_silently=False)
		self.assertContains(response, 'Your inquiry was saved, but its email notification could not be sent.')

	def test_invalid_contact_inquiry_is_not_saved(self):
		response = self.client.post('/', {
			'name': 'Taylor Morgan',
			'email': 'not-an-email',
			'service': 'custom-software',
			'message': 'A project idea.',
		})

		self.assertEqual(response.status_code, 200)
		self.assertEqual(ContactInquiry.objects.count(), 0)
