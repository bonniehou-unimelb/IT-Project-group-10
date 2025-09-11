from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login as auth_login
from .models import User, Subject, Template, TemplateItem, TemplateOwnership, Enrolment
from http import HTTPStatus
import json
import logging

logger = logging.getLogger(__name__)

def index(request):
    return HttpResponse("Hello. You're at the ai scale app index.")

# --- small helper to accept JSON or form-encoded bodies ---
def _body(request) -> dict:
    ctype = (request.headers.get("Content-Type") or "").lower()
    if "application/json" in ctype:
        try:
            return json.loads(request.body or "{}")
        except json.JSONDecodeError:
            return {}
    return request.POST.dict()

# GET /username/?username=...
@require_GET
def user_details(request):
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

# POST create/update template 
# body {ownerId, name, scope, description, subject, version, isPublishable, isTemplate}
# given version should be the old version number
@csrf_exempt
@require_POST
def create_or_update_template(request):
    data = _body(request)
    ownerId = data.get("ownerId")
    name = data.get("name")
    subject_id = data.get("subject")
    old_version_num = data.get("version", 0)
    scope = data.get("scope") or ""
    description = data.get("description") or ""
    is_publishable = data.get("isPublishable", False)
    is_template = data.get("isTemplate", False)

    # Create a new subject if it doesn't exist yet
    try:
        subject = Subject.objects.get(pk=int(sid))
    except (ValueError, Subject.DoesNotExist):
        # TODO: create new subject
        return JsonResponse({"error": "subject does not exist yet"}, status=HTTPStatus.BAD_REQUEST)
    try:
        t = Template.objects.create(
                ownerId=ownerId,
                name=name,
                subject=subject,
                scope=scope,
                description=description,
                version=old_version_num+1,
                isPublishable=is_publishable,
                isTemplate=is_template,
            )
        return JsonResponse({"success": "template succesfully updated"}, status=HTTPStatus.OK)
    except:
        return JsonResponse({"error": "failed to update template"}, status=HTTPStatus.BAD_REQUEST)

# POST add template item




# GET by userID, summary of all templates and rubric owned by that user 
# This should only return the templates/rubrics with the newest version number if they have same names
# returns:   Template id, name, subject code, owner ID, status


# GET all template details by its templateID

# GET all older version numbers of template

# POST edit the template and create a new template with a newer version number

# POST edit the rubric and create a new rubric with a newer version number

# POST update status of template 

# DELETE a template by its id, also delete its template items

