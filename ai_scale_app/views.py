from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction, IntegrityError
from django.contrib.auth import authenticate, login as auth_login
from .models import User, Subject, Template, TemplateItem, TemplateOwnership, Enrolment, AIUseScale
from http import HTTPStatus
from django.contrib.auth import logout as auth_logout
from django.conf import settings
from django.middleware.csrf import get_token
import json
import logging
from django.db import IntegrityError
import traceback
from django.db.models import Max
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.db.models import Q
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from .models import Template
from django.utils.timezone import now
from .models import AuditLog
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from ai_scale_app.models import AIUseScale, AuditLog


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
    return JsonResponse({"isAuthenticated": False}, status=HTTPStatus.OK)


# GET /info/taught_subjects/?username=...
@require_GET
def enrolment_teaching(request):
    """
    Get all subject info 'taught' by the user.
    We infer 'taught' = subjects that have at least one Template owned by this user.
    """
    username = request.GET.get("username")
    if not username:
        return JsonResponse({"error": "username is required"}, status=HTTPStatus.BAD_REQUEST)

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=HTTPStatus.NOT_FOUND)

    # Subjects connected by templates this user owns
    taught_subjects = (
        Subject.objects
        .filter(template__ownerId=user)   
        .distinct()
        .values("id", "name", "subjectCode", "year", "semester")
    )

    return JsonResponse({"taught_subjects": list(taught_subjects)}, status=HTTPStatus.OK)

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

        role = data.get("role", User.Role.COORDINATOR)
        # Coerce role into a valid enum value
        if role not in User.Role.values:
            role = User.Role.COORDINATOR

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
@csrf_protect
@ensure_csrf_cookie
def user_logout(request):
    """
    Exits the user session
    """
    auth_logout(request)

    resp = JsonResponse({"success": True}, status=HTTPStatus.OK)
    # Remove the session cookie on the client 
    resp.delete_cookie(
        settings.SESSION_COOKIE_NAME,
        path=getattr(settings, "SESSION_COOKIE_PATH", "/"),
        domain=getattr(settings, "SESSION_COOKIE_DOMAIN", None),
        samesite=getattr(settings, "SESSION_COOKIE_SAMESITE", None),
    )
    return resp


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
    subject_code = data.get("subjectCode").strip().upper()
    year = data.get("year")
    semester = data.get("semester")
    old_version_num = data.get("version", 0)
    scope = data.get("scope") or ""
    description = data.get("description") or ""
    is_publishable = data.get("isPublishable", False)
    is_template = data.get("isTemplate", True)


    # Grab subject object based on code, year, semester
    subject, _ = Subject.objects.update_or_create(
        subjectCode=subject_code,                 
        defaults={"year": year, "semester": semester, "name": ""},  
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
        # Locking atomic action generated w ChatGPT
        with transaction.atomic():
            # LOCK all templates for this owner+name so version increments are safe
            qs = Template.objects.select_for_update().filter(ownerId=user, name=name)
            latest = qs.aggregate(Max("version")).get("version__max") or 0
            next_version = latest + 1

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

        return JsonResponse({"success": True, "templateId": t.id, "version": t.version},
                            status=HTTPStatus.CREATED)

    # Generated by ChatGPT
    except IntegrityError:
        # retry once with a new version if error
        with transaction.atomic():
            qs = Template.objects.select_for_update().filter(ownerId=user, name=name)
            latest = qs.aggregate(Max("version")).get("version__max") or 0
            t = Template.objects.create(
                ownerId=user,
                name=name,
                subject=subject,
                scope=scope,
                description=description,
                version=latest + 1,
                isPublishable=is_publishable,
                isTemplate=is_template,
            )
            TemplateOwnership.objects.create(ownerId=user, templateId=t)
        return JsonResponse({"success": True, "templateId": t.id, "version": t.version},
                            status=HTTPStatus.CREATED)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=HTTPStatus.BAD_REQUEST)

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
            "isTemplate": True,
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
        "isTemplate": True,
        "template_items": template_items,
    }, status=HTTPStatus.OK)



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
    from http import HTTPStatus
    from django.contrib.auth import get_user_model
    from django.db import transaction
    from django.http import JsonResponse
    import re

    User = get_user_model()
    data = _body(request)
    template_id = data.get("templateId")
    username = data.get("username") or getattr(request.user, "username", None)

    if not template_id:
        return JsonResponse({"error": "templateId is required"}, status=HTTPStatus.BAD_REQUEST)
    if not username:
        return JsonResponse({"error": "username is required"}, status=HTTPStatus.BAD_REQUEST)

    try:
        from .models import Template, TemplateItem, TemplateOwnership
        user = User.objects.get(username=username) 

        # Generated by ChatGPT
        original = Template.objects.get(pk=int(template_id))
        base_name = re.sub(r" \(\d+\)$", "", original.name or "")

        existing_names = (Template.objects
                          .filter(ownerId=user, name__startswith=base_name)
                          .values_list("name", flat=True))
        max_num = 0
        for nm in existing_names:
            m = re.search(r"\((\d+)\)$", nm or "")
            if m: 
                n = int(m.group(1))
                if n > max_num: max_num = n
        new_name = f"{base_name} ({max_num+1})"

        with transaction.atomic():
            new_template = Template.objects.create(
                ownerId=user,                     
                name=new_name,
                scope=original.scope,
                description=original.description,
                subject=original.subject,        
                version=original.version,
                isPublishable=False,
                isTemplate=True,
            )

            # If your join model uses fields named `template`/`owner`, change them here:
            try:
                TemplateOwnership.objects.create(templateId=new_template, ownerId=user)
            except TypeError:
                TemplateOwnership.objects.create(template=new_template, owner=user)

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

        ownerName = f"{getattr(user,'first_name','')} {getattr(user,'last_name','')}".strip()
        return JsonResponse({
            "success": True,
            "new_template": {
                "templateId": new_template.id,
                "name": new_template.name,
                "version": new_template.version,
                "subjectCode": new_template.subject.subjectCode if new_template.subject else "",
                "year": new_template.subject.year if new_template.subject else None,
                "semester": new_template.subject.semester if new_template.subject else None,
                "ownerName": ownerName or user.username,
                "ownerUsername": user.username,
                "isPublishable": bool(new_template.isPublishable),
                "isTemplate": True,
            }
        }, status=HTTPStatus.CREATED)

    except Exception as e:
        return JsonResponse({"error": f"{type(e).__name__}: {e}"}, status=HTTPStatus.BAD_REQUEST)



