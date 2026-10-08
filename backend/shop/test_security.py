import json
import re
from datetime import timedelta
from unittest.mock import patch

import stripe
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management import call_command
from django.test import Client, TestCase, override_settings
from django.utils import timezone

from .api import _create_or_reuse_order, _process_stripe_event, _analytics_data
from .models import (AccessToken, EmailOutbox, CustomerProfile, Order, OrderItem,
                     SourcingReview, ReturnRequest, RefundRecord, InventoryMovement,
                     StripeWebhookEvent, ProductVariant)
from .security import issue_token
from . import tests as baseline

User = get_user_model()


class SecurityTests(TestCase):
    setUp = baseline.StoreApiTests.setUp

    def post(self, path, body, client=None):
        return (client or self.client).post('/api/' + path, data=json.dumps(body), content_type='application/json')

    def order(self):
        session = self.client.session
        order = Order.objects.create(session_key=session.session_key, checkout_key='checkout_' + str(Order.objects.count()),
            subtotal_cents=12000, delivery_cents=800, total_cents=12800,
            stripe_session_id='cs_' + str(Order.objects.count()), customer_email='buyer@example.com')
        OrderItem.objects.create(order=order, product=self.product, variant=self.variant,
            product_name=self.product.name, brand_name=self.brand.name, sku=self.variant.sku,
            size='8', quantity=1, unit_price_cents=12000, unit_cost_cents=4000)
        self.variant.reserved_stock += 1
        self.variant.save()
        return order

    def event(self, order, event_type='checkout.session.completed', **values):
        data = dict(id=order.stripe_session_id, mode='payment', currency='sgd', livemode=False,
            amount_total=order.total_cents, metadata={'order_id': str(order.public_id), 'commerce_mode': 'test'},
            client_reference_id=str(order.public_id), payment_status='paid', payment_intent='pi_1',
            customer_details={'email': 'buyer@example.com', 'phone': '+6590000000', 'address': {'line1': 'BILLING'}},
            collected_information={'shipping_details': {'name': 'Buyer', 'address': {'line1': 'SHIPPING', 'country': 'SG'}}})
        data.update(values)
        return {'id': 'evt_security', 'type': event_type, 'data': {'object': data}}

    @override_settings(STRIPE_WEBHOOK_SECRET='whsec_test')
    def test_wrong_payment_amount_cannot_consume_stock_and_failure_is_durable(self):
        order = self.order()
        with patch('shop.api.stripe.Webhook.construct_event', return_value=self.event(order, amount_total=1)):
            response = self.client.post('/api/stripe/webhook/', data=b'{}', content_type='application/json')
        self.assertEqual(response.status_code, 500)
        self.assertEqual(StripeWebhookEvent.objects.get().status, 'failed')
        order.refresh_from_db(); self.variant.refresh_from_db()
        self.assertIsNone(order.paid_at)
        self.assertEqual(self.variant.reserved_stock, 1)

    def test_mismatched_mode_currency_session_and_association_are_rejected(self):
        from django.db import transaction
        order = self.order()
        for values in [{'livemode': True}, {'currency': 'usd'}, {'id': 'cs_other'}, {'mode': 'subscription'}, {'client_reference_id': 'other'}]:
            with self.subTest(values=values), self.assertRaises(ValueError), transaction.atomic():
                _process_stripe_event(self.event(order, **values))
        self.assertEqual(InventoryMovement.objects.filter(movement_type='sale').count(), 0)

    def test_shipping_uses_collected_shipping_and_duplicate_after_refund_is_safe(self):
        from django.db import transaction
        order = self.order()
        with transaction.atomic():
            _process_stripe_event(self.event(order))
        order.refresh_from_db()
        self.assertEqual(order.shipping_address['line1'], 'SHIPPING')
        self.assertEqual(order.customer_phone, '+6590000000')
        order.payment_status = order.status = 'refunded'; order.save()
        with transaction.atomic():
            _process_stripe_event(self.event(order))
            _process_stripe_event(self.event(order, 'checkout.session.expired', payment_status='unpaid'))
        self.variant.refresh_from_db(); order.refresh_from_db()
        self.assertEqual(self.variant.stock_on_hand, 2)
        self.assertEqual(order.status, 'refunded')
        self.assertEqual(EmailOutbox.objects.count(), 1)

    def test_async_unpaid_success_does_not_fulfil(self):
        from django.db import transaction
        order = self.order()
        with transaction.atomic():
            _process_stripe_event(self.event(order, 'checkout.session.async_payment_succeeded', payment_status='unpaid'))
        order.refresh_from_db()
        self.assertEqual(order.payment_status, 'pending')
        self.assertIsNone(order.paid_at)

    @patch('shop.api.stripe.checkout.Session.expire')
    def test_completed_unpaid_session_cannot_release_stock(self, expire):
        order = self.order()
        expire.return_value = stripe.checkout.Session.construct_from({'status': 'complete', 'payment_status': 'unpaid'}, 'sk_test')
        response = self.post('checkout/cancel/', {'order_id': str(order.public_id)})
        self.assertEqual(response.status_code, 409)
        self.variant.refresh_from_db(); self.assertEqual(self.variant.reserved_stock, 1)

    def test_unknown_stripe_session_keeps_reservation(self):
        order = self.order(); order.stripe_session_id = None; order.save()
        self.assertEqual(self.post('checkout/cancel/', {'order_id': str(order.public_id)}).status_code, 409)
        self.variant.refresh_from_db(); self.assertEqual(self.variant.reserved_stock, 1)

    def test_empty_anonymous_session_never_lists_unowned_orders(self):
        Order.objects.create(checkout_key='blank', session_key='', subtotal_cents=1, total_cents=1)
        self.assertEqual(Client().get('/api/orders/').json()['orders'], [])

    def test_guest_link_is_scoped_single_use_and_expires(self):
        order = self.order(); other = self.order()
        stranger = Client()
        raw = issue_token('order', order=order)
        self.assertFalse(AccessToken.objects.filter(digest=raw).exists())
        self.assertEqual(self.post('auth/token/', {'purpose': 'order', 'token': raw}, stranger).status_code, 200)
        self.assertEqual([row['id'] for row in stranger.get('/api/orders/').json()['orders']], [str(order.public_id)])
        self.assertEqual(self.post('auth/token/', {'purpose': 'order', 'token': raw}, stranger).status_code, 400)
        expired = issue_token('order', order=other, minutes=-1)
        self.assertEqual(self.post('auth/token/', {'purpose': 'order', 'token': expired}, stranger).status_code, 400)

    def test_password_reset_invalidates_all_links_without_signing_in(self):
        user = User.objects.create_user(username='customer', email='buyer@example.com', password='Initial-long-password-91')
        raw = issue_token('reset', user=user); second = issue_token('reset', user=user)
        self.assertEqual(self.post('auth/token/', {'purpose': 'reset', 'token': raw, 'password': 'Replacement-long-password-92'}).status_code, 200)
        user.refresh_from_db(); self.assertTrue(user.check_password('Replacement-long-password-92'))
        self.assertEqual(self.post('auth/token/', {'purpose': 'reset', 'token': second, 'password': 'Another-password-93'}).status_code, 400)
        self.assertFalse(self.client.get('/api/auth/me/').json()['authenticated'])

    def test_verify_email_claims_only_matching_paid_guest_orders(self):
        user = User.objects.create_user(username='buyer', email='buyer@example.com')
        order = self.order(); order.paid_at = timezone.now(); order.save()
        other = self.order(); other.customer_email = 'other@example.com'; other.paid_at = timezone.now(); other.save()
        raw = issue_token('verify', user=user)
        self.assertEqual(self.post('auth/token/', {'purpose': 'verify', 'token': raw}).status_code, 200)
        order.refresh_from_db(); other.refresh_from_db()
        self.assertEqual(order.user_id, user.pk); self.assertIsNone(other.user_id)
        self.assertTrue(CustomerProfile.objects.get(user=user).email_verified_at)

    def test_email_requests_do_not_disclose_account_or_return_tokens(self):
        User.objects.create_user(username='buyer', email='buyer@example.com')
        known = self.post('auth/email/', {'email': 'buyer@example.com'})
        unknown = self.post('auth/email/', {'email': 'unknown@example.com'})
        self.assertEqual(known.json(), unknown.json())
        self.assertNotIn('token', known.json())
        self.assertEqual(EmailOutbox.objects.count(), 1)

    def test_sourcing_flag_without_evidence_is_not_sale_ready(self):
        SourcingReview.objects.all().delete()
        self.assertFalse(self.product.sellable)

    def test_unsafe_customer_request_requires_csrf_and_session_cookie_is_http_only(self):
        strict = Client(enforce_csrf_checks=True)
        self.assertEqual(self.post('auth/register/', {'email': 'buyer@example.com', 'password': 'Long-safe-password-92'}, strict).status_code, 403)
        response = strict.get('/api/csrf/')
        self.assertTrue(response.cookies['sessionid']['httponly'])

    def test_registration_and_sign_in_keep_existing_guest_orders_visible(self):
        order = self.order()
        response = self.post('auth/register/', {'email': 'buyer@example.com', 'password': 'Long-safe-password-92'})
        self.assertEqual(response.status_code, 201)
        self.assertIn(str(order.public_id), [row['id'] for row in self.client.get('/api/orders/').json()['orders']])
        order.refresh_from_db(); self.assertIsNone(order.user_id)

    def test_saved_address_is_editable_and_never_visible_to_another_customer(self):
        first = User.objects.create_user(username='one', password='Long-safe-password-92')
        second = User.objects.create_user(username='two', password='Long-safe-password-93')
        self.client.force_login(first)
        values = {'recipient': 'Fixture', 'line1': '1 Test Road', 'postal_code': '123456', 'is_default': True}
        saved = self.post('auth/addresses/', values).json()
        update = self.client.patch('/api/auth/addresses/', data=json.dumps({**values, 'id': saved['id'], 'line1': '2 Test Road'}), content_type='application/json')
        self.assertEqual(update.status_code, 201)
        self.assertEqual(self.client.get('/api/auth/addresses/').json()['addresses'][0]['line1'], '2 Test Road')
        self.client.force_login(second)
        self.assertEqual(self.client.get('/api/auth/addresses/').json()['addresses'], [])
        self.assertEqual(self.client.patch('/api/auth/addresses/', data=json.dumps({**values, 'id': saved['id']}), content_type='application/json').status_code, 404)

    def test_only_published_approved_policies_reach_the_storefront(self):
        from .models import StorePolicy
        StorePolicy.objects.create(slug='delivery', title='Draft', body='Draft text', published=False)
        self.assertEqual(self.client.get('/api/policies/').json()['policies'], [])
        StorePolicy.objects.update(published=True, approved_at=timezone.now())
        self.assertEqual(self.client.get('/api/policies/').json()['policies'][0]['title'], 'Draft')

    def test_inventory_rejects_boolean_quantity_and_negative_cost(self):
        staff = User.objects.create_superuser(username='owner', password='Owner-password-91', email='owner@example.com')
        self.client.force_login(staff)
        for values in [{'quantity_change': True}, {'quantity_change': 1, 'unit_cost_cents': -1}]:
            response = self.post('manage/inventory/adjust/', {'sku': self.variant.sku, 'reason': 'Fixture count', **values})
            self.assertEqual(response.status_code, 400)

    def test_latest_rejected_review_revokes_clearance(self):
        SourcingReview.objects.create(product=self.product, supplier='Fixture', invoice_reference='TEST', evidence_reference='mock', status='rejected')
        self.assertFalse(self.product.sellable)

    def test_colour_variants_have_unique_sku_identity_and_legacy_is_ambiguous(self):
        ProductVariant.objects.create(product=self.product, sku='OTHER-8', size='8', colour='red', stock_on_hand=1)
        ids = [row['id'] for row in self.client.get('/api/catalog/').json()['products'][0]['variants']]
        self.assertEqual(len(set(ids)), 2)
        from .api import _resolve_variant_key
        with self.assertRaises(ValueError): _resolve_variant_key('test-runner-1:8')

    def test_customer_cannot_enter_merchant_api(self):
        user = User.objects.create_user(username='customer', password='Customer-password-91')
        self.client.force_login(user)
        self.assertEqual(self.client.get('/api/manage/orders/').status_code, 401)

    def test_warehouse_permissions_and_owner_only_evidence(self):
        staff = User.objects.create_user(username='warehouse', password='Warehouse-password-91', is_staff=True)
        staff.groups.add(Group.objects.create(name='warehouse'))
        self.client.force_login(staff)
        self.assertEqual(self.client.get('/api/manage/session/').json()['permissions'], ['inventory', 'orders'])
        self.assertEqual(self.client.get('/api/manage/products/test-runner-1/sourcing/').status_code, 403)

    def test_order_transition_requires_tracking_and_cannot_skip(self):
        staff = User.objects.create_superuser(username='owner', password='Owner-password-91', email='owner@example.com')
        self.client.force_login(staff)
        order = self.order(); order.status = order.payment_status = 'paid'; order.paid_at = timezone.now(); order.save()
        path = '/api/manage/orders/' + str(order.public_id) + '/'
        update = lambda body: self.client.patch(path, data=json.dumps(body), content_type='application/json')
        self.assertEqual(update({'status': 'shipped'}).status_code, 409)
        self.assertEqual(update({'status': 'fulfilling'}).status_code, 200)
        self.assertEqual(update({'status': 'shipped'}).status_code, 400)
        self.assertEqual(update({'status': 'shipped', 'tracking_number': 'TEST123', 'carrier': 'Fixture courier'}).status_code, 200)
        self.assertEqual(order.updates.count(), 2)

    @override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
    def test_outbox_delivery_is_idempotent_on_success(self):
        from django.core import mail
        EmailOutbox.objects.create(key='test-email', recipient='buyer@example.com', subject='Test only', body='Fixture')
        call_command('send_store_emails', verbosity=0); call_command('send_store_emails', verbosity=0)
        self.assertEqual(len(mail.outbox), 1)

    def test_reports_exclude_test_orders_and_show_losses(self):
        order = self.order(); order.paid_at = timezone.now(); order.payment_status = 'paid'; order.save()
        staff = User.objects.create_superuser(username='owner', password='Owner-password-91', email='owner@example.com')
        self.client.force_login(staff)
        self.assertEqual(self.client.get('/api/manage/dashboard/').json()['summary']['paid_orders'], 0)
        order.payment_mode = 'live'; order.save()
        order.items.update(unit_cost_cents=15000)
        self.assertEqual(self.client.get('/api/manage/dashboard/').json()['summary']['gross_profit'], -3000)

    @override_settings(STRIPE_SECRET_KEY='sk_test_fixture')
    @patch('shop.merchant.stripe.Refund.create')
    def test_pending_refund_does_not_restock_until_success_and_then_once(self, refund):
        from django.db import transaction
        from .merchant import reconcile_refund
        order = self.order(); order.stripe_payment_intent_id = 'pi_fixture'; order.paid_at = timezone.now(); order.save()
        row = ReturnRequest.objects.create(order=order, order_item=order.items.get(), customer_email=order.customer_email, reason='Wrong size', status='received')
        staff = User.objects.create_superuser(username='owner', password='Owner-password-91', email='owner@example.com'); self.client.force_login(staff)
        data = {'id': 're_pending', 'status': 'pending', 'payment_intent': 'pi_fixture', 'amount': 12000}
        refund.return_value = stripe.Refund.construct_from(data, 'sk_test_fixture')
        response = self.client.patch(f'/api/manage/returns/{row.pk}/', data=json.dumps({'status': 'refunded', 'restock': True}), content_type='application/json')
        self.assertEqual(response.status_code, 202)
        self.variant.refresh_from_db(); self.assertEqual(self.variant.stock_on_hand, 3)
        data['status'] = 'succeeded'
        with transaction.atomic(): reconcile_refund(data); reconcile_refund(data)
        self.variant.refresh_from_db(); self.assertEqual(self.variant.stock_on_hand, 4)
        self.assertEqual(InventoryMovement.objects.filter(movement_type='return').count(), 1)
