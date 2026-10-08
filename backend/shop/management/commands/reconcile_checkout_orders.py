from datetime import timedelta

import stripe
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from shop.api import _mark_order_paid, _release_reservations
from shop.models import Order


class Command(BaseCommand):
    help = "Reconcile known Stripe Checkout sessions and report uncertain sessions that need same-key retry."

    def handle(self, *args, **options):
        if not settings.STRIPE_SECRET_KEY:
            self.stderr.write("STRIPE_SECRET_KEY is not configured.")
            return
        stripe.api_key = settings.STRIPE_SECRET_KEY
        cutoff = timezone.now() - timedelta(minutes=30)
        orders = Order.objects.filter(
            status__in=["pending", "payment_pending"],
            created_at__lt=cutoff,
        ).prefetch_related("items")
        for order in orders:
            if not order.stripe_session_id:
                self.stdout.write(
                    f"{order.reference}: no stored Stripe session id. Retry the original checkout with its same idempotency key; do not release stock automatically."
                )
                continue
            try:
                session = stripe.checkout.Session.retrieve(order.stripe_session_id)
                with transaction.atomic():
                    locked = Order.objects.select_for_update().get(pk=order.pk)
                    if session.payment_status == "paid":
                        _mark_order_paid(locked, session)
                        self.stdout.write(self.style.SUCCESS(f"{order.reference}: marked paid from Stripe."))
                    elif session.status == "expired":
                        _release_reservations(locked, "expired", "unpaid")
                        self.stdout.write(f"{order.reference}: expired and stock released.")
                    else:
                        self.stdout.write(f"{order.reference}: still awaiting payment ({session.status}/{session.payment_status}).")
            except stripe.error.StripeError as exc:
                self.stderr.write(f"{order.reference}: Stripe lookup failed: {exc.__class__.__name__}.")