# GET /info/subjects_with_templates/?username=... 
@require_GET
def subjects_with_templates(request):
    """
    Returns subjects taught by the user that have at least one template
    owned by the same user, plus a mini summary list of those templates.
    """
    username = request.GET.get("username")
    if not username:
        return JsonResponse({"error": "username is required"}, status=HTTPStatus.BAD_REQUEST)

    include_empty = (request.GET.get("include_empty") or "false").lower() in {"1", "true", "yes"}

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=HTTPStatus.NOT_FOUND)

    # Subjects taught by this user
    taught_qs = Subject.objects.filter(coordinatorId=user).only(
        "id", "name", "subjectCode", "year", "semester"
    )

    # All templates owned by this user on those subjects
    templates_qs = (
        Template.objects
        .filter(ownerId=user, subject__in=taught_qs)
        .select_related("subject", "ownerId")
        .only(
            "id", "name", "version", "isPublishable", "isTemplate",
            "subject__id", "subject__subjectCode", "subject__year", "subject__semester",
            "ownerId__first_name", "ownerId__last_name"
        )
        .order_by("-subject__year", "-subject__semester", "-version", "name")
    )

    # Group templates by subjectCode 
    by_code = {}
    for t in templates_qs:
        scode = t.subject.subjectCode
        by_code.setdefault(scode, []).append({
            "templateId": t.id,
            "name": t.name,
            "version": t.version,
            "subjectCode": t.subject.subjectCode,
            "year": t.subject.year,
            "semester": t.subject.semester,
            "isPublishable": bool(t.isPublishable),
            "isTemplate": True,
            "ownerName": f"{t.ownerId.first_name} {t.ownerId.last_name}".strip(),
        })

    payload = []
    for s in taught_qs:
        templates = by_code.get(s.subjectCode, [])
        if not include_empty and not templates:
            continue
        payload.append({
            "subject": {
                "id": s.id,
                "name": s.name,
                "subjectCode": s.subjectCode,
                "year": s.year,
                "semester": s.semester,
            },
            "templates": templates,
            "templatesCount": len(templates),
        })

    return JsonResponse({"subjects": payload}, status=HTTPStatus.OK)


