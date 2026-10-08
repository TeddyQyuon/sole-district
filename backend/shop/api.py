import hashlib
import json
import logging
import math
import re
import uuid
from collections import defaultdict
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from functools import wraps

import stripe
from django.conf import settings
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import DatabaseError, IntegrityError, connection, transaction
from django.db.models import Count, F, Max, Q, Sum
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_GET, require_POST, require_http_methods

from .models import (
    Brand, Category, CustomerAddress, InventoryMovement, Order, OrderItem,
    Product, ProductVariant, ReturnRequest, StockLot, StorefrontEvent,
    StripeWebhookEvent,
    RefundRecord, SourcingReview, OrderUpdate,
    StorePolicy,
)
from .security import rate_limit as _rate_limit, order_email

logger = logging.getLogger(__name__)
User = get_user_model()
MAX_CART_LINES = 20
MAX_LINE_QUANTITY = 10
ROLE_GROUPS = {
    "owner": {"owner"},
    "catalogue": {"owner", "catalogue"},
    "inventory": {"owner", "catalogue", "warehouse"},
    "orders": {"owner", "support", "warehouse"},
    "returns": {"owner", "support"},
    "analytics": {"owner", "analyst"},
    "customers": {"owner", "support", "analyst"},
}


def _json_body(request):
    if not request.body:
        return {}
    try:
        value = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise ValueError("Please send valid JSON.")
    if not isinstance(value, dict):
        raise ValueError("The request body must be a JSON object.")
    return value


def _error(message, status=400, **extra):
    return JsonResponse({"error": message, **extra}, status=status)


def csrf_failure(request, reason=""):
    return _error("Your secure session expired. Please retry the action.", 403, csrf_error=True)


def _session_key(request):
    if not request.session.session_key:
        request.session.create()
    return request.session.session_key


def _session_hash(session_key):
    return hashlib.sha256((settings.SECRET_KEY + ":" + (session_key or "")).encode()).hexdigest()


def _stripe_ready():
    if not (settings.STRIPE_CHECKOUT_ENABLED and settings.STRIPE_SECRET_KEY and settings.STRIPE_WEBHOOK_SECRET):
        return False
    if not settings.STRIPE_SECRET_KEY.startswith(("sk_live_", "sk_test_")):
        return False
    if settings.STRIPE_SECRET_KEY.startswith("sk_live_") and not (
        settings.LIVE_COMMERCE_ENABLED and settings.STORE_POLICIES_APPROVED
        and settings.LIVE_TESTS_CONFIRMED
        and settings.DATABASES["default"]["ENGINE"].endswith("postgresql")
        and settings.EMAIL_HOST and "example.invalid" not in settings.DEFAULT_FROM_EMAIL
        and StorePolicy.objects.filter(slug__in=["delivery", "returns", "privacy", "terms", "store"],
            published=True, approved_at__isnull=False).count() == 5):
        return False
    return True


def _store_state():
    key = settings.STRIPE_SECRET_KEY
    mode = "live" if key.startswith("sk_live_") else "test" if key.startswith("sk_test_") else "unconfigured"
    return {
        "checkout_ready": _stripe_ready(),
        "mode": mode,
        "preview": not _stripe_ready(),
        "sample_catalogue": Product.objects.filter(status="active", is_illustrative=True).exists(),
        "contact_ready": bool(settings.STORE_SUPPORT_EMAIL),
    }


@require_GET
@never_cache
def health(request):
    try:
        # Check an application table so an unmigrated database cannot report readiness.
        Product.objects.exists()
        ready = _stripe_ready()
    except DatabaseError:
        logger.warning("Store database readiness check failed.")
        return _error("The store is temporarily unavailable.", 503)
    return JsonResponse({"status": "ok", "database": connection.vendor, "checkout_ready": ready})


def _product_payload(product):
    variants = list(product.variants.filter(active=True))
    images = list(product.images.all())
    product_image = images[0].image_url if images else product.image_url
    return {
        "id": product.slug,
        "brand": product.brand.name,
        "name": product.name,
        "category": product.category.name,
        "price": product.price_cents,
        "color": product.colour,
        "image": product_image,
        "images": [
            {"url": image.image_url, "alt": image.alt_text}
            for image in images
        ] or ([{"url": product.image_url, "alt": product.image_alt or product.name}] if product.image_url else []),
        "description": product.description,
        "detail": product.details,
        "illustrative": product.is_illustrative,
        "sourcing_status": product.sourcing_status,
        "sellable": product.sellable,
        "featured": product.featured,
        "sizes": [variant.size for variant in variants],
        "unavailable": [variant.size for variant in variants if variant.available <= 0],
        "variants": [
            {
                "id": "sku:" + variant.sku,
                "legacy_id": product.slug + ":" + variant.size,
                "colour": variant.colour,
                "sku": variant.sku,
                "size": variant.size,
                "size_system": variant.size_system,
                "available": variant.available,
                "price": variant.effective_price_cents,
                "sellable": product.sellable and variant.active,
            }
            for variant in variants
        ],
    }


def _order_visible_to_request(order, request):
    grant = request.session.get("order_grants", {}).get(str(order.public_id), 0)
    if isinstance(grant, int) and grant > timezone.now().timestamp():
        return True
    if request.user.is_authenticated:
        return order.user_id == request.user.id or order.session_key == request.session.session_key
    return bool(order.session_key and order.session_key == request.session.session_key)


def _order_payload(order, include_items=True):
    result = {
        "id": str(order.public_id),
        "reference": order.reference,
        "status": order.status,
        "payment_status": order.payment_status,
        "created": order.created_at.isoformat(),
        "paid_at": order.paid_at.isoformat() if order.paid_at else None,
        "subtotal": order.subtotal_cents,
        "delivery": order.delivery_cents,
        "total": order.total_cents,
        "currency": order.currency,
        "tracking_number": order.tracking_number,
        "carrier": order.carrier,
        "timeline": [{"status": row.status, "message": row.message, "created": row.created_at.isoformat()} for row in order.updates.all()],
        "returns": [{"id": row.pk, "line_id": row.order_item_id, "status": row.status, "quantity": row.requested_quantity} for row in order.return_requests.all()],
    }
    if include_items:
        result["items"] = [
            {
                "line_id": item.pk,
                "variant_id": item.variant_key or (item.product.slug + ":" + item.size if item.product_id else item.sku),
                "colour": item.colour,
                "size_system": item.size_system,
                "returned_quantity": item.returned_quantity,
                "sku": item.sku,
                "name": item.brand_name + " " + item.product_name,
                "size": item.size,
                "quantity": item.quantity,
                "unit_price": item.unit_price_cents,
            }
            for item in order.items.all()
        ]
    return result


def _require_staff(request, scope):
    if not request.user.is_authenticated or not request.user.is_staff:
        return _error("Staff sign-in required.", 401)
    allowed = ROLE_GROUPS.get(scope, {"owner"})
    if request.user.is_superuser or request.user.groups.filter(name__in=allowed).exists():
        return None
    return _error("Your staff role does not have access to this section.", 403)


