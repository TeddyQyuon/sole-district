import json
import stripe
from datetime import timedelta
from types import SimpleNamespace
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import Client, TestCase, override_settings
from django.utils import timezone

from .models import (
    Brand, Category, InventoryMovement, Order, OrderItem, Product,
    ProductVariant, ReturnRequest, StockLot, StorefrontEvent, StripeWebhookEvent, SourcingReview,
)

User = get_user_model()


class StoreApiTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.brand = Brand.objects.create(name="Test Label", slug="test-label")
        self.category = Category.objects.create(name="Sneakers", slug="sneakers")
        self.product = Product.objects.create(
            brand=self.brand,
            category=self.category,
            name="Runner 1",
            slug="test-runner-1",
            price_cents=12000,
            status="active",
            is_illustrative=False,
            sourcing_status="verified",
            image_url="/assets/new-balance.webp",
        )
        SourcingReview.objects.create(product=self.product, supplier="Fixture supplier", invoice_reference="TEST-INVOICE", evidence_reference="Mock evidence only", status="verified")
        self.variant = ProductVariant.objects.create(
            product=self.product,
            sku="TEST-RUNNER-UK-8",
            size="8",
            size_system="UK",
            stock_on_hand=3,
        )

    def test_catalog_has_server_variant_ids_and_store_state(self):
        response = self.client.get("/api/catalog/")
        self.assertEqual(response.status_code, 200)
        product = response.json()["products"][0]
        self.assertEqual(product["id"], "test-runner-1")
        self.assertEqual(product["variants"][0]["id"], "sku:TEST-RUNNER-UK-8")
        self.assertEqual(product["variants"][0]["available"], 3)
        self.assertFalse(response.json()["store"]["checkout_ready"])

    @override_settings(STRIPE_CHECKOUT_ENABLED=False)
    def test_checkout_stays_disabled_without_configuration(self):
        response = self.client.post(
            "/api/checkout/",
            data=json.dumps({"items": [{"variant_id": "test-runner-1:8", "quantity": 1}]}),
            content_type="application/json",
            HTTP_IDEMPOTENCY_KEY="checkout-key-for-disabled-test",
        )
        self.assertEqual(response.status_code, 503)
        self.assertEqual(Order.objects.count(), 0)
        self.assertEqual(self.variant.refresh_from_db() or self.variant.reserved_stock, 0)

    @override_settings(
        STRIPE_SECRET_KEY="sk_test_example",
        STRIPE_WEBHOOK_SECRET="whsec_example",
        STRIPE_CHECKOUT_ENABLED=True,
        FRONTEND_ORIGIN="http://localhost:5173",
    )
    @patch("shop.api._stripe_checkout")
    def test_checkout_uses_server_prices_and_is_idempotent(self, create_session):
        create_session.return_value = SimpleNamespace(
            id="cs_test_checkout",
            url="https://checkout.stripe.com/c/pay/cs_test_checkout",
            customer_email="",
        )
        payload = {
            "items": [{"variant_id": "test-runner-1:8", "quantity": 1, "price_cents": 1}],
        }
        headers = {"HTTP_IDEMPOTENCY_KEY": "checkout-key-server-price-test"}
        first = self.client.post("/api/checkout/", data=json.dumps(payload), content_type="application/json", **headers)
        second = self.client.post("/api/checkout/", data=json.dumps(payload), content_type="application/json", **headers)
        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        order = Order.objects.get()
        self.assertEqual(order.subtotal_cents, 12000)
        self.assertEqual(order.delivery_cents, 800)
        self.assertEqual(order.total_cents, 12800)
        self.assertEqual(self.variant.refresh_from_db() or self.variant.reserved_stock, 1)
        self.assertEqual(create_session.call_count, 1)

    @override_settings(
        STRIPE_SECRET_KEY="sk_test_example",
        STRIPE_WEBHOOK_SECRET="whsec_example",
        STRIPE_CHECKOUT_ENABLED=True,
    )
    def test_checkout_rejects_illustrative_products_even_with_stock(self):
        self.product.is_illustrative = True
        self.product.save(update_fields=["is_illustrative"])
        response = self.client.post(
            "/api/checkout/",
            data=json.dumps({"items": [{"variant_id": "test-runner-1:8", "quantity": 1}]}),
            content_type="application/json",
            HTTP_IDEMPOTENCY_KEY="checkout-key-illustrative-block",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Order.objects.count(), 0)

    @override_settings(STRIPE_WEBHOOK_SECRET="whsec_example")
    @patch("shop.api.stripe.Webhook.construct_event")
    def test_paid_webhook_is_deduplicated_and_consumes_stock_once(self, construct_event):
        self.variant.reserved_stock = 1
        self.variant.save(update_fields=["reserved_stock"])
        session_key = self.client.session.session_key or "test-session-key"
        order = Order.objects.create(
            session_key=session_key,
            checkout_key="webhook-test-checkout-key",
            cart_fingerprint="fingerprint",
            subtotal_cents=12000,
            delivery_cents=800,
            total_cents=12800,
            stripe_session_id="cs_test_paid",
        )
        OrderItem.objects.create(
            order=order, product=self.product, variant=self.variant,
            product_name=self.product.name, brand_name=self.brand.name,
            size=self.variant.size, sku=self.variant.sku, quantity=1,
            unit_price_cents=12000, reserved=True,
        )
        event = {
            "id": "evt_test_paid_once",
            "type": "checkout.session.completed",
            "data": {"object": {
                "id": "cs_test_paid",
                "client_reference_id": str(order.public_id),
                "metadata": {"order_id": str(order.public_id), "commerce_mode": "test"},
                "mode": "payment", "livemode": False, "currency": "sgd", "amount_total": order.total_cents,
                "payment_status": "paid",
                "payment_intent": "pi_test_paid",
                "customer_email": "buyer@example.com",
                "customer_details": None,
            }},
        }
        construct_event.return_value = event
        for _ in range(2):
            response = self.client.post(
                "/api/stripe/webhook/",
                data=b'{"raw":"body"}',
                content_type="application/json",
                HTTP_STRIPE_SIGNATURE="test-signature",
            )
            self.assertEqual(response.status_code, 200)
        self.variant.refresh_from_db()
        order.refresh_from_db()
        self.assertEqual(order.payment_status, "paid")
        self.assertEqual(self.variant.stock_on_hand, 2)
        self.assertEqual(self.variant.reserved_stock, 0)
        self.assertEqual(InventoryMovement.objects.filter(movement_type="sale").count(), 1)
        self.assertEqual(StripeWebhookEvent.objects.filter(status="processed").count(), 1)

    def test_inventory_adjustment_cannot_remove_reserved_units(self):
        self.variant.reserved_stock = 2
        self.variant.save(update_fields=["reserved_stock"])
        staff = User.objects.create_superuser(username="owner", email="owner@example.com", password="A-long-test-password-93")
        self.client.force_login(staff)
        response = self.client.post(
            "/api/manage/inventory/adjust/",
            data=json.dumps({"sku": self.variant.sku, "quantity_change": -2, "reason": "Counted stock"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 409)
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock_on_hand, 3)

    def test_invalid_product_creation_rolls_back_product_and_variants(self):
        staff = User.objects.create_superuser(username="catalog-owner", email="catalog@example.com", password="A-long-test-password-94")
        self.client.force_login(staff)
        response = self.client.post(
            "/api/manage/products/",
            data=json.dumps({
                "brand": "Another Label",
                "category": "Sneakers",
                "name": "Incomplete Runner",
                "price_cents": 12500,
                "variants": [{"size": "8", "sku": self.variant.sku, "stock_on_hand": 1}],
            }),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertFalse(Product.objects.filter(slug="another-label-incomplete-runner").exists())

    def test_dashboard_excludes_shipping_and_respects_consent_for_funnel(self):
        staff = User.objects.create_superuser(username="analytics-owner", email="analytics@example.com", password="A-long-test-password-95")
        self.client.force_login(staff)
        order = Order.objects.create(
            session_key="guest-session",
            checkout_key="analytics-order-key",
            payment_mode="live",
            cart_fingerprint="analytics-fingerprint",
            status="paid",
            payment_status="paid",
            subtotal_cents=12000,
            delivery_cents=800,
            total_cents=12800,
            paid_at=timezone.now(),
        )
        OrderItem.objects.create(
            order=order,
            product=self.product,
            variant=self.variant,
            product_name=self.product.name,
            brand_name=self.brand.name,
            size=self.variant.size,
            sku=self.variant.sku,
            quantity=1,
            unit_price_cents=12000,
            unit_cost_cents=4000,
        )
        today = timezone.localdate().isoformat()
        response = self.client.get(f"/api/manage/dashboard/?from={today}&to={today}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["summary"]["net_sales"], 12000)
        self.assertEqual(data["summary"]["gross_profit"], 8000)
        self.assertEqual(data["summary"]["paid_orders"], 1)
        self.assertEqual(data["funnel"]["purchased"], 0)
        self.assertEqual(StorefrontEvent.objects.filter(event_type="purchase_confirmed").count(), 0)

    @override_settings(STRIPE_SECRET_KEY="sk_test_refund")
    @patch("shop.api.stripe.Refund.create")
    def test_return_refund_records_payment_and_restock_once(self, create_refund):
        staff = User.objects.create_superuser(username="returns-owner", email="returns@example.com", password="A-long-test-password-96")
        self.client.force_login(staff)
        order = Order.objects.create(
            session_key="guest-return-session",
            checkout_key="return-order-key",
            cart_fingerprint="return-fingerprint",
            status="paid",
            payment_status="paid",
            subtotal_cents=12000,
            delivery_cents=800,
            total_cents=12800,
            stripe_payment_intent_id="pi_test_return",
        )
        item = OrderItem.objects.create(
            order=order,
            product=self.product,
            variant=self.variant,
            product_name=self.product.name,
            brand_name=self.brand.name,
            size=self.variant.size,
            sku=self.variant.sku,
            quantity=1,
            unit_price_cents=12000,
            unit_cost_cents=4000,
            reserved=False,
        )
        return_request = ReturnRequest.objects.create(
            order=order,
            order_item=item,
            customer_email="buyer@example.com",
            reason="Wrong size",
            status="received",
            requested_quantity=1,
        )
        create_refund.return_value = stripe.Refund.construct_from({"id": "re_fixture", "status": "succeeded", "amount": 12000, "payment_intent": "pi_test_return"}, "sk_test_refund")
        body = json.dumps({"status": "refunded", "restock": True})
        path = f"/api/manage/returns/{return_request.id}/"
        response = self.client.patch(path, data=body, content_type="application/json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "refunded")
        create_refund.assert_called_once()
        create_refund.assert_called_once_with(
            payment_intent="pi_test_return",
            amount=12000,
            reason="requested_by_customer",
            metadata={"return_id": str(return_request.id)},
            idempotency_key="sole-refund-" + str(return_request.id),
        )
        item.refresh_from_db()
        order.refresh_from_db()
        self.variant.refresh_from_db()
        return_request.refresh_from_db()
        self.assertEqual(item.returned_quantity, 1)
        self.assertEqual(order.refunded_cents, 12000)
        self.assertEqual(self.variant.stock_on_hand, 4)
        self.assertEqual(return_request.status, "refunded")
        self.assertEqual(InventoryMovement.objects.filter(movement_type="return").count(), 1)

    def test_event_tracking_requires_opt_in_and_deduplicates(self):
        response = self.client.post(
            "/api/events/",
            data=json.dumps({"event_id": "d5cb13dd-b0c7-4c92-bcd6-9f7c0b34a2e6", "event_type": "product_viewed"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)
        self.client.post(
            "/api/consent/",
            data=json.dumps({"consent": True}),
            content_type="application/json",
        )
        body = json.dumps({"event_id": "d5cb13dd-b0c7-4c92-bcd6-9f7c0b34a2e6", "event_type": "product_viewed", "product_id": self.product.slug})
        first = self.client.post("/api/events/", data=body, content_type="application/json")
        second = self.client.post("/api/events/", data=body, content_type="application/json")
        self.assertEqual(first.status_code, 202)
        self.assertTrue(first.json()["accepted"])
        self.assertFalse(second.json()["accepted"])
        self.assertEqual(self.product.storefrontevent_set.count(), 1)
