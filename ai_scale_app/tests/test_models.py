import pytest
from django.db import IntegrityError
from ai_scale_app.models import (
    User,
    Subject,
    Enrolment,
    Template,
    TemplateOwnership,
    AIUseScale,
    TemplateItem,
    AcknowledgementForm,
    AcknowledgementFormItem,
)

# run this by pytest ai_scale_app/tests/test_models.py


# user
@pytest.mark.django_db
def test_user_default_role_is_student():
    user = User.objects.create(username="bob")
    assert user.role == User.Role.STUDENT

@pytest.mark.django_db
def test_user_role_must_be_valid_choice():
    user = User.objects.create(username="alice", role=User.Role.STAFF)
    assert user.role == "STAFF"


# subject
@pytest.mark.django_db
def test_subject_str_representation():
    subject = Subject.objects.create(
        subjectCode="COMP10001", semester=1, year=2025, name="Foundations of Computing"
    )
    assert str(subject) == "Foundations of Computing, COMP10001, year 2025, semester 1"

@pytest.mark.django_db
def test_subject_unique_constraint():
    Subject.objects.create(subjectCode="COMP10001", semester=1, year=2025)
    with pytest.raises(IntegrityError):
        Subject.objects.create(subjectCode="COMP10001", semester=1, year=2025)

@pytest.mark.django_db
def test_subject_name_can_be_blank_or_null():
    s1 = Subject.objects.create(subjectCode="COMP20001", semester=1, year=2025, name="")
    s2 = Subject.objects.create(subjectCode="COMP20002", semester=2, year=2025)
    assert s1.name == ""
    assert s2.name is None


# enrollment
@pytest.mark.django_db
def test_enrolment_str_representation():
    subj = Subject.objects.create(
        subjectCode="MAST20005", semester=1, year=2025, name="Statistics"
    )
    student = User.objects.create(username="student1")
    enrol = Enrolment.objects.create(subjectId=subj, studentId=student)
    assert str(enrol) == f"{student} in {subj}"

@pytest.mark.django_db
def test_enrolment_unique_constraint():
    subj = Subject.objects.create(subjectCode="MAST20004", semester=2, year=2025)
    student = User.objects.create(username="student2")
    Enrolment.objects.create(subjectId=subj, studentId=student)
    with pytest.raises(IntegrityError):
        Enrolment.objects.create(subjectId=subj, studentId=student)


# template
@pytest.mark.django_db
def test_templateownership_str_representation():
    user = User.objects.create(username="owner1")
    subj = Subject.objects.create(
        subjectCode="INFO20003", semester=1, year=2025, name="Databases Systems"
    )
    template = Template.objects.create(ownerId=user, name="SharedTemplate", subject=subj)
    ownership = TemplateOwnership.objects.create(templateId=template, ownerId=user)
    assert str(ownership) == f"{user} owns {template}"


@pytest.mark.django_db
def test_template_unique_together():
    user = User.objects.create(username="owner2")
    Template.objects.create(ownerId=user, name="DuplicateTest", version=0)
    with pytest.raises(IntegrityError):
        Template.objects.create(ownerId=user, name="DuplicateTest", version=0)

@pytest.mark.django_db
def test_template_default_values():
    user = User.objects.create(username="owner3")
    t = Template.objects.create(ownerId=user, name="DefaultsTest")
    assert t.version == 0
    assert t.isPublishable is True
    assert t.isTemplate is True

@pytest.mark.django_db
def test_template_subject_can_be_null():
    user = User.objects.create(username="owner4")
    t = Template.objects.create(ownerId=user, name="NoSubject")
    assert t.subject is None


# template ownership
@pytest.mark.django_db
def test_templateownership_unique_constraint():
    user = User.objects.create(username="owner6")
    template = Template.objects.create(ownerId=user, name="SharedTemplate2")
    TemplateOwnership.objects.create(templateId=template, ownerId=user)
    with pytest.raises(IntegrityError):
        TemplateOwnership.objects.create(templateId=template, ownerId=user)


# ai use scale
@pytest.mark.django_db
def test_aiusescale_str_representation():
    scale = AIUseScale.objects.create(name="Level 1")
    assert str(scale) == "Level 1"