def staff_endpoint(scope):
    def decorate(view):
        @wraps(view)
        def wrapped(request, *args, **kwargs):
            denied = _require_staff(request, scope)
            if denied:
                return denied
            return view(request, *args, **kwargs)
        return wrapped
    return decorate


@require_GET
def csrf_token(request):
    request.session["csrf_initialized"] = True
    return JsonResponse({"csrf": get_token(request), "authenticated": request.user.is_authenticated})


@require_GET
def catalog(request):
    products = Product.objects.filter(status="active", brand__active=True, category__active=True).select_related("brand", "category").prefetch_related("variants", "images")
    query = request.GET.get("q", "").strip()[:100]
    category = request.GET.get("category", "").strip()[:80]
    brand = request.GET.get("brand", "").strip()[:100]
    size = request.GET.get("size", "").strip()[:32]
    stock = request.GET.get("stock") == "true"
    if query:
        products = products.filter(
            Q(name__icontains=query) | Q(brand__name__icontains=query) |
            Q(colour__icontains=query) | Q(category__name__icontains=query)
        )
    if category:
        products = products.filter(category__name__iexact=category)
    if brand:
        products = products.filter(brand__name__iexact=brand)
    if size:
        products = products.filter(variants__size__iexact=size, variants__active=True)
    if stock:
        products = products.filter(variants__stock_on_hand__gt=F("variants__reserved_stock"), variants__active=True)
    products = products.distinct()[:120]
    return JsonResponse({
        "products": [_product_payload(product) for product in products],
        "store": _store_state(),
    })


@require_POST
def set_analytics_consent(request):
    try:
        body = _json_body(request)
    except ValueError as exc:
        return _error(str(exc))
    choice = body.get("consent")
    if not isinstance(choice, bool):
        return _error("Choose whether to allow optional analytics.")
    request.session["analytics_consent"] = choice
    return JsonResponse({"consent": choice})


@require_POST
def track_event(request):
    if not request.session.get("analytics_consent", False):
        return _error("Analytics consent is required.", 403)
    if request.user.is_authenticated and request.user.is_staff:
        return JsonResponse({"accepted": False, "reason": "staff-excluded"})
    try:
        body = _json_body(request)
        event_id = uuid.UUID(str(body.get("event_id", "")))
    except (ValueError, TypeError, AttributeError):
        return _error("A valid event id is required.")
    event_type = body.get("event_type")
    allowed = {key for key, _ in StorefrontEvent.EVENT_TYPES if key != "purchase_confirmed"}
    if event_type not in allowed:
        return _error("This event type is not accepted.")
    session_key = _session_key(request)
    product = None
    product_slug = str(body.get("product_id", ""))[:200]
    if product_slug:
        product = Product.objects.filter(slug=product_slug).first()
    result_count = body.get("result_count")
    if result_count is not None:
        try:
            result_count = max(0, min(int(result_count), 10000))
        except (TypeError, ValueError):
            return _error("Result count must be a number.")
    event, created = StorefrontEvent.objects.get_or_create(
        event_id=event_id,
        defaults={
            "event_type": event_type,
            "session_hash": _session_hash(session_key),
            "product": product,
            "result_count": result_count,
            "campaign_source": str(body.get("campaign_source", ""))[:100],
            "campaign_medium": str(body.get("campaign_medium", ""))[:100],
            "campaign_name": str(body.get("campaign_name", ""))[:120],
            "user": request.user if request.user.is_authenticated else None,
            "consented": True,
        },
    )
    campaign = {
        "source": str(body.get("campaign_source", ""))[:100],
        "medium": str(body.get("campaign_medium", ""))[:100],
        "name": str(body.get("campaign_name", ""))[:120],
    }
    if campaign["source"] or campaign["medium"] or campaign["name"]:
        request.session["campaign_attribution"] = campaign
    return JsonResponse({"accepted": created, "duplicate": not created}, status=202)


def _resolve_variant_key(value):
    if isinstance(value, str) and value.startswith("sku:"):
        try:
            return ProductVariant.objects.select_related("product", "product__brand", "product__category").get(
                sku=value[4:], active=True, product__status="active")
        except ProductVariant.DoesNotExist:
            raise ValueError("This variant is no longer available.")
    if not isinstance(value, str) or ":" not in value:
        raise ValueError("Each cart item needs a valid size variant.")
    slug, size = value.split(":", 1)
    if not slug or not size or len(slug) > 200 or len(size) > 32:
        raise ValueError("A cart variant is invalid.")
    try:
        return ProductVariant.objects.select_related("product", "product__brand", "product__category").get(
            product__slug=slug, size=size, active=True, product__status="active"
        )
    except (ProductVariant.DoesNotExist, ProductVariant.MultipleObjectsReturned):
        raise ValueError("One of the selected sizes is no longer available.")


def _cart_fingerprint(items):
    packed = json.dumps(sorted(items), separators=(",", ":"))
    return hashlib.sha256(packed.encode()).hexdigest()


