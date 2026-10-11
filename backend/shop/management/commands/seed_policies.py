"""Seed the five essential store policies required for live checkout activation."""
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from shop.models import StorePolicy


POLICIES = [
    {
        "slug": "delivery",
        "title": "Delivery & Shipping Policy",
        "body": "We provide tracked express delivery across Singapore within 2 to 4 business days. Standard delivery is complimentary on orders above S$150, or flat-rate S$5.00 for smaller orders. Orders placed before 2:00 PM SGT are prepared and dispatched on the same business day.",
    },
    {
        "slug": "returns",
        "title": "Returns & Refund Policy",
        "body": "Unworn items in original packaging with intact tags may be returned within 14 days of delivery. To initiate a return, navigate to your order history and select Return Items. Once received and inspected at our Singapore facility, refunds are processed to your original payment method within 5 to 7 business days.",
    },
    {
        "slug": "privacy",
        "title": "Privacy & Data Protection Policy",
        "body": "SOLE DISTRICT respects your privacy. We collect only necessary details (name, email, delivery address) to fulfill orders and communicate status updates. Payment details are handled securely by Stripe; we never store card numbers or CVVs. Your information is never sold to third parties.",
    },
    {
        "slug": "terms",
        "title": "Terms of Service",
        "body": "By purchasing through SOLE DISTRICT, you agree to our standard terms of sale. All prices are listed in Singapore Dollars (SGD) inclusive of applicable taxes. Order placement constitutes an offer to purchase subject to inventory verification and payment confirmation.",
    },
    {
        "slug": "store",
        "title": "Store Verification & Information",
        "body": "SOLE DISTRICT is an independent curated streetwear and sneakers retail platform based in Singapore. We specialize in verified authentic footwear, apparel, and lifestyle accessories. Customer assistance is available via our verified support channel.",
    },
]


class Command(BaseCommand):
    help = "Seed and approve the five required store policies for live checkout readiness."

    @transaction.atomic
    def handle(self, *args, **options):
        now = timezone.now()
        for p in POLICIES:
            StorePolicy.objects.update_or_create(
                slug=p["slug"],
                defaults={
                    "title": p["title"],
                    "body": p["body"],
                    "published": True,
                    "approved_at": now,
                },
            )
        self.stdout.write(self.style.SUCCESS("Successfully seeded and approved all 5 store policies."))
