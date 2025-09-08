# To run this command: python manage.py generate_ai_use_scales

from django.core.management.base import BaseCommand
from ai_scale_app.models import AIUseScale  

ROWS = [
    dict(
        code="N",
        title="No AI",
        instructions="No AI use for this task is allowed.",
        acknowledgement_required=False,
        acknowledgement_text="",
        acknowledgement_url="",
        position=1, color="#FF6B6B",
    ),
    dict(
        code="R1",
        title="AI-Assisted Proofreading",
        instructions=(
            "You may use AI tools only for:\n"
            "- Basic spell-checking and grammar-checking (without rewording or rewriting)\n"
            "- Translating individual words (not sentences)"
        ),
        acknowledgement_required=True,
        acknowledgement_text="Students MUST add an AI-use declaration at the end of their submission.",
        acknowledgement_url=("https://students.unimelb.edu.au/academic-skills/resources/"
                             "academic-integrity/acknowledging-AI-tools-and-technologies"),
        position=2, color="#F4B183",
    ),
    dict(
        code="R2",
        title="AI-Assisted Contextual Research",
        instructions=(
            "You may use AI tools only for:\n"
            "- Understanding the broad context (industry overview, general background)"
        ),
        acknowledgement_required=False,
        acknowledgement_text="",
        acknowledgement_url="", position=3, color="#FFF475",
    ),
    dict(
        code="G",
        title="AI for General Learning (not assessment-oriented)",
        instructions=(
            "For general learning, you may use AI for:\n"
            "- Browsing information (not assessment-specific questions)\n"
            "- Explaining concepts with examples/simplified explanations\n"
            "- Creating revision quizzes, flashcards, memorization tools"
        ),
        acknowledgement_required=False,
        acknowledgement_text="N/A",
        acknowledgement_url="", position=4, color="#A9C5D9",
    ),
]

class Command(BaseCommand):
    help = "Generate the AIUseScale table with Levels N, R1, R2, G."

    def handle(self, *args, **kwargs):
        created = updated = 0
        for row in ROWS:
            obj, was_created = AIUseScale.objects.update_or_create(
                code=row["code"], defaults=row
            )
            created += was_created
            updated += (not was_created)
        self.stdout.write(self.style.SUCCESS(
            f"Generated AIUseScale — created={created}, updated={updated}"
        ))
