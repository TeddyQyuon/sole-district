"""Create the first owner only from credentials entered in protected hosting settings."""
import os

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.core.validators import validate_email
from django.db import transaction


class Command(BaseCommand):
    help = "Initialize the first owner from SOLE_OWNER_USERNAME, SOLE_OWNER_EMAIL and SOLE_OWNER_PASSWORD."

    @transaction.atomic
    def handle(self, *args, **options):
        username = os.getenv("SOLE_OWNER_USERNAME", "").strip()
        email = os.getenv("SOLE_OWNER_EMAIL", "").strip().lower()
        password = os.getenv("SOLE_OWNER_PASSWORD", "")
        if not any((username, email, password)):
            self.stdout.write("Owner credential setup is pending in protected deployment settings.")
            return
        if not all((username, email, password)):
            raise CommandError("Set all three SOLE_OWNER credential fields, or remove them all.")
        User = get_user_model()
        if User.objects.filter(is_superuser=True).exists() or User.objects.filter(groups__name="owner").exists():
            self.stdout.write("Owner already initialized; existing credentials were preserved.")
            return
        if User.objects.filter(username=username).exists() or User.objects.filter(email__iexact=email).exists():
            raise CommandError("An account already uses the proposed owner identity. Resolve it through an authorized administrator.")
        candidate = User(username=username, email=email, is_staff=True, is_superuser=True)
        try:
            validate_email(email)
            candidate.full_clean(exclude=["password"])
            validate_password(password, candidate)
        except ValidationError as exc:
            raise CommandError("Owner credentials did not pass validation.") from exc
        User.objects.create_superuser(username=username, email=email, password=password)
        self.stdout.write("Store owner initialized. Remove the bootstrap credential variables from hosting settings.")