def _create_or_reuse_order(request, items, checkout_key):
    if not isinstance(items, list) or not items or len(items) > MAX_CART_LINES:
        raise ValueError("Your bag must contain between 1 and 20 different items.")
    quantities = {}
    for item in items:
        if not isinstance(item, dict):
            raise ValueError("A cart item is invalid.")
        variant_key = item.get("variant_id")
        quantity = item.get("quantity")
        if not isinstance(variant_key, str) or not isinstance(quantity, int) or isinstance(quantity, bool):
            raise ValueError("A cart item is invalid.")
        if quantity < 1 or quantity > MAX_LINE_QUANTITY:
            raise ValueError("Each quantity must be between 1 and 10.")
        if variant_key in quantities:
            raise ValueError("Your bag contains a repeated size. Refresh your bag and try again.")
        quantities[variant_key] = quantity
    fingerprint = _cart_fingerprint([[key, quantities[key]] for key in sorted(quantities)])
    session_key = _session_key(request)
    existing = Order.objects.filter(checkout_key=checkout_key).first()
    if existing:
        if existing.cart_fingerprint != fingerprint:
            raise ValueError("This checkout attempt was already used for a different bag. Start a new checkout.")
        if not _order_visible_to_request(existing, request):
            raise PermissionError("This checkout attempt belongs to another browser session.")
        return existing, False

    with transaction.atomic():
        locked = {}
        resolved = {key: _resolve_variant_key(key) for key in quantities}
        if len({variant.pk for variant in resolved.values()}) != len(resolved):
            raise ValueError("Your bag repeats the same SKU.")
        for key, variant in sorted(resolved.items(), key=lambda pair: pair[1].pk):
            locked[key] = ProductVariant.objects.select_for_update(of=("self",)).select_related(
                "product", "product__brand", "product__category"
            ).get(pk=variant.pk)
        subtotal = 0
        order_lines = []
        for key, quantity in quantities.items():
            variant = locked[key]
            if not variant.product.sellable:
                raise ValueError("A product in your bag is not cleared for sale yet.")
            if variant.available < quantity:
                raise ValueError("A selected size no longer has enough stock. Update your bag and try again.")
            unit_price = variant.effective_price_cents
            subtotal += unit_price * quantity
            cost = variant.effective_cost_cents
            if cost is None:
                lots = list(StockLot.objects.filter(variant=variant, quantity_remaining__gt=0).order_by("received_at"))
                if lots and all(lot.unit_cost_cents is not None for lot in lots):
                    weighted = sum(lot.quantity_remaining * lot.unit_cost_cents for lot in lots)
                    count = sum(lot.quantity_remaining for lot in lots)
                    cost = int(weighted / count) if count else None
            order_lines.append((variant, quantity, unit_price, cost))
        delivery = 0 if subtotal >= 15000 else 800
        order = Order.objects.create(
            user=request.user if request.user.is_authenticated else None,
            session_key=session_key,
            checkout_key=checkout_key,
            cart_fingerprint=fingerprint,
            subtotal_cents=subtotal,
            delivery_cents=delivery,
            total_cents=subtotal + delivery,
            payment_mode="live" if settings.STRIPE_SECRET_KEY.startswith("sk_live_") else "test",
            customer_email=request.user.email if request.user.is_authenticated else "",
            analytics_consent=bool(request.session.get("analytics_consent", False)) and not (request.user.is_authenticated and request.user.is_staff),
            campaign_source=(request.session.get("campaign_attribution") or {}).get("source", ""),
            campaign_medium=(request.session.get("campaign_attribution") or {}).get("medium", ""),
            campaign_name=(request.session.get("campaign_attribution") or {}).get("name", ""),
        )
        for variant, quantity, unit_price, cost in order_lines:
            variant.reserved_stock += quantity
            variant.save(update_fields=["reserved_stock"])
            OrderItem.objects.create(
                order=order,
                product=variant.product,
                variant=variant,
                product_name=variant.product.name,
                brand_name=variant.product.brand.name,
                size=variant.size,
                sku=variant.sku,
                variant_key=next(key for key, value in locked.items() if value.pk == variant.pk),
                colour=variant.colour,
                size_system=variant.size_system,
                quantity=quantity,
                unit_price_cents=unit_price,
                unit_cost_cents=cost,
            )
    return order, True


def _stripe_checkout(order):
    stripe.api_key = settings.STRIPE_SECRET_KEY
    lines = []
    for item in order.items.select_related("product").all():
        lines.append({
            "quantity": item.quantity,
            "price_data": {
                "currency": "sgd",
                "unit_amount": item.unit_price_cents,
                "product_data": {
                    "name": item.brand_name + " " + item.product_name + " · " + item.size,
                    "metadata": {"sku": item.sku},
                },
            },
        })
    shipping_line = {
        "shipping_rate_data": {
            "type": "fixed_amount",
            "fixed_amount": {"amount": order.delivery_cents, "currency": "sgd"},
            "display_name": "Singapore delivery",
            "delivery_estimate": {
                "minimum": {"unit": "business_day", "value": 2},
                "maximum": {"unit": "business_day", "value": 5},
            },
        }
    }
    params = {
        "mode": "payment",
        "payment_method_types": settings.STRIPE_ALLOWED_METHODS,
        "line_items": lines,
        "shipping_options": [shipping_line],
        "shipping_address_collection": {"allowed_countries": ["SG"]},
        "expires_at": int(timezone.now().timestamp()) + 1800,
        "phone_number_collection": {"enabled": True},
        "billing_address_collection": "auto",
        "client_reference_id": str(order.public_id),
        "metadata": {
            "order_id": str(order.public_id),
            "order_reference": order.reference,
            "commerce_mode": "live" if settings.STRIPE_SECRET_KEY.startswith("sk_live_") else "test",
        },
        "success_url": settings.FRONTEND_ORIGIN + "/checkout/complete?session_id={CHECKOUT_SESSION_ID}",
        "cancel_url": settings.FRONTEND_ORIGIN + "/checkout?cancelled=" + str(order.public_id),
        "submit_type": "pay",
    }
    if order.customer_email:
        params["customer_email"] = order.customer_email
    idem = "sole-district-" + hashlib.sha256(order.checkout_key.encode()).hexdigest()
    return stripe.checkout.Session.create(**params, idempotency_key=idem)


@require_POST
def checkout(request):
    if not _stripe_ready():
        return _error("Checkout is not enabled. Configure Stripe test credentials and the webhook before accepting purchases.", 503, checkout_ready=False)
    if not _rate_limit(request, "checkout", 12, 600):
        return _error("Too many checkout attempts. Please wait a few minutes and try again.", 429)
    checkout_key = request.headers.get("Idempotency-Key", "").strip()
    if not re.fullmatch(r"[A-Za-z0-9_-]{20,180}", checkout_key):
        return _error("A valid checkout attempt key is required.")
    try:
        body = _json_body(request)
        order, _ = _create_or_reuse_order(request, body.get("items"), checkout_key)
    except PermissionError as exc:
        return _error(str(exc), 403)
    except ValueError as exc:
        return _error(str(exc), 400)
    except IntegrityError:
        return _error("This checkout attempt is already being processed. Retry with the same key.", 409)
    if order.stock_finalized_at or order.status not in {"pending", "payment_pending"}:
        return _error("This checkout is closed. Start a new checkout from your bag.", 409)
    if order.stripe_session_url and order.stripe_session_id:
        if order.status not in {"pending", "payment_pending"} or order.stock_finalized_at:
            return _error("This checkout is closed. Start a new checkout from your bag.", 409)
        return JsonResponse({"url": order.stripe_session_url, "order_id": str(order.public_id), "reference": order.reference})
    try:
        session = _stripe_checkout(order)
        order.stripe_session_id = session.id
        order.stripe_session_url = session.url
        if getattr(session, "customer_email", None):
            order.customer_email = session.customer_email
        order.save(update_fields=["stripe_session_id", "stripe_session_url", "customer_email", "updated_at"])
        return JsonResponse({"url": session.url, "order_id": str(order.public_id), "reference": order.reference})
    except stripe.error.StripeError:
        logger.warning("Stripe checkout request failed for order %s", order.reference)
        return _error("Stripe could not open checkout. Retry this same checkout attempt; your cart and stock reservation are being held safely.", 502, retry_same_attempt=True)
    except Exception:
        logger.error("Checkout failed for order %s", order.reference)
        return _error("Checkout could not be opened. Retry this same checkout attempt.", 502, retry_same_attempt=True)


