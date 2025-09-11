# Run python manage.py hash_passwords
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import identify_hasher

User = get_user_model()


# This rehashes passwords that are incorrectly loaded into the DB via .json file
class Command(BaseCommand):
    def handle(self, *args, **options):
        for u in User.objects.all():
            try:
                # Use existing hashing algorithm
                identify_hasher(u.password)  
                continue  
            except Exception:
                raw = u.password  
                # Rehash original password
                u.set_password(raw)
                u.save()
