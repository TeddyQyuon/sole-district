import stripe
from django.conf import settings
from django.db import transaction
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.http import require_GET, require_http_methods

from .api import _error, _json_body, _order_payload, staff_endpoint
from .models import (Product, ProductImage, SourcingReview, Order, OrderItem,
                     OrderUpdate, ReturnRequest, RefundRecord, ProductVariant,
                     StockLot, InventoryMovement)
from .models import StorePolicy
from .security import order_email


@require_http_methods(["GET", "PATCH"])
@staff_endpoint("catalogue")
@transaction.atomic
def product_detail(request, slug):
    from .api import _product_payload
    product = Product.objects.select_for_update().filter(slug=slug).first()
    if not product:
        return _error("Product not found.", 404)
    if request.method == "PATCH":
        try:
            body = _json_body(request)
            price = body.get("price_cents", product.price_cents)
            if isinstance(price, bool) or not isinstance(price, int) or not 1 <= price <= 100000000:
                return _error("Enter a positive price in cents.")
            if body.get("status", product.status) not in {"draft", "active", "archived"}:
                return _error("Listing status is invalid.")
            if "is_illustrative" in body and not isinstance(body["is_illustrative"], bool):
                return _error("Choose whether the product is illustrative.")
            images = body.get("images")
            variants = body.get("variants")
            if images is not None and (not isinstance(images, list) or len(images) > 12):
                return _error("Add at most 12 photos.")
            from django.core.validators import URLValidator
            from django.core.exceptions import ValidationError
            def valid_image(value):
                if len(value) > 500:
                    raise ValidationError("Photo URL too long")
                if value.startswith("/assets/") and ".." not in value:
                    return
                URLValidator(schemes=["https"])(value)
            if images is not None:
                for image in images:
                    if not isinstance(image, dict) or not image.get("alt") or len(str(image.get("alt"))) > 240:
                        return _error("Each product photo needs descriptive alternative text.")
                    valid_image(str(image.get("url", "")))
            if variants is not None:
                if not isinstance(variants, list) or len(variants) > 100:
                    return _error("Invalid size variants.")
                for values in variants:
                    variant = product.variants.select_for_update().filter(sku=values.get("sku")).first()
                    if not variant:
                        return _error("Variant not found.")
                    for field in ["price_cents", "cost_cents"]:
                        value = values.get(field)
                        if value is not None and (not isinstance(value, int) or isinstance(value, bool) or value < (1 if field == "price_cents" else 0) or value > 100000000):
                            return _error("Variant prices and costs must be valid cents.")
            changed_identity = any(key in body and str(body[key]) != str(getattr(product, key)) for key in ["name", "colour", "image_url"])
            product.price_cents = price
            product.status = body.get("status", product.status)
            product.is_illustrative = body.get("is_illustrative", product.is_illustrative)
            for field, maximum in [("name", 180), ("colour", 120), ("description", 4000), ("details", 4000)]:
                if field in body:
                    setattr(product, field, str(body[field]).strip()[:maximum])
            if not product.name:
                return _error("A product name is required.")
            if changed_identity or images is not None:
                product.sourcing_status = "not_reviewed"
            if images is not None:
                product.images.all().delete()
                for index, image in enumerate(images):
                    ProductImage.objects.create(product=product, image_url=image["url"], alt_text=image["alt"], sort_order=index, is_primary=index == 0)
                product.image_url, product.image_alt = (images[0]["url"], images[0]["alt"]) if images else ("", "")
            product.save()
            if variants is not None:
                for values in variants:
                    variant = product.variants.get(sku=values["sku"])
                    variant.price_cents, variant.cost_cents = values.get("price_cents"), values.get("cost_cents")
                    variant.active = values.get("active") is not False
                    variant.save(update_fields=["price_cents", "cost_cents", "active"])
        except (ValueError, TypeError, AttributeError, ValidationError):
            transaction.set_rollback(True)
            return _error("Check product photos, prices and variants.")
    data = _product_payload(product)
    data["status"] = product.status
    data["variants"] = [{"sku": row.sku, "size": row.size, "size_system": row.size_system, "colour": row.colour,
                         "price_cents": row.price_cents, "cost_cents": row.cost_cents, "active": row.active} for row in product.variants.all()]
    return JsonResponse(data)


