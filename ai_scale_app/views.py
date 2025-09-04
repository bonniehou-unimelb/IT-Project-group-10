from django.shortcuts import render

# Create your views here.
from django.http import HttpResponse, HttpResponseNotFound, JsonResponse
from .models import User, Enrolment, Subject
from django.contrib.auth import authenticate, login
from rest_framework import status
from django.views.decorators.http import require_GET

def index(request):
    return HttpResponse("Hello. You're at the ai scale app index.")

# GET API for fetch user details by their email
@require_GET
def user_details(request):
    username = request.GET.get("username")

    # user does not exist in database
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return JsonResponse({"error":"User not found"})

    return JsonResponse({
        "first_name": user.first_name,
        "last_name": user.last_name,
        "username": user.username,
        "role": user.role,
    })

# GET request for fetching relevant subject details that subject cooridnator is teaching
@require_GET
def enrolment_teaching(request):
    username = request.GET.get("username")
    # user does not exist in database
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return JsonResponse({"error":"User not found"})
    
    if (user.role=="COORDINATOR" or user.role=="Coordinator" or user.role=="Staff" or user.role=="Staff"):
        # returns subjects that the user teaches/manages
        relevant_subjects = (
            Subject.objects
            .filter(coordinatorId=user)
            .values("id", "name", "subjectCode")
        )
        taught_subjects = list(relevant_subjects)
        return JsonResponse({"taught_subjects": taught_subjects}, status=200)
    else:
        # user is a student, so can't teach anything
        return JsonResponse({"taught_subjects": list("")}, status=200)



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
        username=request.data["username"],  # email is username
        password=request.data["password"],
        first_name=request.data["first_name"],
        last_name=request.data["last_name"],
        role=request.data["role"],
    )
    return JsonResponse({"success": True, "user": {"username": user.username}})