def _release_reservations(order, final_status, payment_status):
    if order.stock_finalized_at or order.paid_at:
        return
    for item in order.items.select_for_update().order_by("variant_id", "id"):
        if item.reserved and item.variant_id:
            variant = ProductVariant.objects.select_for_update().get(pk=item.variant_id)
            if variant.reserved_stock < item.quantity:
                raise RuntimeError("Stock reservation mismatch")
            variant.reserved_stock -= item.quantity
            variant.save(update_fields=["reserved_stock"])
            item.reserved = False
            item.save(update_fields=["reserved"])
    order.status = final_status
    order.payment_status = payment_status
    order.stock_finalized_at = timezone.now()
    order.save(update_fields=["status", "payment_status", "stock_finalized_at", "updated_at"])


def _consume_stock_lots(variant, quantity):
    lots = list(StockLot.objects.select_for_update().filter(variant=variant, quantity_remaining__gt=0).order_by("received_at", "id"))
    remaining = quantity
    total_cost = 0
    total_cost_units = 0
    while remaining and lots:
        lot = lots[0]
        take = min(remaining, lot.quantity_remaining)
        lot.quantity_remaining -= take
        lot.save(update_fields=["quantity_remaining"])
        if lot.unit_cost_cents is not None:
            total_cost += take * lot.unit_cost_cents
            total_cost_units += take
        remaining -= take
        if lot.quantity_remaining == 0:
            lots.pop(0)
    if remaining:
        return None
    return total_cost // total_cost_units if total_cost_units == quantity else None


def _mark_order_paid(order, checkout_session):
    if order.paid_at:
        return
    if order.stock_finalized_at:
        raise ValueError("Payment arrived after stock release; manual reconciliation required")
    for item in order.items.select_for_update().order_by("variant_id", "id"):
        if item.variant_id:
            variant = ProductVariant.objects.select_for_update().get(pk=item.variant_id)
            if variant.reserved_stock < item.quantity or variant.stock_on_hand < item.quantity:
                raise RuntimeError("Reserved stock is inconsistent for order " + order.reference)
            actual_cost = _consume_stock_lots(variant, item.quantity)
            variant.stock_on_hand -= item.quantity
            variant.reserved_stock -= item.quantity
            variant.save(update_fields=["stock_on_hand", "reserved_stock"])
            if actual_cost is not None:
                item.unit_cost_cents = actual_cost
            InventoryMovement.objects.create(
                variant=variant,
                movement_type="sale",
                quantity_change=-item.quantity,
                reason="Paid order " + order.reference,
                order=order,
            )
            item.reserved = False
            item.save(update_fields=["reserved", "unit_cost_cents"])
    order.payment_status = "paid"
    order.status = "paid"
    order.paid_at = timezone.now()
    order.stock_finalized_at = timezone.now()
    details = checkout_session.get("customer_details") or {}
    order.customer_email = details.get("email") or checkout_session.get("customer_email") or order.customer_email
    order.customer_phone = details.get("phone") or order.customer_phone
    shipping = (checkout_session.get("collected_information") or {}).get("shipping_details") or checkout_session.get("shipping_details") or {}
    if shipping.get("address"):
        address = shipping["address"]
        order.shipping_address = {
            "name": shipping.get("name", ""),
            **{key: address.get(key, "") for key in ["line1", "line2", "city", "postal_code", "country"]},
        }
    order.stripe_payment_intent_id = str(checkout_session.get("payment_intent") or "")
    order.save(update_fields=[
        "payment_status", "status", "paid_at", "stock_finalized_at",
        "customer_email", "customer_phone", "shipping_address",
        "stripe_payment_intent_id", "updated_at",
    ])
    OrderUpdate.objects.create(order=order, status="paid", message="Payment confirmed by Stripe.")
    order_email(order, "paid")
    if order.analytics_consent:
        StorefrontEvent.objects.get_or_create(
            event_id=uuid.uuid5(uuid.NAMESPACE_URL, "sole-district-order:" + str(order.public_id)),
            defaults={
                "event_type": "purchase_confirmed",
                "session_hash": _session_hash(order.session_key),
                "order": order,
                "user": order.user,
                "consented": True,
                "campaign_source": order.campaign_source,
                "campaign_medium": order.campaign_medium,
                "campaign_name": order.campaign_name,
            },
        )


def _process_stripe_event(event):
    event_type = event["type"]
    data = event["data"]["object"]
    if event_type in {"refund.created", "refund.updated", "refund.failed"}:
        from .merchant import reconcile_refund
        reconcile_refund(data)
        return
    if event_type not in {"checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.async_payment_failed", "checkout.session.expired"}:
        return
    session_id = data.get("id") if event_type.startswith("checkout.session.") else None
    order = None
    metadata = data.get("metadata") or {}
    public_id = metadata.get("order_id") or data.get("client_reference_id")
    if public_id:
        try:
            order = Order.objects.select_for_update().filter(public_id=uuid.UUID(str(public_id))).first()
        except (ValueError, TypeError):
            raise ValueError("Invalid order association")
    if order is None and session_id:
        order = Order.objects.select_for_update().filter(stripe_session_id=session_id).first()
    if order is None:
        raise ValueError("Order association missing; retry or reconcile")
    if (not session_id or (order.stripe_session_id and session_id != order.stripe_session_id)
        or str(data.get("client_reference_id")) != str(order.public_id)
        or str(metadata.get("order_id")) != str(order.public_id)
        or data.get("mode") != "payment" or data.get("currency") != order.currency.lower()
        or data.get("amount_total") != order.total_cents
        or data.get("livemode") is not (order.payment_mode == "live")
        or metadata.get("commerce_mode") != order.payment_mode):
        raise ValueError("Payment does not match saved order")
    if session_id and not order.stripe_session_id:
        order.stripe_session_id = session_id
        order.save(update_fields=["stripe_session_id", "updated_at"])
    if event_type in {"checkout.session.completed", "checkout.session.async_payment_succeeded"}:
        if data.get("payment_status") == "paid":
            _mark_order_paid(order, data)
        elif not order.paid_at and not order.stock_finalized_at:
            order.status = "payment_pending"
            order.payment_status = "pending"
            order.save(update_fields=["status", "payment_status", "updated_at"])
    elif event_type == "checkout.session.async_payment_failed":
        if not order.paid_at:
            _release_reservations(order, "payment_failed", "failed")
    elif event_type == "checkout.session.expired":
        if not order.paid_at and order.payment_status != "pending":
            _release_reservations(order, "expired", "unpaid")


