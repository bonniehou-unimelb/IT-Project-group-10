# ai_scale_app/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("username/", views.user_details, name="user_details"),
    path("auth/login/", views.user_login, name="login"),       
    path("auth/register/", views.register, name="register"),
    path("info/taught_subjects/", views.enrolment_teaching, name="taught_subjects"),
    path("template/update/", views.create_or_update_template, name="update_template"),
    path("templateitem/update/", views.update_template_item, name="update_template_item"),
    path("template/summary/", views.summary_templates, name="summarise_templates"),
    path("template/details/", views.template_details, name="template_details"),
    path("template/delete/", views.delete_template, name = "delete_template"),
    path("template/duplicate/", views.duplicate_template, name="duplicate_template"),
    path("session/", views.curr_user_session, name="user_session"),
    path("logout/", views.user_logout, name="logout"),
    path("token/", views.csrf_token, name="csrf_token")

]
