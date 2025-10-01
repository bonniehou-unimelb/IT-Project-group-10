from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login as auth_login
from .models import User, Subject, Template, TemplateItem, TemplateOwnership, Enrolment, AIUseScale
from http import HTTPStatus
from django.contrib.auth import logout as auth_logout
from django.middleware.csrf import get_token
import json
import logging
from django.db import IntegrityError
import traceback
from django.db.models import Max

logger = logging.getLogger(__name__)

# ---- HELPER FUNCTIONS ---- #
def resolve_ai_use_level(use_scale_name):
    """
    Accepts an AIUseScale name and resolves it to an AIUseScale object
    """
    a, _ = AIUseScale.objects.get_or_create(name=use_scale_name)
    return a

def _body(request) -> dict:
    """
    small helper to accept JSON or form-encoded bodies
    """
    ctype = (request.headers.get("Content-Type") or "").lower()
    if "application/json" in ctype:
        try:
            return json.loads(request.body or "{}")
        except json.JSONDecodeError:
            return {}
    return request.POST.dict()

def _get_rid_of_escape_char(s):
    """
    Unescape for strings e.g. \"
    """
    return s.replace("\\", "") if isinstance(s, str) else s

# ---- API ENDPOINTS ---- #
def index(request):
    return HttpResponse("Hello. You're at the ai scale app index.")


# GET /username/?username=...
@require_GET
def user_details(request):
    """
    fetches all personal details of user by username
    """
    username = request.GET.get("username")
    if not username:
        return JsonResponse({"error": "username is required"}, status=HTTPStatus.BAD_REQUEST)

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=HTTPStatus.NOT_FOUND)

    return JsonResponse({
        "first_name": user.first_name,
        "last_name": user.last_name,
        "username": user.username,
        "role": user.role,
    }, status=HTTPStatus.OK)

# GET /session/
@require_GET
def curr_user_session(request):
    """
    Return the user session if user is authenticated already
    """
    if request.user.is_authenticated:
        curr_user = request.user
        return JsonResponse({"isAuthenticated": True, "user": {
            "username": curr_user.username, "role": getattr(curr_user, "role", None)
        }}, status=HTTPStatus.OK)
    return JsonResponse({"isAauthenticated": False}, status=HTTPStatus.UNAUTHORIZED)


# GET /info/taught_subjects/?username=...
@require_GET
def enrolment_teaching(request):
    """
    Get all subject info taught by the user
    """
    username = request.GET.get("username")
    if not username:
        return JsonResponse({"error": "username is required"}, status=HTTPStatus.BAD_REQUEST)

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=HTTPStatus.NOT_FOUND)

    if user.role in {User.Role.COORDINATOR, User.Role.STAFF}:
        taught_subjects = list(
            Subject.objects.filter(coordinatorId=user)
                           .values("id", "name", "subjectCode")
        )
        return JsonResponse({"taught_subjects": taught_subjects}, status=HTTPStatus.OK)

    return JsonResponse({"taught_subjects": []}, status=HTTPStatus.OK)

# POST /auth/login/   body: JSON or form {username, password}
@csrf_exempt
@require_POST
def user_login(request):
    """
    Authenticates user request (username, password) according to their details in DB
    """
    try:
        data = _body(request)
        username = data.get("username")
        password = data.get("password")
        if not username or not password:
            return JsonResponse({"success": False, "error": "username and password required"},
                                status=HTTPStatus.BAD_REQUEST)

        logger.debug("Attempting login for user: %s", username)
        user = authenticate(request, username=username, password=password)
        if not user:
            return JsonResponse({"success": False, "error": "Incorrect login details"},
                                status=HTTPStatus.UNAUTHORIZED)

        auth_login(request, user)
        return JsonResponse({"success": True,
                             "user": {"id": user.id, "username": user.username, "role": user.role}},
                            status=HTTPStatus.OK)
    except Exception as e:
        logger.exception("Login error")
        return JsonResponse({"success": False, "error": "Server error occurred"},
                            status=HTTPStatus.INTERNAL_SERVER_ERROR)