@csrf_exempt
@require_POST
def stripe_webhook(request):
    if not settings.STRIPE_WEBHOOK_SECRET:
        return _error("Stripe webhook is not configured.", 503)
    signature = request.headers.get("Stripe-Signature", "")
    try:
        event = stripe.Webhook.construct_event(request.body, signature, settings.STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.error.SignatureVerificationError):
        return _error("Invalid Stripe webhook signature.", 400)
    event_id = event["id"]
    record, _ = StripeWebhookEvent.objects.get_or_create(event_id=event_id,
        defaults={"event_type": event["type"], "status": "received"})
    try:
        with transaction.atomic():
            record = StripeWebhookEvent.objects.select_for_update().get(pk=record.pk)
            if record.status == "processed":
                return JsonResponse({"received": True, "duplicate": True})
            record.status = "processing"
            record.error_message = ""
            record.save(update_fields=["status", "error_message"])
            _process_stripe_event(event)
            record.status = "processed"
            record.processed_at = timezone.now()
            record.save(update_fields=["status", "processed_at"])
    except Exception as exc:
        logger.warning("Stripe webhook %s requires retry/reconciliation (%s)", event_id, type(exc).__name__)
        StripeWebhookEvent.objects.filter(event_id=event_id).update(status="failed", error_message=type(exc).__name__)
        return _error("Webhook processing failed; Stripe can safely retry this event.", 500)
    return JsonResponse({"received": True})


@require_POST
def cancel_checkout(request):
    try:
        body = _json_body(request)
        public_id = uuid.UUID(str(body.get("order_id", "")))
    except (ValueError, TypeError):
        return _error("A valid order reference is required.")
    order = Order.objects.filter(public_id=public_id).first()
    if not order or not _order_visible_to_request(order, request):
        return _error("Order not found.", 404)
    if order.paid_at or order.payment_status == "pending":
        return _error("Payment is already confirmed. Contact support to request a return.", 409)
    if not order.stripe_session_id:
        return _error("Stripe checkout status is uncertain. Retry the same checkout attempt; stock remains reserved.", 409)
    if order.stripe_session_id:
        try:
            stripe.api_key = settings.STRIPE_SECRET_KEY
            session = stripe.checkout.Session.expire(order.stripe_session_id)
        except stripe.error.InvalidRequestError:
            try:
                session = stripe.checkout.Session.retrieve(order.stripe_session_id)
            except stripe.error.StripeError:
                return _error("Stripe status could not be checked. Stock remains reserved.", 502)
        except stripe.error.StripeError:
            return _error("Stripe could not confirm cancellation. Your stock remains reserved while payment status is checked.", 502)
        if session.get("status") != "expired" or session.get("payment_status") == "paid":
            return _error("This payment may still be processing. Stock remains reserved.", 409)
    with transaction.atomic():
        locked = Order.objects.select_for_update().get(pk=order.pk)
        if not locked.paid_at and locked.payment_status != "pending":
            _release_reservations(locked, "cancelled", "unpaid")
    return JsonResponse({"cancelled": True})


@require_GET
def orders(request):
    grants = request.session.get("order_grants", {})
    allowed = [key for key, expiry in grants.items() if isinstance(expiry, int) and expiry > timezone.now().timestamp()]
    visible = Q(public_id__in=allowed)
    if request.session.session_key:
        visible |= Q(session_key=request.session.session_key)
    if request.user.is_authenticated:
        visible |= Q(user=request.user)
    queryset = Order.objects.filter(visible)
    return JsonResponse({"orders": [_order_payload(order) for order in queryset.prefetch_related("items")[:100]]})


@require_GET
def order_by_session(request):
    session_id = request.GET.get("session_id", "").strip()[:128]
    if not session_id:
        return _error("A checkout reference is required.")
    order = Order.objects.filter(stripe_session_id=session_id).prefetch_related("items").first()
    if not order or not _order_visible_to_request(order, request):
        return _error("Order not found for this browser session.", 404)
    return JsonResponse(_order_payload(order))


@require_POST
@transaction.atomic
def create_return(request, public_id):
    if not _rate_limit(request, "return", 10, 3600):
        return _error("Too many return requests. Try again later.", 429)
    order = Order.objects.filter(public_id=public_id).prefetch_related("items").first()
    if not order or not _order_visible_to_request(order, request) or order.payment_status != "paid":
        return _error("A paid order in this browser is required.", 404)
    try:
        body = _json_body(request)
        item_id = int(body.get("item_id"))
        quantity = body.get("quantity", 1)
        if not isinstance(quantity, int) or isinstance(quantity, bool):
            raise ValueError("Invalid return quantity")
        reason = str(body.get("reason", "")).strip()[:60]
        details = str(body.get("details", "")).strip()[:1500]
    except (ValueError, TypeError):
        return _error("Please check the return details.")
    item = order.items.select_for_update().filter(pk=item_id).first()
    if not item or quantity < 1 or quantity > item.quantity - item.returned_quantity:
        return _error("The selected quantity is not available for return.")
    allowed_reasons = {"Wrong size", "Changed my mind", "Item issue", "Other"}
    if reason not in allowed_reasons:
        return _error("Choose a valid return reason.")
    if ReturnRequest.objects.filter(order_item=item, status__in=["requested", "approved", "received"]).exists():
        return _error("A return request for this item is already being reviewed.", 409)
    email = order.customer_email or (request.user.email if request.user.is_authenticated else "")
    if not email:
        return _error("An email address is needed to manage this request.")
    result = ReturnRequest.objects.create(
        order=order, order_item=item, customer_email=email, reason=reason,
        details=details, requested_quantity=quantity,
    )
    return JsonResponse({"id": result.id, "status": result.status}, status=201)








@require_POST
def logout_view(request):
    logout(request)
    return JsonResponse({"authenticated": False})


@require_http_methods(["GET", "POST", "PATCH", "DELETE"])
def addresses(request):
    if not request.user.is_authenticated:
        return _error("Sign in to manage saved addresses.", 401)
    if request.method == "GET":
        rows = CustomerAddress.objects.filter(user=request.user)
        return JsonResponse({"addresses": [
            {"id": row.id, "label": row.label, "recipient": row.recipient, "phone": row.phone, "line1": row.line1, "line2": row.line2, "postal_code": row.postal_code, "is_default": row.is_default}
            for row in rows
        ]})
    if request.method == "DELETE":
        try:
            body = _json_body(request)
            row = CustomerAddress.objects.get(user=request.user, pk=int(body.get("id")))
        except (ValueError, TypeError, CustomerAddress.DoesNotExist):
            return _error("Address not found.", 404)
        row.delete()
        return JsonResponse({"deleted": True})
    try:
        body = _json_body(request)
        recipient = str(body.get("recipient", "")).strip()[:120]
        line1 = str(body.get("line1", "")).strip()[:180]
        line2 = str(body.get("line2", "")).strip()[:180]
        postal = str(body.get("postal_code", "")).strip()
        phone = str(body.get("phone", "")).strip()[:32]
        if not recipient or not line1 or not re.fullmatch(r"\d{6}", postal):
            return _error("Recipient, street address, and a valid 6-digit Singapore postal code are required.")
        make_default = body.get("is_default", False)
        if not isinstance(make_default, bool):
            return _error("Default address must be true or false.")
        with transaction.atomic():
            User.objects.select_for_update().get(pk=request.user.pk)
            if request.method == "POST" and CustomerAddress.objects.filter(user=request.user).count() >= 20:
                return _error("You can save up to 20 delivery addresses.")
            row = None
            if request.method == "PATCH":
                row = CustomerAddress.objects.filter(user=request.user, pk=body.get("id")).first()
                if not row:
                    return _error("Address not found.", 404)
            if make_default:
                CustomerAddress.objects.filter(user=request.user).update(is_default=False)
            values = dict(label=str(body.get("label", "Home"))[:40],
                recipient=recipient, phone=phone, line1=line1, line2=line2,
                postal_code=postal, is_default=make_default,
            )
            if row:
                for key, value in values.items():
                    setattr(row, key, value)
                row.save()
            else:
                row = CustomerAddress.objects.create(user=request.user, **values)
    except (ValueError, TypeError) as exc:
        return _error(str(exc))
    return JsonResponse({"id": row.id, "saved": True}, status=201)