# GET /template/for_subject/?username=...&subjectCode=...  
# GET all of user's templates for one subject
@require_GET
def templates_for_subject(request):
    username = request.GET.get("username")
    subject_code = request.GET.get("subjectCode")

    user = User.objects.get(username=username)

    try:
        # Optional: restrict to subjects they teach
        subject = Subject.objects.get(subjectCode=subject_code, coordinatorId=user)
    except Subject.DoesNotExist:
        # If you prefer to allow templates even when they don't coordinate, remove coordinatorId=user above
        return JsonResponse({"error": "Subject not found or not coordinated by user"}, status=HTTPStatus.NOT_FOUND)

    tqs = (
        Template.objects
        .filter(ownerId=user, subject=subject)
        .select_related("subject", "ownerId")
        .only(
            "id", "name", "version", "isPublishable", "isTemplate",
            "subject__subjectCode", "subject__year", "subject__semester",
            "ownerId__first_name", "ownerId__last_name"
        )
        .order_by("-year", "-semester", "-version", "name")
    )

    rows = [{
        "templateId": t.id,
        "name": t.name,
        "version": t.version,
        "subjectCode": t.subject.subjectCode,
        "year": t.subject.year,
        "semester": t.subject.semester,
        "isPublishable": bool(t.isPublishable),
        "isTemplate": True,
        "ownerName": f"{t.ownerId.first_name} {t.ownerId.last_name}".strip(),
    } for t in tqs]

    return JsonResponse({
        "subject": {
            "id": subject.id,
            "name": subject.name,
            "subjectCode": subject.subjectCode,
            "year": subject.year,
            "semester": subject.semester,
        },
        "templates": rows,
        "templatesCount": len(rows),
    }, status=HTTPStatus.OK)

@require_GET
def community_templates(request):
    """
    Public list of community templates (publishable + template)
    """
    def _to_int(v, default=None):
        try:
            return int(v)
        except (TypeError, ValueError):
            return default

    q = (request.GET.get("q") or "").strip()
    subject_code = request.GET.get("subjectCode")
    year = _to_int(request.GET.get("year"))
    semester = _to_int(request.GET.get("semester"))
    owner = request.GET.get("owner")
    order = (request.GET.get("order") or "recent").lower()

    # Pagination 
    limit = _to_int(request.GET.get("limit"), 20)
    if limit is None or limit <= 0:
        limit = 20
    limit = min(limit, 100)

    offset = _to_int(request.GET.get("offset"), 0)
    if offset is None or offset < 0:
        offset = 0

    qs = (
        Template.objects
        .filter(isPublishable=True, isTemplate=True)
        .select_related("subject", "ownerId")
        .only(
            "id", "name", "version", "isPublishable", "isTemplate",
            "subject__subjectCode", "subject__year", "subject__semester",
            "ownerId__username", "ownerId__first_name", "ownerId__last_name",
            "description", "scope",
        )
    )

    # Generated by ChatGPT
    # Free-text search
    if q:
        qs = qs.filter(
            Q(name__icontains=q) |
            Q(description__icontains=q) |
            Q(subject__subjectCode__icontains=q) |
            Q(ownerId__username__icontains=q) |
            Q(ownerId__first_name__icontains=q) |
            Q(ownerId__last_name__icontains=q)
        )

    # Filters
    if subject_code:
        qs = qs.filter(subject__subjectCode__iexact=subject_code)
    if year is not None:
        qs = qs.filter(subject__year=year)
    if semester is not None:
        qs = qs.filter(subject__semester=semester)
    if owner:
        qs = qs.filter(ownerId__username__iexact=owner)

    # Sort
    if order == "name":
        qs = qs.order_by("name", "-version")
    elif order == "subject":
        qs = qs.order_by("subject__subjectCode", "-subject__year", "-subject__semester", "name", "-version")
    elif order == "oldest":
        qs = qs.order_by("subject__year", "subject__semester", "name", "version")
    else:  # 'recent'
        qs = qs.order_by("-subject__year", "-subject__semester", "name", "-version")

    total = qs.count()
    page = list(qs[offset: offset + limit])

    results = [{
        "templateId": t.id,
        "name": t.name,
        "version": t.version,
        "subjectCode": t.subject.subjectCode if t.subject else "",
        "year": t.subject.year if t.subject else None,
        "semester": t.subject.semester if t.subject else None,
        "ownerUsername": t.ownerId.username if t.ownerId_id else "",
        "ownerName": f"{t.ownerId.first_name} {t.ownerId.last_name}".strip() if t.ownerId_id else "",
        "isPublishable": bool(t.isPublishable),
        "isTemplate": True,
    } for t in page]

    resp = JsonResponse({
        "count": total,
        "limit": limit,
        "offset": offset,
        "results": results,
    }, status=HTTPStatus.OK)

    return resp