# POST /auth/register/  body: JSON or form {username, password, first_name, last_name, role}
@require_POST
def register(request):
    """
    Registers a new user's info (username, password, name, role)
    """
    try:
        data = _body(request)
        required = ["username", "password", "first_name", "last_name", "role"]
        missing = [k for k in required if not data.get(k)]
        if missing:
            return JsonResponse({"success": False, "error": f"{', '.join(missing)} required"},
                                status=HTTPStatus.BAD_REQUEST)

        username = data["username"]
        if User.objects.filter(username=username).exists():
            return JsonResponse({"success": False, "error": "username already exists"},
                                status=HTTPStatus.CONFLICT)

        role = data.get("role", User.Role.STUDENT)
        # Coerce role into a valid enum value
        if role not in User.Role.values:
            role = User.Role.STUDENT

        user = User.objects.create_user(
            username=username,
            password=data["password"],
            first_name=data.get("first_name", ""),
            last_name=data.get("last_name", ""),
            role=role,
        )
        return JsonResponse({"success": True, "user": {"username": user.username}},
                            status=HTTPStatus.CREATED)
    except Exception as e:
        logger.exception("Registration error")
        return JsonResponse({"success": False, "error": "Server error occurred"},
                            status=HTTPStatus.INTERNAL_SERVER_ERROR)

# GET /token/
@require_GET
def csrf_token(request):
    """
    Set the user session token
    """
    return JsonResponse({"csrfToken": get_token(request)}, status = HTTPStatus.OK)


# POST /logout/
@require_POST
def user_logout(request):
    """
    Exits the user session
    """
    auth_logout(request)
    return JsonResponse({"success": True}, status=HTTPStatus.OK)


# POST /template/update/
# body {username, name, scope, description, subject code, year, semester, version, isPublishable, isTemplate}
# given version should be the current version number
@require_POST
def create_or_update_template(request):
    """
    Creates a new template object with the updated fields with new version number
    """
    data = _body(request)
    username = data.get("username")
    user = User.objects.get(username=username)
    name = data.get("name")
    subject_code = data.get("subjectCode")
    year = data.get("year")
    semester = data.get("semester")
    old_version_num = data.get("version", 0)
    scope = data.get("scope") or ""
    description = data.get("description") or ""
    is_publishable = data.get("isPublishable", False)
    is_template = data.get("isTemplate", False)


    # Grab subject object based on code, year, semester
    subject, _ = Subject.objects.get_or_create(
        subjectCode=subject_code,
        year=year,
        semester=semester,
        defaults={"name": ""}
    )

    # Get the latest version number
    latest = (
            Template.objects
            .filter(ownerId=user, subject=subject, name=name)
            .aggregate(Max("version"))
            .get("version__max")
            or 0
        )
    next_version = latest + 1

    # Create a new teplate object with new version number
    try:
        t = Template.objects.create(
                ownerId=user,
                name=name,
                subject=subject,
                scope=scope,
                description=description,
                version=next_version,
                isPublishable=is_publishable,
                isTemplate=is_template,
            )
        TemplateOwnership.objects.create(ownerId=user, templateId=t)
        return JsonResponse(
            {"success": True, "templateId": t.id, "version": t.version},
            status=HTTPStatus.CREATED,
        )
    except:
        return JsonResponse({"error": "failed to update template"}, status=HTTPStatus.BAD_REQUEST)

