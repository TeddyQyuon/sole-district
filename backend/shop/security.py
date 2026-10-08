import hashlib
import secrets
from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from .models import AccessToken, EmailOutbox, RateBucket


def rate_limit(request, label, limit, seconds, identity=""):
    # Shared PostgreSQL rows, fixed windows; do not trust arbitrary X-Forwarded-For.
    now = timezone.now()
    window = int(now.timestamp()) // seconds
    address = request.META.get("REMOTE_ADDR", "unknown")[:64]
    key = hashlib.sha256(f"{settings.SECRET_KEY}:{label}:{identity or address}:{window}".encode()).hexdigest()
    with transaction.atomic():
        bucket, _ = RateBucket.objects.get_or_create(
            key=key, defaults={"expires_at": now + timedelta(seconds=seconds * 2)})
        bucket = RateBucket.objects.select_for_update().get(pk=bucket.pk)
        if bucket.count >= limit:
            return False
        bucket.count += 1
        bucket.save(update_fields=["count"])
    return True


def issue_token(purpose, *, user=None, order=None, minutes=30):
    raw = secrets.token_urlsafe(32)
    AccessToken.objects.create(digest=hashlib.sha256(raw.encode()).hexdigest(),
                              purpose=purpose, user=user, order=order,
                              expires_at=timezone.now() + timedelta(minutes=minutes))
    return raw


def consume_token(raw, purpose):
    # Caller must hold an atomic transaction through the protected operation.
    if not isinstance(raw, str) or len(raw) > 128:
        return None
    token = AccessToken.objects.select_for_update().filter(
        digest=hashlib.sha256(raw.encode()).hexdigest(), purpose=purpose,
        used_at__isnull=True, expires_at__gt=timezone.now()).first()
    if token:
        token.used_at = timezone.now()
        token.save(update_fields=["used_at"])
    return token


def queue_email(key, recipient, subject, body):
    if recipient:
        EmailOutbox.objects.get_or_create(key=key, defaults={
            "recipient": recipient, "subject": subject, "body": body})


def account_email(user, purpose):
    raw = issue_token(purpose, user=user, minutes=1440 if purpose == "verify" else 30)
    link = f"{settings.FRONTEND_ORIGIN}/account?action={purpose}#token={raw}"
    subject = "Verify your SOLE DISTRICT email" if purpose == "verify" else "Reset your SOLE DISTRICT password"
    queue_email(f"{purpose}:{hashlib.sha256(raw.encode()).hexdigest()}", user.email,
                subject, f"{subject}\n\n{link}\n\nIf you did not request this, ignore this message.")


def order_email(order, status):
    raw = issue_token("order", order=order)
    link = f"{settings.FRONTEND_ORIGIN}/orders#token={raw}"
    queue_email(f"order:{order.public_id}:{status}", order.customer_email,
                f"SOLE DISTRICT {order.reference}: {status.replace('_', ' ')}",
                f"Order {order.reference}: {status.replace('_', ' ')}.\n"
                f"Total SGD {order.total_cents / 100:.2f}.\n"
                f"Tracking: {order.carrier} {order.tracking_number}\n\n"
                f"Open your order with this single-use link (valid 30 minutes):\n{link}\n"
                "You can request a fresh link from the orders page.")
