from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create the staff role groups used by the merchant workspace."

    def handle(self, *args, **options):
        names = ["owner", "catalogue", "warehouse", "support", "analyst"]
        for name in names:
            Group.objects.get_or_create(name=name)
        self.stdout.write(self.style.SUCCESS("Created owner, catalogue, warehouse, support, and analyst groups."))
        self.stdout.write("Create a Django superuser, then assign non-owner staff to the smallest group they need.")
