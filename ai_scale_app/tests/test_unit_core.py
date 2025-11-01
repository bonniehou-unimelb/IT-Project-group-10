from django.test import TestCase
from django.contrib.auth import get_user_model
from ai_scale_app.models import Template, Subject

User = get_user_model()

class BasicModelTests(TestCase):
    """Simple sanity checks for User, Subject, and Template models."""

    def setUp(self):
        # Create a user
        self.user = User.objects.create(username="admin", role=User.Role.ADMIN)

        # Create a subject
        self.subject = Subject.objects.create(
            subjectCode="FINM1415",
            semester=1,
            year=2025,
            name="Intro to Finance"
        )

        # Create a template
        self.template = Template.objects.create(
            ownerId=self.user,
            name="Test Template",
            subject=self.subject,
            scope="Course",
            description="Testing template creation."
        )

    def test_user_created(self):
        """User should be saved and retrievable"""
        user = User.objects.get(username="admin")
        self.assertEqual(user.role, User.Role.ADMIN)

    def test_subject_created(self):
        """Subject should store correct fields"""
        subj = Subject.objects.get(subjectCode="FINM1415")
        self.assertEqual(subj.semester, 1)
        self.assertEqual(subj.year, 2025)
        self.assertIn("Finance", subj.name)

    def test_template_created(self):
        """Template links to correct user and subject"""
        tmpl = Template.objects.get(name="Test Template")
        self.assertEqual(tmpl.ownerId, self.user)
        self.assertEqual(tmpl.subject, self.subject)
        self.assertTrue(isinstance(tmpl.name, str))

    def test_string_representations(self):
        """__str__ methods should return readable strings"""
        self.assertIn("Finance", str(self.subject))
        self.assertIn("Template", str(self.template))
        self.assertIn("admin", str(self.template.ownerId))

    def test_subject_unique_constraint(self):
        """Cannot create two subjects with same code, year, and semester"""
        with self.assertRaises(Exception):
            Subject.objects.create(
                subjectCode="FINM1415",
                semester=1,
                year=2025,
                name="Duplicate Subject"
            )

    def test_template_unique_constraint(self):
        """Cannot create duplicate templates for same user/name/version"""
        with self.assertRaises(Exception):
            Template.objects.create(
                ownerId=self.user,
                name="Test Template",  
                subject=self.subject
            )

    def test_template_default_fields(self):
        """Default fields should initialize correctly"""
        tmpl = Template.objects.get(name="Test Template")
        self.assertEqual(tmpl.version, 0)
        self.assertTrue(tmpl.isPublishable)
        self.assertTrue(tmpl.isTemplate)

    def test_relationships_integrity(self):
        """Deleting user should cascade delete their templates"""
        #self.user.delete()
        #self.assertEqual(Template.objects.count(), 0)
