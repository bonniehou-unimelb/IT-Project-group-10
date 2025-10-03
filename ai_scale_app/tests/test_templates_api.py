import pytest
from django.urls import reverse
from ai_scale_app.models import User, Subject, Template

# run this by pytest ai_scale_app/tests/test_templates_api.py


@pytest.mark.django_db
class TestTemplateAPI:
    def setup_method(self):
        self.user = User.objects.create_user(username="owner", password="testpass")
        self.subject = Subject.objects.create(
            subjectCode="COMP1234", semester=1, year=2025, name="Test Subject"
        )
        self.template = Template.objects.create(
            ownerId=self.user, name="Initial Template", subject=self.subject
        )

    def test_create_template_success(self, client):
        payload = {
            "username": self.user.username,
            "name": "New Template",
            "subjectCode": self.subject.subjectCode,
            "semester": self.subject.semester,
            "year": self.subject.year,
            "description": "Test description",
        }
        response = client.post(reverse("update_template"), payload, content_type="application/json")
        assert response.status_code in [200, 201]

    @pytest.mark.django_db
    def test_summary_templates(self, client):
        # Make sure a user + template exist
        response = client.get(
            reverse("summarise_templates"),
            {"username": self.user.username}  # send query param
        )
        assert response.status_code == 200
        assert "templates" in response.json()


    def test_template_details(self, client):
        response = client.get(reverse("template_details"), {"id": self.template.id})
        assert response.status_code in [200, 404]

    def test_update_template_success(self, client):
        payload = {
            "username": self.user.username,
            "id": self.template.id,
            "name": "Updated Template",
            "description": "Updated description",
            "subjectCode": self.subject.subjectCode,
            "semester": self.subject.semester,
            "year": self.subject.year,
        }
        response = client.post(reverse("update_template"), payload, content_type="application/json")
        assert response.status_code in [200, 201]

    def test_delete_template_success(self, client):
        payload = {"templateId": self.template.id}
        response = client.post(reverse("delete_template"), payload, content_type="application/json")
        assert response.status_code == 200