@require_GET
@staff_endpoint("owner")
def settings_status(request):
    from .api import _store_state
    checks = {
        "persistent_database": settings.DATABASES["default"]["ENGINE"].endswith("postgresql"),
        "stripe_secret": settings.STRIPE_SECRET_KEY.startswith(("sk_test_", "sk_live_")),
        "stripe_webhook": bool(settings.STRIPE_WEBHOOK_SECRET),
        "email_transport": bool(settings.EMAIL_HOST and "example.invalid" not in settings.DEFAULT_FROM_EMAIL),
        "approved_store_policies": settings.STORE_POLICIES_APPROVED and StorePolicy.objects.filter(
            slug__in=["delivery", "returns", "privacy", "terms", "store"], published=True, approved_at__isnull=False).count() == 5,
        "sale_ready_products": any(p.sellable for p in Product.objects.filter(status="active", is_illustrative=False)),
        "live_payments_enabled": settings.LIVE_COMMERCE_ENABLED,
        "payment_tests_confirmed": settings.LIVE_TESTS_CONFIRMED,
    }
    return JsonResponse({"store": _store_state(), "checks": checks,
                         "event_retention_days": settings.EVENT_RETENTION_DAYS,
                         "currency": "SGD", "timezone": "Asia/Singapore",
                         "policies": list(StorePolicy.objects.values("slug", "title", "body", "published"))})


@require_http_methods(["POST"])
@staff_endpoint("owner")
def save_policy(request):
    try:
        body = _json_body(request)
        if body.get("slug") not in {"delivery", "returns", "privacy", "terms", "store"}:
            return _error("Choose a valid store policy.")
        title, text = str(body.get("title", "")).strip()[:120], str(body.get("body", "")).strip()[:30000]
        if not title or len(text) < 50:
            return _error("Add a title and the complete reviewed policy text.")
        publish = body.get("published") is True
        StorePolicy.objects.update_or_create(slug=body["slug"], defaults={
            "title": title, "body": text, "published": publish,
            "approved_at": timezone.now() if publish else None,
            "approved_by": request.user if publish else None})
        return JsonResponse({"saved": True})
    except ValueError as exc:
        return _error(str(exc))


@require_http_methods(["GET", "POST"])
@staff_endpoint("owner")
@transaction.atomic
def sourcing(request, slug):
    product = Product.objects.select_for_update().filter(slug=slug).first()
    if not product:
        return _error("Product not found.", 404)
    if request.method == "GET":
        return JsonResponse({"reviews": list(product.sourcing_reviews.order_by("-reviewed_at").values(
            "id", "supplier", "invoice_reference", "evidence_reference", "notes", "status", "reviewed_at"))})
    try:
        body = _json_body(request)
        status = body.get("status")
        fields = {key: str(body.get(key, "")).strip() for key in ["supplier", "invoice_reference", "evidence_reference"]}
        if status not in {"in_review", "verified", "rejected"} or any(not value for value in fields.values()):
            return _error("Supplier, invoice and private evidence references are required.")
        if len(fields["supplier"]) > 180 or len(fields["invoice_reference"]) > 180 or len(fields["evidence_reference"]) > 500:
            return _error("An evidence reference is too long.")
        SourcingReview.objects.create(product=product, **fields, status=status,
            notes=str(body.get("notes", ""))[:4000], reviewed_by=request.user)
        product.sourcing_status = status
        product.save(update_fields=["sourcing_status", "updated_at"])
        return JsonResponse({"recorded": True, "sellable": product.sellable}, status=201)
    except ValueError as exc:
        return _error(str(exc))


@require_http_methods(["GET", "PATCH"])
@staff_endpoint("orders")
@transaction.atomic
def order_detail(request, public_id):
    order = Order.objects.select_for_update().filter(public_id=public_id).first()
    if not order:
        return _error("Order not found.", 404)
    if request.method == "PATCH":
        try:
            body = _json_body(request)
        except ValueError as exc:
            return _error(str(exc))
        status = body.get("status")
        transitions = {"paid": "fulfilling", "fulfilling": "shipped", "shipped": "completed"}
        if status != transitions.get(order.status) or order.payment_status != "paid":
            return _error("Orders must move from paid to fulfilling, shipped, then completed.", 409)
        tracking = str(body.get("tracking_number", order.tracking_number)).strip()[:100]
        carrier = str(body.get("carrier", order.carrier)).strip()[:80]
        if status == "shipped" and (not tracking or not carrier):
            return _error("Carrier and tracking number are required before marking an order shipped.")
        order.status, order.tracking_number, order.carrier = status, tracking, carrier
        if status == "completed":
            order.fulfilled_at = timezone.now()
        order.save(update_fields=["status", "tracking_number", "carrier", "fulfilled_at", "updated_at"])
        OrderUpdate.objects.create(order=order, status=status,
            message="Tracking recorded." if status == "shipped" else "Order " + status + ".", created_by=request.user)
        order_email(order, status)
    data = _order_payload(order)
    data.update(customer_email=order.customer_email, shipping_address=order.shipping_address,
                refunds=order.refunded_cents, payment_mode=order.payment_mode)
    return JsonResponse(data)


def _obj_val(obj, key, default=None):
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


