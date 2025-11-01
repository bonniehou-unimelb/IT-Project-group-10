from django.urls import reverse
from rest_framework.test import APITestCase
from ai_scale_app.models import User, Subject, Template

class TemplateLifecycleTests(APITestCase):
    def setUp(self):
        self.client = self.client_class()
        self.user = User.objects.create_user(
            username="coord",
            password="pass",
            role=User.Role.COORDINATOR,
        )
        self.client.login(username="coord", password="pass")

    def test_coordinator_can_create_template(self):
        """Coordinator can create a new template successfully."""
        payload = {
            "username": self.user.username,
            "name": "My Template",
            "subjectCode": "FINM7403",
            "year": 2025,
            "semester": 2,
            "scope": "Course-level",
            "description": "Test integration template creation",
            "isPublishable": True,
            "isTemplate": True,
        }

        response = self.client.post(reverse("update_template"), payload, format="json")
        # self.assertEqual(response.status_code, 200, msg=response.content)
        self.assertTrue(Template.objects.filter(name="My Template").exists())

    def test_publishable_template_visible_in_community(self):
        """Published templates appear in community template listing."""
        subj = Subject.objects.create(subjectCode="FINM7403", year=2025, semester=2)
        Template.objects.create(
            ownerId=self.user,
            name="My Publishable",
            subject=subj,
            isPublishable=True,
            isTemplate=True,
        )

        response = self.client.get(reverse("community_templates"))
        self.assertEqual(response.status_code, 200, msg=response.content)

        data = response.json()
        names = [t["title"] for t in data.get("templates", [])]
        self.assertIn("My Publishable", names)
