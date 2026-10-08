# SOLE DISTRICT build plan

## Complete in this delivery

- [x] Responsive customer storefront based on the supplied SOLE DISTRICT prototypes.
- [x] Search, category/brand/size filters, product details, wishlist, cart, account, address, order and return-request flows.
- [x] Django catalogue, variant-level inventory, stock lots, movement history, order snapshots and role-aware merchant APIs.
- [x] Stripe Checkout Session creation with server-held prices, atomic stock reservations, stable idempotency, verified webhooks and refund handling.
- [x] Consent-aware storefront events and database-backed sales, funnel, size, inventory and campaign reports.
- [x] Merchant workspace for overview, orders, products, inventory, returns, customers, marketing attribution, analytics and launch settings.
- [x] Local PostgreSQL/Docker setup, SQLite developer fallback, environment examples and operational documentation.
- [x] Backend tests, frontend build and Sites packaging checks.

## Before accepting live orders

- [ ] Replace illustrative catalogue items and images with verified supplier and product records.
- [ ] Record actual stock receipts, cost prices and approved sourcing evidence.
- [ ] Publish final shipping, tax, return, privacy and customer-contact policies.
- [ ] Configure a Singapore Stripe account, enable the required payment methods, link the DBS payout bank account and verify test payments/webhooks.
- [ ] Configure the production API host, same-origin /api/ proxy, secure environment variables, email delivery, backups and monitoring.
- [ ] Test Apple Pay and Google Pay on eligible devices and browsers.
- [ ] Set STRIPE_CHECKOUT_ENABLED=true; set LIVE_COMMERCE_ENABLED=true only after the test checklist is complete.

Illustrative catalogue items cannot be purchased by design.