@require_GET
def community_templates(request):
    """
    Returns publishable templates for the homepage 'Community Templates' widget.
    Optional query param: ?limit=4 (default 4)
    """
    # 1) Read ?limit= query param safely
    limit_str = request.GET.get("limit", "4")
    try:
        limit = max(1, int(limit_str))
    except ValueError:
        limit = 4

    # 2) Query publishable templates (newest first)
    # NOTE: If you track "updated_at", use .order_by("-updated_at") instead.
    qs = (
        Template.objects
        .filter(isPublishable=True)
        .select_related("ownerId", "subject")
        .order_by("-id")[:limit]
    )

    # 3) Serialize the items the widget needs
    rows = []
    for t in qs:
        author = "Unknown"
        if getattr(t, "ownerId", None):
            first = getattr(t.ownerId, "first_name", "") or ""
            last  = getattr(t.ownerId, "last_name", "") or ""
            author = (f"{first} {last}").strip() or t.ownerId.username

        subject_code = getattr(getattr(t, "subject", None), "subjectCode", None)
        rows.append({
            "templateId": t.id,
            "title": t.name,
            "author": author,
            "subjectCode": subject_code,
            "tag": t.scope or "General",
            "isTemplate": bool(getattr(t, "isTemplate", False)),
            "isPublishable": bool(getattr(t, "isPublishable", False)),
            # If you add a real popularity metric later, put it here:
            "popularity": 0,
        })

    return JsonResponse({"templates": rows})

def system_overview(request):
    """
    Returns overall statistics for dashboard display.
    """

    total_users = User.objects.count()
    total_subjects = Subject.objects.count()
    total_templates = Template.objects.count()
    active_coordinators = User.objects.filter(role=User.Role.COORDINATOR, is_active=True).count()

    data = {
        "totalUsers": total_users,
        "subjects": total_subjects,
        "templates": total_templates,
        "activeCoordinators": active_coordinators,
    }

    return JsonResponse(data)


def recent_activity(request):
    recent_users = list(User.objects.order_by('-date_joined')[:5].values('username', 'date_joined'))
    recent_subjects = list(Subject.objects.order_by('-id')[:5].values('name', 'subjectCode', 'year', 'semester'))
    recent_templates = list(Template.objects.order_by('-id')[:5].values('name', 'version'))

    return JsonResponse({
        "recentUsers": recent_users,
        "recentSubjects": recent_subjects,
        "recentTemplates": recent_templates,
        "timestamp": now().isoformat()
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def update_ai_use_scale(request):
    try:
        data = request.data
        scale_id = data.get("id")
        name = data.get("name")

        if scale_id:
            # Update existing
            scale = AIUseScale.objects.get(id=scale_id)
            scale.name = name
            scale.save()

            AuditLog.objects.create(
                user=request.user if request.user.is_authenticated else None,
                action="UPDATE",
                model_name="AIUseScale",
                object_id=scale.id,
                details={"name": name},
            )
        else:
            # Create new
            scale = AIUseScale.objects.create(name=name)

            AuditLog.objects.create(
                user=request.user if request.user.is_authenticated else None,
                action="CREATE",
                model_name="AIUseScale",
                object_id=scale.id,
                details={"name": name},
            )

        return Response({"success": True, "id": scale.id})
    except Exception as e:
        return Response({"error": str(e)}, status=400)