def reconcile_refund(data):
    candidate = RefundRecord.objects.filter(stripe_id=_obj_val(data, "id")).first()
    if not candidate:
        # An out-of-band dashboard refund requires merchant reconciliation.
        if Order.objects.filter(stripe_payment_intent_id=_obj_val(data, "payment_intent")).exists():
            raise ValueError("Unrecorded refund requires merchant reconciliation")
        return
    order = Order.objects.select_for_update().get(pk=candidate.request.order_id)
    row = ReturnRequest.objects.select_for_update().get(pk=candidate.request_id)
    record = RefundRecord.objects.select_for_update().get(pk=candidate.pk)
    if record.status == "succeeded":
        return
    if _obj_val(data, "amount") != record.amount_cents or _obj_val(data, "payment_intent") != order.stripe_payment_intent_id:
        raise ValueError("Refund does not match saved request")
    if _obj_val(data, "status") != "succeeded":
        record.status = _obj_val(data, "status", "pending")
        record.save(update_fields=["status"])
        return
    item = OrderItem.objects.select_for_update().get(pk=row.order_item_id)
    if item.returned_quantity + row.requested_quantity > item.quantity:
        raise ValueError("Refund quantity exceeds sold units")
    item.returned_quantity += row.requested_quantity
    item.save(update_fields=["returned_quantity"])
    order.refunded_cents += record.amount_cents
    if order.refunded_cents > order.total_cents:
        raise ValueError("Refund exceeds order total")
    if order.refunded_cents == order.total_cents:
        order.payment_status = order.status = "refunded"
    order.save(update_fields=["refunded_cents", "payment_status", "status", "updated_at"])
    if record.restock and item.variant_id:
        variant = ProductVariant.objects.select_for_update().get(pk=item.variant_id)
        variant.stock_on_hand += row.requested_quantity
        variant.save(update_fields=["stock_on_hand"])
        InventoryMovement.objects.create(variant=variant, movement_type="return",
            quantity_change=row.requested_quantity, reason=f"Inspected return {row.pk}", order=order)
        StockLot.objects.create(variant=variant, quantity_received=row.requested_quantity,
            quantity_remaining=row.requested_quantity, unit_cost_cents=item.unit_cost_cents,
            supplier_reference=f"Inspected return {row.pk}")
    row.status = "refunded"
    row.save(update_fields=["status", "updated_at"])
    record.status = "succeeded"
    record.save(update_fields=["status"])
    OrderUpdate.objects.create(order=order, status="refund", message="Inspected return refunded.")
    order_email(order, f"return_{row.pk}_refunded")


@require_http_methods(["PATCH"])
@staff_endpoint("returns")
@transaction.atomic
def return_detail(request, return_id):
    candidate = ReturnRequest.objects.filter(pk=return_id).first()
    if not candidate:
        return _error("Return not found.", 404)
    order = Order.objects.select_for_update().get(pk=candidate.order_id)
    row = ReturnRequest.objects.select_for_update().get(pk=return_id)
    try:
        body = _json_body(request)
    except ValueError as exc:
        return _error(str(exc))
    action = body.get("status")
    if action in {"approved", "rejected"} and row.status == "requested" or action == "received" and row.status == "approved":
        row.status = action
        row.save(update_fields=["status", "updated_at"])
        order_email(order, f"return_{row.pk}_{action}")
    elif action == "refunded" and row.status == "received":
        record = RefundRecord.objects.filter(request=row).first()
        if record:
            return JsonResponse({"id": row.pk, "status": row.status, "refund_status": record.status}, status=202)
        if not settings.STRIPE_SECRET_KEY or not order.stripe_payment_intent_id:
            return _error("Stripe refund is not configured for this order.", 503)
        if order.payment_mode != ("live" if settings.STRIPE_SECRET_KEY.startswith("sk_live_") else "test"):
            return _error("Stripe mode does not match this order.", 409)
        item = OrderItem.objects.select_for_update().get(pk=row.order_item_id)
        amount = item.unit_price_cents * row.requested_quantity
        if item.returned_quantity + row.requested_quantity > item.quantity or order.refunded_cents + amount > order.total_cents:
            return _error("This quantity is already refunded.", 409)
        try:
            stripe.api_key = settings.STRIPE_SECRET_KEY
            refund = stripe.Refund.create(payment_intent=order.stripe_payment_intent_id,
                amount=amount, reason="requested_by_customer", metadata={"return_id": str(row.pk)},
                idempotency_key=f"sole-refund-{row.pk}")
        except stripe.error.StripeError:
            return _error("Stripe could not confirm the refund. Retry this same return.", 502)
        record = RefundRecord.objects.create(request=row, stripe_id=refund.id,
            amount_cents=amount, status="requested", restock=body.get("restock") is True)
        reconcile_refund(refund)
        row.refresh_from_db()
        record.refresh_from_db()
        return JsonResponse({"id": row.pk, "status": row.status, "refund_status": record.status},
                            status=200 if record.status == "succeeded" else 202)
    else:
        return _error("This return cannot move to that status.", 409)
    return JsonResponse({"id": row.pk, "status": row.status})