@require_POST
def manage_login(request):
    if not _rate_limit(request, "manage-login", 8, 900):
        return _error("Too many staff sign-in attempts. Try again later.", 429)
    try:
        body = _json_body(request)
    except ValueError as exc:
        return _error(str(exc))
    username = str(body.get("username", "")).strip()
    password = str(body.get("password", ""))
    user = authenticate(request, username=username, password=password)
    if not user or not user.is_staff:
        return _error("Staff username or password is incorrect.", 400)
    login(request, user)
    return JsonResponse({"authenticated": True, "name": user.get_full_name() or user.get_username(),
        "roles": ["owner"] if user.is_superuser else list(user.groups.values_list("name", flat=True)),
        "permissions": [key for key, groups in ROLE_GROUPS.items() if user.is_superuser or user.groups.filter(name__in=groups).exists()]})


@require_POST
def manage_logout(request):
    if request.user.is_authenticated and request.user.is_staff:
        logout(request)
    return JsonResponse({"authenticated": False})


@require_GET
def manage_session(request):
    if not request.user.is_authenticated or not request.user.is_staff:
        return JsonResponse({"authenticated": False})
    return JsonResponse({
        "authenticated": True,
        "name": request.user.get_full_name() or request.user.get_username(),
        "roles": ["owner"] if request.user.is_superuser else list(request.user.groups.values_list("name", flat=True)),
        "permissions": [key for key, groups in ROLE_GROUPS.items() if request.user.is_superuser or request.user.groups.filter(name__in=groups).exists()],
    })


def _date_range(request):
    end = timezone.localdate()
    start = end - timedelta(days=6)
    try:
        if request.GET.get("from"):
            start = date.fromisoformat(request.GET["from"])
        if request.GET.get("to"):
            end = date.fromisoformat(request.GET["to"])
    except ValueError:
        raise ValueError("Date filters must use YYYY-MM-DD.")
    if start > end:
        raise ValueError("Start date must be on or before end date.")
    if (end - start).days > 365:
        raise ValueError("Choose a date range of 366 days or less.")
    tz = timezone.get_current_timezone()
    return start, end, timezone.make_aware(datetime.combine(start, time.min), tz), timezone.make_aware(datetime.combine(end + timedelta(days=1), time.min), tz)


def _money(cents):
    return int(cents or 0)


def _analytics_data(start, end, start_dt, end_dt):
    length = (end - start).days + 1
    previous_end = start - timedelta(days=1)
    previous_start = previous_end - timedelta(days=length - 1)
    previous_start_dt = timezone.make_aware(datetime.combine(previous_start, time.min), timezone.get_current_timezone())
    previous_end_dt = timezone.make_aware(datetime.combine(start, time.min), timezone.get_current_timezone())
    current_orders = Order.objects.filter(payment_mode="live", paid_at__gte=start_dt, paid_at__lt=end_dt)
    previous_orders = Order.objects.filter(payment_mode="live", paid_at__gte=previous_start_dt, paid_at__lt=previous_end_dt)
    current_agg = current_orders.aggregate(sales=Sum(F("subtotal_cents") - F("refunded_cents")), count=Count("id"))
    previous_agg = previous_orders.aggregate(sales=Sum(F("subtotal_cents") - F("refunded_cents")), count=Count("id"))
    current_sales = _money(current_agg["sales"])
    previous_sales = _money(previous_agg["sales"])
    order_count = current_agg["count"] or 0
    previous_count = previous_agg["count"] or 0
    current_events = StorefrontEvent.objects.filter(consented=True, created_at__gte=start_dt, created_at__lt=end_dt).filter(Q(order__isnull=True) | Q(order__payment_mode="live"))
    session_count = current_events.values("session_hash").distinct().count()
    purchases = current_events.filter(event_type="purchase_confirmed").values("session_hash").distinct().count()
    funnel = {}
    for event_type in ["product_viewed", "cart_added", "checkout_started", "purchase_confirmed"]:
        funnel[event_type] = current_events.filter(event_type=event_type).values("session_hash").distinct().count()
    daily_current = defaultdict(int)
    daily_previous = defaultdict(int)
    cursor = start
    while cursor <= end:
        day_start = timezone.make_aware(datetime.combine(cursor, time.min), timezone.get_current_timezone())
        day_end = timezone.make_aware(datetime.combine(cursor + timedelta(days=1), time.min), timezone.get_current_timezone())
        daily_current[cursor.isoformat()] = _money(
            current_orders.filter(paid_at__gte=day_start, paid_at__lt=day_end).aggregate(value=Sum(F("subtotal_cents") - F("refunded_cents")))["value"]
        )
        prior = cursor - timedelta(days=length)
        prior_start = timezone.make_aware(datetime.combine(prior, time.min), timezone.get_current_timezone())
        prior_end = timezone.make_aware(datetime.combine(prior + timedelta(days=1), time.min), timezone.get_current_timezone())
        daily_previous[cursor.isoformat()] = _money(
            previous_orders.filter(paid_at__gte=prior_start, paid_at__lt=prior_end).aggregate(value=Sum(F("subtotal_cents") - F("refunded_cents")))["value"]
        )
        cursor += timedelta(days=1)
    item_rows = OrderItem.objects.filter(order__in=current_orders).values("product_name", "brand_name", "size", "product__image_url").annotate(
        units=Sum(F("quantity") - F("returned_quantity")),
        net_sales=Sum(F("unit_price_cents") * (F("quantity") - F("returned_quantity"))),
    ).order_by("-net_sales")[:8]
    size_rows = OrderItem.objects.filter(order__in=current_orders).values("size").annotate(units=Sum(F("quantity") - F("returned_quantity"))).order_by("-units")[:12]
    variant_alerts = [
        {
            "sku": variant.sku,
            "product": str(variant.product),
            "size": variant.size,
            "available": variant.available,
        }
        for variant in ProductVariant.objects.select_related("product", "product__brand").filter(
            product__status="active", active=True
        )
        if variant.available <= min(variant.low_stock_threshold, settings.LOW_STOCK_THRESHOLD)
    ][:12]
    pending_orders = Order.objects.filter(status__in=["paid", "fulfilling"]).count()
    return_requests = ReturnRequest.objects.filter(status="requested").count()
    gross_profit = None
    if current_orders.exists():
        missing_cost = OrderItem.objects.filter(order__in=current_orders, unit_cost_cents__isnull=True).exists()
        if not missing_cost:
            cost_total = OrderItem.objects.filter(order__in=current_orders).aggregate(value=Sum(F("unit_cost_cents") * (F("quantity") - F("returned_quantity"))))["value"] or 0
            gross_profit = current_sales - cost_total
    campaign_rows = current_events.filter(event_type="purchase_confirmed").exclude(
        campaign_source="", campaign_medium="", campaign_name=""
    ).values("campaign_source", "campaign_medium", "campaign_name").annotate(
        orders=Count("order", distinct=True),
        revenue=Sum(F("order__subtotal_cents") - F("order__refunded_cents")),
    ).order_by("-revenue")[:20]
    return {
        "range": {"from": start.isoformat(), "to": end.isoformat()},
        "comparison": {"from": previous_start.isoformat(), "to": previous_end.isoformat()},
        "summary": {
            "net_sales": current_sales,
            "paid_orders": order_count,
            "average_order_value": round(current_sales / order_count) if order_count else 0,
            "conversion_rate": round((purchases / session_count) * 100, 2) if session_count else None,
            "gross_profit": gross_profit,
            "previous_net_sales": previous_sales,
            "previous_paid_orders": previous_count,
            "previous_average_order_value": round(previous_sales / previous_count) if previous_count else 0,
            "sessions": session_count,
            "purchase_sessions": purchases,
        },
        "daily_sales": [
            {"date": key, "current": daily_current[key], "previous": daily_previous[key]}
            for key in daily_current
        ],
        "funnel": {
            "sessions": session_count,
            "product_views": funnel["product_viewed"],
            "added_to_cart": funnel["cart_added"],
            "checkout_started": funnel["checkout_started"],
            "purchased": funnel["purchase_confirmed"],
        },
        "best_sellers": list(item_rows),
        "brand_performance": list(OrderItem.objects.filter(order__in=current_orders).values("brand_name").annotate(
            units=Sum(F("quantity") - F("returned_quantity")), revenue=Sum(F("unit_price_cents") * (F("quantity") - F("returned_quantity")))).order_by("-revenue")),
        "return_rate": round(ReturnRequest.objects.filter(order__in=current_orders).values("order_id").distinct().count() / order_count * 100, 2) if order_count else None,
        "repeat_customers": current_orders.exclude(customer_email="").values("customer_email").annotate(count=Count("id")).filter(count__gt=1).count(),
        "size_demand": list(size_rows),
        "campaign_performance": list(campaign_rows),
        "stock_alerts": variant_alerts,
        "orders_awaiting_dispatch": pending_orders,
        "return_requests": return_requests,
        "last_updated": timezone.now().isoformat(),
        "data_note": "Sales use confirmed live-mode payments and recorded merchandise refunds, attributed to the original sale date. Test orders are excluded. Funnel counts consented browser identities within this range, not visits; stages are not a cohort conversion study. Profit uses recorded unit costs and retained units; missing costs are omitted. External dashboard refunds need reconciliation.",
    }


