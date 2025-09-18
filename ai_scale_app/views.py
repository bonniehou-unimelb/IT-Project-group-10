from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login as auth_login
from .models import User, Subject, Template, TemplateItem, TemplateOwnership, Enrolment, AIUseScale
from http import HTTPStatus
import json
import logging

logger = logging.getLogger(__name__)

# ---- HELPER FUNCTIONS ---- #
def resolve_ai_use_level(use_scale_key):
    """
    Accepts an AIUseScale primary key and resolves it to an AIUseScale object
    """
    if use_scale_key in (None, "", "null"):
        return None
    return AIUseScale.objects.get(code=str(use_scale_key).upper())

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
@csrf_exempt  # remove when your frontend sends CSRF tokens
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
@csrf_exempt
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

# POST /template/update/
# body {username, name, scope, description, subject, version, isPublishable, isTemplate}
# given version should be the old version number
@csrf_exempt
@require_POST
def create_or_update_template(request):
    """
    Creates a new template object with the updated fields with new version number
    """
    data = _body(request)
    ownerId = data.get("username")
    owner = User.objects.get(username=username)
    name = data.get("name")
    subject_id = data.get("subject")
    old_version_num = data.get("version", 0)
    scope = data.get("scope") or ""
    description = data.get("description") or ""
    is_publishable = data.get("isPublishable", False)
    is_template = data.get("isTemplate", False)

    # Create a new subject if it doesn't exist yet
    try:
        subject = Subject.objects.get(pk=int(subject_id))
    except (ValueError, Subject.DoesNotExist):
        # TODO: create new subject
        return JsonResponse({"error": "subject does not exist yet"}, status=HTTPStatus.BAD_REQUEST)
    try:
        t = Template.objects.create(
                ownerId=owner,
                name=name,
                subject=subject,
                scope=scope,
                description=description,
                version=old_version_num+1,
                isPublishable=is_publishable,
                isTemplate=is_template,
            )
        TemplateOwnership.objects.create(ownerId=t.owner, templateId=t)
        return JsonResponse({"success": "template succesfully updated"}, status=HTTPStatus.OK)
    except:
        return JsonResponse({"error": "failed to update template"}, status=HTTPStatus.BAD_REQUEST)

# POST /templateitem/update
# body {templateId, task, aiUseScaleLevel, instructionsToStudents, examples,aiGeneratedContent, useAcknowledgement}
@csrf_exempt
@require_POST
def update_template_item(request):
    """
    Creates a new template item entry inside the requested template with the requested fields
    """
    data = _body(request)
    templateId = data.get("templateId")
    task = data.get("task")
    aiUseScaleLevel = data.get("aiUseScaleLevel")
    aiUseScaleLevelObj = resolve_ai_use_level(aiUseScaleLevel)
    instructionsToStudents = data.get("instructionsToStudents")
    examples = data.get("examples")
    aiGeneratedContent = data.get("aiGeneratedContent")
    useAcknowledgement = data.get("useAcknowledgement")

    try:
        t_item = TemplateItem.objects.create(
            templateId=templateId,
            task = task,
            aiUseScaleLevel = aiUseScaleLevelObj,
            instructionsToStudents = instructionsToStudents,
            examples = examples,
            aiGeneratedContent = aiGeneratedContent,
            useAcknowledgement = useAcknowledgement
        )
        return JsonResponse({"success": "template item succesfully updated"}, status=HTTPStatus.OK)
    except:
        return JsonResponse({"error": "failed to update template item"}, status=HTTPStatus.BAD_REQUEST)


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
            "id", "task", "instructionsToStudents", "examples",
            "aiGeneratedContent", "useAcknowledgement",
            "aiUseScaleLevel_id", "aiUseScaleLevel__code", "aiUseScaleLevel__title",
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
@csrf_exempt
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


# 