from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from unittest import skipUnless

from django.contrib.auth.models import AnonymousUser
from django.contrib.sessions.backends.db import SessionStore
from django.db import close_old_connections, connection, transaction
from django.test import RequestFactory, TransactionTestCase

from .api import _create_or_reuse_order, _process_stripe_event
from .models import Brand, Category, Product, ProductVariant, SourcingReview, Order, InventoryMovement


@skipUnless(connection.vendor == 'postgresql', 'Requires real PostgreSQL row locks; exercised by commerce CI')
class PostgreSQLConcurrencyTests(TransactionTestCase):
    def setUp(self):
        brand = Brand.objects.create(name='Race fixture', slug='race-fixture')
        category = Category.objects.create(name='Sneakers', slug='sneakers')
        self.product = Product.objects.create(brand=brand, category=category, name='Fixture', slug='fixture',
            status='active', is_illustrative=False, sourcing_status='verified', price_cents=10000)
        SourcingReview.objects.create(product=self.product, supplier='Fixture only', invoice_reference='MOCK', evidence_reference='Mock test evidence', status='verified')
        self.variant = ProductVariant.objects.create(product=self.product, sku='RACE-8', size='8', stock_on_hand=1)

    def request(self):
        request = RequestFactory().post('/api/checkout/')
        request.session = SessionStore(); request.session.create(); request.user = AnonymousUser()
        return request

    def test_two_buyers_racing_for_last_unit_have_one_winner(self):
        requests = [self.request(), self.request()]
        barrier = Barrier(2)
        def buy(index):
            close_old_connections()
            try:
                barrier.wait(timeout=10)
                _create_or_reuse_order(requests[index], [{'variant_id': 'sku:RACE-8', 'quantity': 1}], f'race_checkout_key_{index}')
                return 'reserved'
            except ValueError:
                return 'sold out'
            finally: close_old_connections()
        with ThreadPoolExecutor(max_workers=2) as pool:
            outcomes = list(pool.map(buy, [0, 1]))
        self.assertCountEqual(outcomes, ['reserved', 'sold out'])
        self.variant.refresh_from_db(); self.assertEqual(self.variant.reserved_stock, 1)
        self.assertEqual(Order.objects.count(), 1)

    def test_concurrent_paid_events_consume_stock_once(self):
        order, _ = _create_or_reuse_order(self.request(), [{'variant_id': 'sku:RACE-8', 'quantity': 1}], 'parallel_paid_key')
        order.stripe_session_id = 'cs_parallel'; order.save()
        event = {'type': 'checkout.session.completed', 'data': {'object': {'id': 'cs_parallel',
            'mode': 'payment', 'currency': 'sgd', 'livemode': False, 'amount_total': order.total_cents,
            'client_reference_id': str(order.public_id), 'metadata': {'order_id': str(order.public_id), 'commerce_mode': 'test'},
            'payment_status': 'paid', 'payment_intent': 'pi_parallel'}}}
        barrier = Barrier(2)
        def pay(_):
            close_old_connections()
            try:
                barrier.wait(timeout=10)
                with transaction.atomic(): _process_stripe_event(event)
            finally: close_old_connections()
        with ThreadPoolExecutor(max_workers=2) as pool: list(pool.map(pay, [0, 1]))
        self.variant.refresh_from_db()
        self.assertEqual((self.variant.stock_on_hand, self.variant.reserved_stock), (0, 0))
        self.assertEqual(InventoryMovement.objects.filter(movement_type='sale').count(), 1)
