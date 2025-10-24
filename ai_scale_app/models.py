from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings

# The below classes generates the schemas for our relational database 
class User(AbstractUser):
    class Role(models.TextChoices):
        STUDENT = "STUDENT", "Student"
        STAFF = "STAFF", "Staff"
        COORDINATOR = "COORDINATOR", "Coordinator"
        ADMIN = "ADMIN", "Admin"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STUDENT)

class Subject(models.Model):
    subjectCode = models.CharField(max_length=10)
    semester = models.PositiveSmallIntegerField()
    year = models.PositiveSmallIntegerField()
    name = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["subjectCode", "year", "semester"],
                name="unique_subject_code_year_semester",
            )
        ]
        indexes = [
            models.Index(fields=["subjectCode", "year", "semester"]),
        ]

    def __str__(self):
        return f"{self.name}, {self.subjectCode}, year {self.year}, semester {self.semester}"


class Enrolment(models.Model):
    subjectId = models.ForeignKey(Subject, on_delete=models.CASCADE)
    studentId = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        unique_together = [("subjectId", "studentId")]  # one enrolment per student per subject
        indexes = [
            models.Index(fields=["subjectId"]),
            models.Index(fields=["studentId"]),
        ]

    def __str__(self):
        return f"{self.studentId} in {self.subjectId}"


class Template(models.Model):
    ownerId = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=120)
    scope = models.CharField(max_length=120, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, blank=True, null=True)
    version = models.PositiveSmallIntegerField(default=0)  
    isPublishable = models.BooleanField(default=True,blank=True, null=True)
    isTemplate = models.BooleanField(default=True,blank=True, null=True)

    class Meta:
        unique_together = [("ownerId", "name", "version")]  # avoid duplicate templates names per user
        indexes = [models.Index(fields=["ownerId", "name", "version"])]

    def __str__(self):
        return self.name + " for subject " + self.subject.name


class TemplateOwnership(models.Model):
    templateId = models.ForeignKey(Template, on_delete=models.CASCADE)
    ownerId = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        unique_together = [("templateId", "ownerId")]  # don't duplicate shares
        indexes = [
            models.Index(fields=["ownerId"]),
            models.Index(fields=["templateId"]),
        ]

    def __str__(self):
        return f"{self.ownerId} owns {self.templateId}"

class AIUseScale(models.Model):            
    name = models.TextField(unique=True)          

    def __str__(self):
        return f"{self.name}"  




class TemplateItem(models.Model):
    templateId = models.ForeignKey(Template, on_delete=models.CASCADE)
    task = models.TextField()
    aiUseScaleLevel = models.ForeignKey(
        AIUseScale, on_delete=models.SET_NULL, blank=True, null=True
    )
    instructionsToStudents = models.TextField(blank=True, null=True)
    examples = models.TextField(blank=True, null=True)
    aiGeneratedContent = models.TextField(blank=True, null=True)
    useAcknowledgement = models.BooleanField(default=False)

    class Meta:
        indexes = [models.Index(fields=["templateId"])]

    def __str__(self):
        return f"Item {self.id} in {self.templateId}"



class AcknowledgementForm(models.Model):
    templateId = models.ForeignKey(Template, on_delete=models.CASCADE)
    name = models.CharField(max_length=120)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, blank=True, null=True)

    class Meta:
        unique_together = [("templateId", "name")]  # avoid duplicate form names under same template
        indexes = [models.Index(fields=["templateId", "name"])]

    def __str__(self):
        return f"{self.name} for {self.templateId}"


class AcknowledgementFormItem(models.Model):
    ackFormId = models.ForeignKey(AcknowledgementForm, on_delete=models.CASCADE)
    aiToolsUsed = models.TextField(blank=True, null=True)
    purposeUsage = models.TextField(blank=True, null=True)
    keyPromptsUsed = models.TextField(blank=True, null=True)

    class Meta:
        indexes = [models.Index(fields=["ackFormId"])]

    def __str__(self):
        return f"AckFormItem {self.id} in {self.ackFormId}"
    
class AuditLog(models.Model):
    ACTION_CHOICES = [
        ("CREATE", "Create"),
        ("UPDATE", "Update"),
        ("DELETE", "Delete"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=100)
    object_id = models.PositiveIntegerField()
    details = models.JSONField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} {self.action} {self.model_name}({self.object_id})"