# POST /templateitem/update
# body {templateId, task, aiUseScaleLevel, instructionsToStudents, examples,aiGeneratedContent, useAcknowledgement}
@require_POST
def update_template_item(request):
    data = _body(request)

    template_id = data.get("templateId")
    task = (data.get("task") or "").strip()
    level_name = (data.get("aiUseScaleLevel_name")
                  or data.get("aiUseScaleLevel")
                  or "").strip()
    instructions = data.get("instructionsToStudents") or ""
    examples = data.get("examples") or ""
    ai_content = data.get("aiGeneratedContent") or ""
    ack = data.get("useAcknowledgement")

    try:
        tpl = Template.objects.get(pk=int(template_id))
        level_obj = resolve_ai_use_level(level_name) 

        item = TemplateItem.objects.create(
            templateId=tpl,
            task=task,
            aiUseScaleLevel=level_obj,
            instructionsToStudents=instructions,
            examples=examples,
            aiGeneratedContent=ai_content,
            useAcknowledgement=ack,
        )
        return JsonResponse({"success": True, "id": item.id}, status=HTTPStatus.CREATED)

    except Exception as e:
        logger.exception("Failed to create template item")
        return JsonResponse({"error": f"{type(e).__name__}: {e}"}, status=HTTPStatus.BAD_REQUEST)

# GET /template/summary/?username=...
# returns summary of all templates owned by that user, includes all previous versions of the same template too
# returns:   templateId, Template name, version, subject code, subject year, semester, owner name, isPublishable, isTemplate
@require_GET
def summary_templates(request):
    """
    Gives overview of all templates owned by requested user and displays their respective summary details
    """
    username = request.GET.get("username")

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return JsonResponse({"error": "User does not exist"}, status=HTTPStatus.NOT_FOUND)

    relevant_templates = (
        Template.objects
        .filter(ownerId=user)
        .select_related("ownerId")
        .order_by("name", "version")  
    )

    # Helper function to get the full owner name by its id in Template
    def get_full_owner_name(t: Template) -> str:
        user_info = getattr(t, "ownerId", None)
        return f"{user_info.first_name} {user_info.last_name}".strip()

    response_rows = []
    for t in relevant_templates:
        response_rows.append({
            "templateId": t.id,
            "name": t.name,
            "version": t.version,
            "subjectCode": t.subject.subjectCode,
            "year": t.subject.year,
            "semester": t.subject.semester,
            "ownerName": get_full_owner_name(t),
            "isPublishable": bool(t.isPublishable),
            "isTemplate": bool(t.isTemplate),
        })

    return JsonResponse({"templates": response_rows}, status=HTTPStatus.OK)


# GET template/details/?templateId=...
# returns all template details by its templateID, includes template info, template items, subject info
@require_GET
def template_details(request):
    template_id = request.GET.get("templateId")

    try:
        t = Template.objects.select_related("subject", "ownerId").get(pk=template_id)
    except Template.DoesNotExist:
        return JsonResponse({"error": "Template does not exist"}, status=HTTPStatus.NOT_FOUND)

    # Get relevant template items
    template_items = list(
        TemplateItem.objects.filter(templateId=t)
        .select_related("aiUseScaleLevel")
        .values(
            "id",
            "task",
            "instructionsToStudents",
            "examples",
            "aiGeneratedContent",
            "useAcknowledgement",
            "aiUseScaleLevel_id",
            "aiUseScaleLevel__name",   
        )
    )


    for i in template_items:
        i["instructionsToStudents"] = _get_rid_of_escape_char(i.get("instructionsToStudents"))
        i["examples"] = _get_rid_of_escape_char(i.get("examples"))
        
    return JsonResponse({
        "id": t.id,
        "name": t.name,
        "version": t.version,
        "ownerId": t.ownerId_id,
        "subject": {
            "id": t.subject_id,
            "code": t.subject.subjectCode,
            "name": t.subject.name,
            "year": t.subject.year,
            "semester": t.subject.semester
        },
        "scope": t.scope,
        "description": t.description,
        "isPublishable": t.isPublishable,
        "isTemplate": t.isTemplate,
        "template_items": template_items,
    }, status=HTTPStatus.OK)


# GET all older version numbers and their pk id's of a template  



