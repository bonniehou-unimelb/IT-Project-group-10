from django.contrib import admin

# Register your models here.
from .models import User
from .models import Subject
from .models import Enrolment
from .models import Template
from .models import TemplateOwnership
from .models import TemplateItem
from .models import Rubric
from .models import RubricItem
from .models import AcknowledgementForm
from .models import AcknowledgementFormItem

admin.site.register(User)
admin.site.register(Subject)
admin.site.register(Enrolment)
admin.site.register(Template)
admin.site.register(TemplateOwnership)
admin.site.register(TemplateItem)
admin.site.register(Rubric)
admin.site.register(RubricItem)
admin.site.register(AcknowledgementForm)
admin.site.register(AcknowledgementFormItem)
