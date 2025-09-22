import pytest
from django.urls import reverse
from ai_scale_app.models import User

# run this by pytest ai_scale_app/tests/test_auth_api.py

@pytest.mark.django_db
class TestAuthAPI:

    def setup_method(self):
        self.username = "dummyuser"
        self.password = "dummypassword"
        self.user = User.objects.create_user(
            username=self.username,
            password=self.password,
            role=User.Role.STUDENT
        )

    def test_login_success(self, client):
        response = client.post(
            reverse("login"),
            {"username": self.username, "password": self.password},
            content_type="application/json"
        )
        assert response.status_code == 200
        assert response.json()["success"] is True

    def test_login_wrong_password(self, client):
        response = client.post(
            reverse("login"),
            {"username": self.username, "password": "wrongpass"},
            content_type="application/json"
        )
        assert response.status_code == 401
        assert response.json()["success"] is False

    def test_login_missing_fields(self, client):
        # missing password
        response = client.post(
            reverse("login"),
            {"username": self.username},
            content_type="application/json"
        )
        assert response.status_code == 400
        assert response.json()["success"] is False

        # missing username
        response = client.post(
            reverse("login"),
            {"password": self.password},
            content_type="application/json"
        )
        assert response.status_code == 400
        assert response.json()["success"] is False

        # missing both
        response = client.post(
            reverse("login"),
            {},
            content_type="application/json"
        )
        assert response.status_code == 400
        assert response.json()["success"] is False
