import pytest
from django.urls import reverse
from ai_scale_app.models import User, Subject

# run this by pytest ai_scale_app/tests/test_basic_views.py


@pytest.mark.django_db
class TestBasicViews:

    def test_index_view(self, client):
        response = client.get(reverse("index"))
        assert response.status_code == 200
        assert b"Hello. You're at the ai scale app index." in response.content

    def test_user_details_success(self, client):
        user = User.objects.create(username="alice", first_name="Alice", last_name="Smith", role=User.Role.STUDENT)
        response = client.get(reverse("user_details"), {"username": user.username})
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "alice"
        assert data["role"] == User.Role.STUDENT

    def test_user_details_missing_username(self, client):
        response = client.get(reverse("user_details"))  # no username param
        assert response.status_code == 400
        assert "error" in response.json()

    def test_user_details_not_found(self, client):
        response = client.get(reverse("user_details"), {"username": "na"})
        assert response.status_code == 404
        assert "error" in response.json()

    def test_enrolment_teaching_coordinator(self, client):
        user = User.objects.create(username="bob", role=User.Role.COORDINATOR)
        subj = Subject.objects.create(
            subjectCode="COMP10001",
            semester=1,
            year=2025,
            name="Foundations of Computing",
            coordinatorId=user,  
        )
        response = client.get(reverse("taught_subjects"), {"username": user.username})
        assert response.status_code == 200
        taught = response.json()["taught_subjects"]
        assert len(taught) == 1
        assert taught[0]["subjectCode"] == "COMP10001"

    def test_enrolment_teaching_student_returns_empty(self, client):
        user = User.objects.create(username="student", role=User.Role.STUDENT)
        response = client.get(reverse("taught_subjects"), {"username": user.username})
        assert response.status_code == 200
        assert response.json()["taught_subjects"] == []