@pytest.mark.django_db
def test_aiusescale_unique_name():
    AIUseScale.objects.create(name="Level 2")
    with pytest.raises(IntegrityError):
        AIUseScale.objects.create(name="Level 2")


# template item
@pytest.mark.django_db
def test_templateitem_str_representation():
    user = User.objects.create(username="owner7")
    subj = Subject.objects.create(
        subjectCode="PSYC10004", semester=1, year=2025, name="Mind, Brain & Behaviour 2"
    )
    template = Template.objects.create(ownerId=user, name="Guidelines", subject=subj)
    item = TemplateItem.objects.create(templateId=template, task="Essay")
    assert str(item) == f"Item {item.id} in {template}"

@pytest.mark.django_db
def test_templateitem_requires_task():
    user = User.objects.create(username="owner8")
    subj = Subject.objects.create(
        subjectCode="PSYC10003", semester=2, year=2025, name="Mind, Brain & Behaviour 1"
    )
    template = Template.objects.create(ownerId=user, name="TemplateWithItem", subject=subj)
    with pytest.raises((IntegrityError, ValueError)):
        TemplateItem.objects.create(templateId=template, task=None)

@pytest.mark.django_db
def test_templateitem_optional_fields():
    user = User.objects.create(username="owner9")
    subj = Subject.objects.create(
        subjectCode="COMP30020", semester=2, year=2025, name="Declarative Programming"
    )
    template = Template.objects.create(ownerId=user, name="TemplateOptional", subject=subj)
    item = TemplateItem.objects.create(templateId=template, task="Essay")
    assert item.instructionsToStudents is None
    assert item.examples is None
    assert item.aiGeneratedContent is None


# acknowledgement form
@pytest.mark.django_db
def test_acknowledgementform_str_representation():
    user = User.objects.create(username="owner10")
    subj = Subject.objects.create(
        subjectCode="SWEN20003", semester=1, year=2025,
        name="Object Oriented Software Development"
    )
    template = Template.objects.create(ownerId=user, name="Guidelines", subject=subj)
    form = AcknowledgementForm.objects.create(templateId=template, name="Form 1", subject=subj)
    assert str(form) == "Form 1 for Guidelines for subject Object Oriented Software Development"

@pytest.mark.django_db
def test_acknowledgementform_unique_together():
    user = User.objects.create(username="owner11")
    subj = Subject.objects.create(
        subjectCode="COMP30024", semester=2, year=2025, name="Artificial Intelligence"
    )
    template = Template.objects.create(ownerId=user, name="Guidelines2", subject=subj)
    AcknowledgementForm.objects.create(templateId=template, name="Form 1", subject=subj)
    with pytest.raises(IntegrityError):
        AcknowledgementForm.objects.create(templateId=template, name="Form 1", subject=subj)


# acknowledgement form item
@pytest.mark.django_db
def test_ackformitem_str_representation():
    user = User.objects.create(username="owner12")
    subj = Subject.objects.create(
        subjectCode="COMP10002", semester=1, year=2025, name="Foundations of Algorithms"
    )
    template = Template.objects.create(ownerId=user, name="Guidelines3", subject=subj)
    form = AcknowledgementForm.objects.create(templateId=template, name="Form 1", subject=subj)
    item = AcknowledgementFormItem.objects.create(ackFormId=form, aiToolsUsed="ChatGPT")
    assert str(item) == f"AckFormItem {item.id} in {form}"

@pytest.mark.django_db
def test_ackformitem_optional_fields():
    user = User.objects.create(username="owner13")
    subj = Subject.objects.create(
        subjectCode="SWEN30006", semester=2, year=2025, name="Software Modelling and Design"
    )
    template = Template.objects.create(ownerId=user, name="Guidelines4", subject=subj)
    form = AcknowledgementForm.objects.create(templateId=template, name="Form 2", subject=subj)
    item = AcknowledgementFormItem.objects.create(ackFormId=form)
    assert item.aiToolsUsed is None
    assert item.purposeUsage is None
    assert item.keyPromptsUsed is None

