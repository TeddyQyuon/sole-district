from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from shop.models import StorefrontEvent


class Command(BaseCommand):
    help = "Delete consented storefront analytics events beyond the configured retention period."

    def handle(self, *args, **options):
        days = max(30, settings.EVENT_RETENTION_DAYS)
        cutoff = timezone.now() - timedelta(days=days)
        deleted, _ = StorefrontEvent.objects.filter(created_at__lt=cutoff).delete()
        self.stdout.write(self.style.SUCCESS(f"Deleted {deleted} event records older than {days} days."))
