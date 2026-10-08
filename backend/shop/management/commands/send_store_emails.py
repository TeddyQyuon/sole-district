from django.core.mail import send_mail
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from shop.models import AccessToken, EmailOutbox, RateBucket


class Command(BaseCommand):
    help = "Send up to 50 queued store emails; run periodically with configured SMTP."

    def handle(self, **options):
        sent = 0
        for _ in range(50):
            with transaction.atomic():
                row = EmailOutbox.objects.select_for_update(skip_locked=True).filter(sent_at__isnull=True, attempts__lt=5).order_by("created_at").first()
                if not row:
                    break
                row.attempts += 1
                row.save(update_fields=["attempts"])
                try:
                    send_mail(row.subject, row.body, None, [row.recipient], fail_silently=False)
                except Exception:
                    self.stderr.write("Email delivery failed; queued message retained for retry.")
                    break
                row.sent_at = timezone.now()
                row.save(update_fields=["sent_at"])
                sent += 1
        RateBucket.objects.filter(expires_at__lt=timezone.now()).delete()
        AccessToken.objects.filter(expires_at__lt=timezone.now()).delete()
        # Outbox contains sensitive access links; delete delivered messages after one day.
        from datetime import timedelta
        EmailOutbox.objects.filter(sent_at__lt=timezone.now() - timedelta(days=1)).delete()
        self.stdout.write(f"Sent {sent} queued messages.")