@require_GET
@staff_endpoint("analytics")
def manage_dashboard(request):
    try:
        start, end, start_dt, end_dt = _date_range(request)
    except ValueError as exc:
        return _error(str(exc))
    data = _analytics_data(start, end, start_dt, end_dt)
    return JsonResponse(data)


@require_GET
@staff_endpoint("orders")
def manage_orders(request):
    queryset = Order.objects.prefetch_related("items")
    status = request.GET.get("status", "")
    query = request.GET.get("q", "").strip()[:100]
    if status:
        queryset = queryset.filter(status=status)
    if query:
        queryset = queryset.filter(Q(reference__icontains=query) | Q(customer_email__icontains=query))
    return JsonResponse({"orders": [_order_payload(order) for order in queryset[:200]]})




@transaction.atomic
def _create_product_from_payload(body, user):
    brand_name = str(body.get("brand", "")).strip()[:100]
    category_name = str(body.get("category", "")).strip()[:80]
    name = str(body.get("name", "")).strip()[:180]
    if not brand_name or not category_name or not name:
        raise ValueError("Brand, category, and product name are required.")
    brand, _ = Brand.objects.get_or_create(name=brand_name, defaults={"slug": re.sub(r"[^a-z0-9]+", "-", brand_name.lower()).strip("-")[:120]})
    category, _ = Category.objects.get_or_create(name=category_name, defaults={"slug": re.sub(r"[^a-z0-9]+", "-", category_name.lower()).strip("-")[:100]})
    slug = str(body.get("slug", "")).strip() or re.sub(r"[^a-z0-9]+", "-", (brand_name + "-" + name).lower()).strip("-")
    if Product.objects.filter(slug=slug).exists():
        raise ValueError("A product with this URL name already exists.")
    price = int(body.get("price_cents", 0))
    if price < 1 or price > 100000000:
        raise ValueError("Enter a valid price in cents.")
    status = body.get("status", "draft")
    illustrative = bool(body.get("is_illustrative", True))
    sourcing = str(body.get("sourcing_status", "not_reviewed"))
    product = Product.objects.create(
        brand=brand, category=category, name=name, slug=slug,
        colour=str(body.get("colour", ""))[:120],
        description=str(body.get("description", ""))[:4000],
        details=str(body.get("details", ""))[:4000],
        image_url=str(body.get("image_url", ""))[:500],
        image_alt=str(body.get("image_alt", ""))[:240],
        price_cents=price,
        cost_cents=int(body["cost_cents"]) if body.get("cost_cents") not in (None, "") else None,
        status=status if status in {"draft", "active", "archived"} else "draft",
        is_illustrative=illustrative,
        sourcing_status=sourcing if sourcing in {"not_reviewed", "in_review", "verified", "rejected"} else "not_reviewed",
        featured=bool(body.get("featured", False)),
    )
    variants = body.get("variants", [])
    if not isinstance(variants, list) or len(variants) > 100:
        raise ValueError("Add at most 100 size variants.")
    for row in variants:
        if not isinstance(row, dict):
            continue
        size = str(row.get("size", "")).strip()[:32]
        sku = str(row.get("sku", "")).strip()[:64]
        if not size or not sku:
            continue
        qty = int(row.get("stock_on_hand", 0))
        if qty < 0 or qty > 100000:
            raise ValueError("Variant stock is invalid.")
        variant = ProductVariant.objects.create(
            product=product, size=size, sku=sku,
            size_system=str(row.get("size_system", "UK"))[:16],
            colour=str(row.get("colour", product.colour))[:100],
            price_cents=int(row["price_cents"]) if row.get("price_cents") not in (None, "") else None,
            cost_cents=int(row["cost_cents"]) if row.get("cost_cents") not in (None, "") else None,
            stock_on_hand=qty,
        )
        if qty:
            InventoryMovement.objects.create(
                variant=variant, movement_type="received", quantity_change=qty,
                reason="Opening stock entered by catalogue staff", created_by=user,
            )
            StockLot.objects.create(
                variant=variant, quantity_received=qty, quantity_remaining=qty,
                unit_cost_cents=variant.effective_cost_cents,
                supplier_reference="Opening stock",
            )
    return product


