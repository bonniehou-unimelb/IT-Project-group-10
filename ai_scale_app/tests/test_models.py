from django.test import TestCase
from ai_scale_app.models import User

class UserModelTest(TestCase):
    def test_create_user(self):
        u = User.objects.create_user(
            username="bsmith",
            password="password",
            first_name="Bob",
            last_name="Smith",
            role=User.Role.STUDENT,
        )
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(u.first_name, "Bob")
        self.assertNotEqual(u.password, "password")  # hashed
