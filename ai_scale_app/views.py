from django.shortcuts import render

# Create your views here.
from django.http import HttpResponse, HttpResponseNotFound, JsonResponse
from .models import User
from django.contrib.auth import authenticate, login
from rest_framework import status

def index(request):
    return HttpResponse("Hello, world. You're at the ai scale app index.")

# GET API for fetch user details by their email
def user_details(request, username):
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        # Return error if user email doesn't exist in database
        return HttpResponseNotFound("User not found")

    return JsonResponse({
        "first_name": user.first_name,
        "last_name": user.last_name,
        "username": user.username,
        "role": user.role,
    })

def login(request):
    username = request.data["username"]
    password = request.data["password"]

    user = authenticate(request, username=username, password=password) 
    if user is not None:
        login(request, user)
        return JsonResponse({"success": True, "user": {"id": user.id, "username": user.username}},status=status.HTTP_200_OK,)
    else:
        return JsonResponse({"success": False, "error": "Incorrect login details"}, status=status.HTTP_200_OK,)

def register(request):
    user = User.objects.create_user(
        username=request.data["username"],  # or just use email as username
        password=request.data["password"],
        first_name=request.data["first_name"],
        last_name=request.data["last_name"],
        role=request.data["role"],
    )
    return JsonResponse({"success": True, "user": {"username": user.username}})