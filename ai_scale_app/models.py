from django.db import models

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
        return f"{self.firstName} {self.lastName}: {self.email} is a {self.role}"


class Subject(models.Model):
    coordinatorId = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    subjectCode = models.CharField(max_length=10, unique=True)

    def __str__(self):
        return f"{self.name}, {self.subjectCode}"


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

    class Meta:
        unique_together = [("ownerId", "name")]  # avoid duplicate names per owner
        indexes = [models.Index(fields=["ownerId", "name"])]

    def __str__(self):
        return self.name


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


class TemplateItem(models.Model):
    templateId = models.ForeignKey(Template, on_delete=models.CASCADE)
    task = models.TextField()
    aiUseScaleLevel = models.CharField(max_length=50, blank=True, null=True)
    instructionsToStudents = models.TextField(blank=True, null=True)
    examples = models.TextField(blank=True, null=True)
    aiGeneratedContent = models.TextField(blank=True, null=True)
    useAcknowledgement = models.BooleanField(default=False)

    class Meta:
        indexes = [models.Index(fields=["templateId"])]

    def __str__(self):
        return f"Item {self.id} in {self.templateId}"

class Rubric(models.Model):
    ownerId = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True, null=True)
    scope = models.CharField(max_length=120, blank=True, null=True)
    creationDate = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("ownerId", "name")]
        indexes = [models.Index(fields=["ownerId", "name"])]

    def __str__(self):
        return self.name


class RubricItem(models.Model):
    rubricId = models.ForeignKey(Rubric, on_delete=models.CASCADE)
    task = models.TextField()
    aiUseScaleLevel = models.CharField(max_length=50, blank=True, null=True)
    instructionsToStudents = models.TextField(blank=True, null=True)
    examples = models.TextField(blank=True, null=True)
    aiGeneratedContent = models.TextField(blank=True, null=True)
    useAcknowledgement = models.BooleanField(default=False)

    class Meta:
        indexes = [models.Index(fields=["rubricId"])]

    def __str__(self):
        return f"RubricItem {self.id} in {self.rubricId}"


class AcknowledgementForm(models.Model):
    rubricId = models.ForeignKey(Rubric, on_delete=models.CASCADE)
    name = models.CharField(max_length=120)

    class Meta:
        unique_together = [("rubricId", "name")]  # avoid duplicate form names under same rubric
        indexes = [models.Index(fields=["rubricId", "name"])]

    def __str__(self):
        return f"{self.name} for {self.rubricId}"


class AcknowledgementFormItem(models.Model):
    ackFormId = models.ForeignKey(AcknowledgementForm, on_delete=models.CASCADE)
    aiToolsUsed = models.TextField(blank=True, null=True)
    purposeUsage = models.TextField(blank=True, null=True)
    keyPromptsUsed = models.TextField(blank=True, null=True)

    class Meta:
        indexes = [models.Index(fields=["ackFormId"])]

    def __str__(self):
        return f"AckFormItem {self.id} in {self.ackFormId}"