# ai_scale_app/urls.py
from django.urls import path
from . import views
from .views import community_templates

urlpatterns = [
    path("", views.index, name="index"),
    path("api/health/", views.health_check, name="health_check"),
    path("username/", views.user_details, name="user_details"),
    path("auth/login/", views.user_login, name="login"),
    path("auth/register/", views.register, name="register"),
    path("info/taught_subjects/", views.enrolment_teaching, name="taught_subjects"),
    path("template/update/", views.create_or_update_template, name="update_template"),
    path(
        "templateitem/update/", views.update_template_item, name="update_template_item"
    ),
    path("template/summary/", views.summary_templates, name="summarise_templates"),
    path("template/details/", views.template_details, name="template_details"),
    path("template/delete/", views.delete_template, name="delete_template"),
    path("template/duplicate/", views.duplicate_template, name="duplicate_template"),
    path("session/", views.curr_user_session, name="user_session"),
    path("logout/", views.user_logout, name="logout"),
    path("token/", views.csrf_token, name="csrf_token"),
    path(
        "info/subjects_with_templates/",
        views.subjects_with_templates,
        name="subjects_templates",
    ),
    path(
        "template/for_subject/",
        views.templates_for_subject,
        name="template_for_subject",
    ),
    path("templates/community/", views.community_templates, name="community_templates"),
    path("auth/csrf/", views.csrf_token, name="csrf_token"),
    path("system-overview/", views.system_overview, name="system-overview"),
    path("system-overview/", views.system_overview, name="system-overview"),
    path("recent-activity/", views.recent_activity, name="recent-activity"),
    path("api/community/templates/", community_templates, name="community-templates"),
    path("api/templates/versions/", views.list_template_versions, name="template_versions")
]
