from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import (
    User, Subject, Enrolment, Template, TemplateOwnership, TemplateItem, AcknowledgementForm, AcknowledgementFormItem,
    AIUseScale,  
)

@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = ("username", "email", "first_name", "last_name", "role", "is_staff")
    list_filter = DjangoUserAdmin.list_filter + ("role",)
    fieldsets = DjangoUserAdmin.fieldsets + (("Role", {"fields": ("role",)}),)

class TemplateItemInline(admin.TabularInline):
    model = TemplateItem
    extra = 0

@admin.register(Template)
class TemplateAdmin(admin.ModelAdmin):
    list_display = ("name", "ownerId", "scope")
    search_fields = ("name", "scope", "description")
    inlines = [TemplateItemInline]

# --- The rest are fine as basic registrations ---
admin.site.register(Subject)
admin.site.register(Enrolment)
admin.site.register(TemplateOwnership)
admin.site.register(AcknowledgementForm)
admin.site.register(AcknowledgementFormItem)
admin.site.register(AIUseScale)