# POST update status of template 



# POST /template/delete/    body={"templateId": ...}
# DELETE a template by its id, also delete its template items
@require_POST
def delete_template(request):
    data = _body(request)
    template_id = data.get("templateId")

    try:
        t = Template.objects.get(pk=int(template_id))
    except (ValueError, Template.DoesNotExist):
        return JsonResponse({"error": "Template does not exist"}, status=HTTPStatus.NOT_FOUND)
    t.delete()
    return JsonResponse({"success": True}, status=HTTPStatus.OK)

@csrf_exempt
@require_POST
def duplicate_template(request):
    # Creates a copy of an existing template for the same owner, appending (1), (2), etc to the name
    data = _body(request)
    template_id = data.get("templateId")

    if not template_id:
        return JsonResponse({"error": "templateId is required"}, status=HTTPStatus.BAD_REQUEST)

    try:
        from .models import Template, TemplateItem, AcknowledgementForm, AcknowledgementFormItem, TemplateOwnership
        import re

        original = Template.objects.get(pk=int(template_id))

        # strip (n) if already in name
        base_name = re.sub(r" \(\d+\)$", "", original.name)

        # find existing duplicates for this owner
        existing_names = Template.objects.filter(ownerId=original.ownerId, name__startswith=base_name).values_list("name", flat=True)
        max_num = 0
        for name in existing_names:
            match = re.search(r"\((\d+)\)$", name)
            if match:
                max_num = max(max_num, int(match.group(1)))

        new_name = f"{base_name} ({max_num+1})"

        # create new Template
        new_template = Template.objects.create(
            ownerId=original.ownerId,
            name=new_name,
            scope=original.scope,
            description=original.description,
            subject=original.subject,
            version=original.version,
            isPublishable=original.isPublishable,
            isTemplate=original.isTemplate,
        )
        TemplateOwnership.objects.create(templateId=new_template, ownerId=original.ownerId)

        # duplicate TemplateItems
        for item in TemplateItem.objects.filter(templateId=original):
            TemplateItem.objects.create(
                templateId=new_template,
                task=item.task,
                aiUseScaleLevel=item.aiUseScaleLevel,
                instructionsToStudents=item.instructionsToStudents,
                examples=item.examples,
                aiGeneratedContent=item.aiGeneratedContent,
                useAcknowledgement=item.useAcknowledgement,
            )

        # duplicate AcknowledgementForms and Items
        for form in AcknowledgementForm.objects.filter(templateId=original):
            new_form = AcknowledgementForm.objects.create(
                templateId=new_template,
                name=form.name,
                subject=form.subject,
            )
            for form_item in AcknowledgementFormItem.objects.filter(ackFormId=form):
                AcknowledgementFormItem.objects.create(
                    ackFormId=new_form,
                    aiToolsUsed=form_item.aiToolsUsed,
                    purposeUsage=form_item.purposeUsage,
                    keyPromptsUsed=form_item.keyPromptsUsed,
                )

        return JsonResponse({
            "success": True,
            "new_template": {
                "templateId": new_template.id,
                "name": new_template.name,
                "version": new_template.version,
                "subjectCode": new_template.subject.subjectCode if new_template.subject else "",
                "year": new_template.subject.year if new_template.subject else None,
                "semester": new_template.subject.semester if new_template.subject else None,
                "ownerName": f"{new_template.ownerId.first_name} {new_template.ownerId.last_name}".strip(),
                "isPublishable": bool(new_template.isPublishable),
                "isTemplate": bool(new_template.isTemplate),
            }
        }, status=HTTPStatus.CREATED)


    except Template.DoesNotExist:
        return JsonResponse({"error": "Template is non-existent"}, status=HTTPStatus.NOT_FOUND)
    except Exception as e:
        logger.exception("Unable to duplicate template")
        return JsonResponse({"error": str(e)}, status=HTTPStatus.BAD_REQUEST)
