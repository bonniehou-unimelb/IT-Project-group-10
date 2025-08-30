from django.db import models

# Create your models here.
class User(models.Model):
    class Role(models.TextChoices):
        STUDENT = "STUDENT", "Student"
        STAFF = "STAFF", "Staff"
        COORDINATOR = "COORDINATOR", "Coordinator"
        ADMIN = "ADMIN", "Admin"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STUDENT)
    email = models.EmailField(unique=True)
    firstName = models.CharField(max_length=50)
    lastName = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.firstName} {self.lastName}: {self.email}"

class Subject(models.Model):
    coordinatorId = models.ForeignKey(
        User, on_delete=models.CASCADE
    )
    name = models.CharField(max_length=100)
    subjectCode = models.CharField(max_length=10, unique=True)

    def __str__(self):
        return f"{self.name}, {self.subjectCode}"


