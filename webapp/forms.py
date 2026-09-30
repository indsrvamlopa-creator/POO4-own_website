from django import forms
from .models import ContactInquiry


class ContactInquiryForm(forms.ModelForm):
    class Meta:
        model = ContactInquiry
        fields = ('name', 'company', 'email', 'service', 'message')
        widgets = {
            'name': forms.TextInput(attrs={'placeholder': 'Your name', 'autocomplete': 'name'}),
            'company': forms.TextInput(attrs={'placeholder': 'Company (optional)', 'autocomplete': 'organization'}),
            'email': forms.EmailInput(attrs={'placeholder': 'you@company.com', 'autocomplete': 'email'}),
            'service': forms.Select(),
            'message': forms.Textarea(attrs={'placeholder': 'A little about what you are building...', 'rows': 4, 'maxlength': 2000}),
        }