@require_http_methods(["GET", "POST"])
@staff_endpoint("catalogue")
def manage_products(request):
    if request.method == "GET":
        query = request.GET.get("q", "").strip()[:100]
        products = Product.objects.select_related("brand", "category").prefetch_related("variants")
        if query:
            products = products.filter(Q(name__icontains=query) | Q(brand__name__icontains=query) | Q(variants__sku__icontains=query)).distinct()
        return JsonResponse({"products": [_product_payload(product) for product in products[:250]]})
    try:
        product = _create_product_from_payload(_json_body(request), request.user)
    except (ValueError, TypeError, IntegrityError) as exc:
        return _error(str(exc))
    return JsonResponse(_product_payload(product), status=201)




@require_GET
@staff_endpoint("inventory")
def manage_inventory(request):
    query = request.GET.get("q", "").strip()[:100]
    variants = ProductVariant.objects.select_related("product", "product__brand").filter(active=True)
    if query:
        variants = variants.filter(Q(product__name__icontains=query) | Q(product__brand__name__icontains=query) | Q(sku__icontains=query))
    result = []
    for variant in variants[:300]:
        lots = list(variant.lots.filter(quantity_remaining__gt=0).order_by("received_at"))
        oldest = lots[0].received_at if lots else None
        age_days = max(0, (timezone.now().date() - oldest.date()).days) if oldest else None
        result.append({
            "sku": variant.sku, "variant_id": variant.product.slug + ":" + variant.size,
            "product": str(variant.product), "brand": variant.product.brand.name,
            "size": variant.size, "size_system": variant.size_system,
            "stock_on_hand": variant.stock_on_hand, "reserved": variant.reserved_stock,
            "available": variant.available, "threshold": variant.low_stock_threshold,
            "cost_cents": variant.effective_cost_cents, "age_days": age_days,
            "illustrative": variant.product.is_illustrative,
        })
    movements = InventoryMovement.objects.select_related("variant", "variant__product").all()[:60]
    return JsonResponse({
        "variants": result,
        "movements": [
            {"sku": row.variant.sku, "product": str(row.variant.product), "size": row.variant.size, "type": row.movement_type, "quantity_change": row.quantity_change, "reason": row.reason, "created_at": row.created_at.isoformat()}
            for row in movements
        ],
    })


@require_POST
@staff_endpoint("inventory")
def manage_inventory_adjust(request):
    try:
        body = _json_body(request)
        sku = str(body.get("sku", "")).strip()[:64]
        change = body.get("quantity_change", 0)
        if not isinstance(change, int) or isinstance(change, bool):
            raise ValueError("Whole-number stock change required")
        reason = str(body.get("reason", "")).strip()[:240]
        cost = int(body["unit_cost_cents"]) if body.get("unit_cost_cents") not in (None, "") else None
        if cost is not None and (isinstance(body["unit_cost_cents"], bool) or cost < 0 or cost > 100000000):
            raise ValueError("Invalid cost")
        supplier = str(body.get("supplier_reference", "")).strip()[:100]
    except (ValueError, TypeError, KeyError) as exc:
        return _error("Enter a SKU, whole-number quantity change, and reason.")
    if not sku or not change or abs(change) > 100000 or not reason:
        return _error("Enter a SKU, a non-zero quantity change, and reason.")
    with transaction.atomic():
        variant = ProductVariant.objects.select_for_update().select_related("product").filter(sku=sku).first()
        if not variant:
            return _error("SKU not found.", 404)
        if change < 0 and abs(change) > variant.available:
            return _error("Adjustment would reduce stock below reserved quantities.", 409)
        variant.stock_on_hand += change
        variant.save(update_fields=["stock_on_hand"])
        InventoryMovement.objects.create(
            variant=variant, movement_type="received" if change > 0 else "adjustment",
            quantity_change=change, reason=reason, created_by=request.user,
        )
        if change > 0:
            StockLot.objects.create(
                variant=variant, quantity_received=change, quantity_remaining=change,
                unit_cost_cents=cost if cost is not None else variant.effective_cost_cents,
                supplier_reference=supplier,
            )
        else:
            to_remove = abs(change)
            lots = list(StockLot.objects.select_for_update().filter(variant=variant, quantity_remaining__gt=0).order_by("received_at"))
            for lot in lots:
                take = min(to_remove, lot.quantity_remaining)
                lot.quantity_remaining -= take
                lot.save(update_fields=["quantity_remaining"])
                to_remove -= take
                if not to_remove:
                    break
    return JsonResponse({"sku": variant.sku, "stock_on_hand": variant.stock_on_hand, "available": variant.available})


@require_GET
@staff_endpoint("returns")
def manage_returns(request):
    status = request.GET.get("status", "")
    rows = ReturnRequest.objects.select_related("order", "order_item").all()
    if status:
        rows = rows.filter(status=status)
    return JsonResponse({"returns": [
        {
            "id": row.id, "order_reference": row.order.reference,
            "order_id": str(row.order.public_id),
            "product": row.order_item.brand_name + " " + row.order_item.product_name,
            "size": row.order_item.size, "quantity": row.requested_quantity,
            "refund_amount_cents": row.order_item.unit_price_cents * row.requested_quantity,
            "email": row.customer_email, "reason": row.reason,
            "details": row.details, "status": row.status,
            "refund_status": RefundRecord.objects.filter(request=row).values_list("status", flat=True).first(),
            "created_at": row.created_at.isoformat(),
        }
        for row in rows[:200]
    ]})




@require_GET
@staff_endpoint("customers")
def manage_customers(request):
    rows = Order.objects.filter(payment_status="paid").exclude(customer_email="")
    query = request.GET.get("q", "").strip()[:100]
    if query:
        rows = rows.filter(customer_email__icontains=query)
    customers = rows.values("customer_email").annotate(
        orders=Count("id"), spend=Sum(F("total_cents") - F("refunded_cents")),
        last_order=Max("paid_at"),
    ).order_by("-spend")[:200]
    return JsonResponse({"customers": [
        {"email": row["customer_email"], "orders": row["orders"], "lifetime_spend": row["spend"] or 0, "last_order": row["last_order"].isoformat() if row["last_order"] else None}
        for row in customers
    ]})


@require_GET
@staff_endpoint("analytics")
def manage_analytics(request):
    try:
        start, end, start_dt, end_dt = _date_range(request)
    except ValueError as exc:
        return _error(str(exc))
    return JsonResponse(_analytics_data(start, end, start_dt, end_dt))
