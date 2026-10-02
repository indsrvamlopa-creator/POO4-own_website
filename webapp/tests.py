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
		self.assertContains(response, 'id="products"')
		self.assertContains(response, 'href="#products"')
		self.assertContains(response, 'id="products-title">Our Products</h2>')
		self.assertContains(response, 'class="product-grid"')
		self.assertEqual(response.content.count(b'data-product-dialog='), 4)
		self.assertEqual(response.content.count(b'class="product-card-summary"'), 4)
		self.assertEqual(response.content.count(b'<dialog class="product-detail-dialog"'), 4)
		self.assertNotContains(response, 'data-product-select')
		self.assertNotContains(response, 'data-product-detail')
		self.assertContains(response, 'Smart Academic Management Platform')
		self.assertContains(response, 'Empowering Education Through Digital Intelligence')
		self.assertContains(response, 'Digital student management')
		self.assertContains(response, 'Django REST Framework')
		self.assertContains(response, 'From traditional academic workflows to a smarter, connected digital campus.')
		self.assertContains(response, 'simats-dashboard.')
		self.assertContains(response, 'alt="Illustrated SIMATS academic dashboard')
		self.assertContains(response, 'Quick Commerce')
		self.assertContains(response, 'From Local Stores to Your Doorstep')
		self.assertContains(response, 'quick-commerce-dashboard.')
		self.assertContains(response, 'Customer → Order → Admin → Delivery Partner → Doorstep')
		self.assertContains(response, 'Razorpay payment gateway integration')
		self.assertContains(response, 'Dedicated delivery partner application')
		self.assertContains(response, 'AI Kidney Stone')
		self.assertContains(response, 'AI-Powered Medical Image Analysis for Smarter Screening')
		self.assertContains(response, 'TensorFlow / Keras')
		self.assertContains(response, 'Upload Medical Image → AI Image Processing → Feature Analysis → Model Prediction → Result')
		self.assertContains(response, 'not a replacement for professional medical diagnosis')
		self.assertContains(response, 'Solace')
		self.assertContains(response, 'AI-Powered Mental Wellness Companion')
		self.assertContains(response, 'Crisis support resources')
		self.assertContains(response, 'RAG / AI')
		self.assertContains(response, 'not a medical service, therapist, or emergency response')
		self.assertNotContains(response, 'product-content')
		self.assertNotContains(response, 'data-product-panel')
		self.assertNotContains(response, 'FlowOS')
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

	@override_settings(
		EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
		EMAIL_HOST_PASSWORD='',
	)
	def test_missing_smtp_password_reports_email_not_sent(self):
		response = self.client.post('/', {
			'name': 'Taylor Morgan',
			'email': 'taylor@example.com',
			'service': 'custom-software',
			'message': 'A project idea.',
		}, follow=True)

		self.assertEqual(ContactInquiry.objects.count(), 1)
		self.assertEqual(len(mail.outbox), 0)
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
