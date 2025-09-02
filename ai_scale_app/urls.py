from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("username/<str:username>/", views.user_details, name="user_details"),
    path("auth/login", views.login, name="login"),
    path("auth/register", views.register, name="register"),
]