# ai_scale_app/tests/test_auth_api.py
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model

User = get_user_model()

class LoginApiTests(TestCase):
    def setUp(self):
        # create test user
        self.username = "dummyuser"
        self.password = "dummypassword"
        self.user = User.objects.create_user(
            username=self.username,
            password=self.password,
            role=User.Role.STUDENT
        )

    def test_login_success(self):
        response = self.client.post(
            "/auth/login/",  
            {"username": self.username, "password": self.password},
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["success"])

    def test_login_wrong_password(self):
        response = self.client.post(
            "/auth/login/",
            {"username": self.username, "password": "wrongpass"},
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 401)
        self.assertFalse(response.json()["success"])

    def test_login_missing_fields(self):
        response = self.client.post(
            "/auth/login/",
            {"username": self.username},  # missing password
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.json()["success"])
