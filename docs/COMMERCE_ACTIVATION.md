# SOLE DISTRICT activation

The React storefront and Django API are deployed together on Vercel in Singapore. The approved, dedicated Neon project `sole-district-production` is connected to Production only. Migrations and staff groups are installed, and `/api/health/` confirms PostgreSQL. The catalogue remains illustrative and payments are disabled. Owner credential setup, real email transport and Stripe verification remain pending. Creating a Stripe live account alone does not activate checkout.

## Infrastructure and initial setup

1. Production already has `DATABASE_URL`, an independent `DJANGO_SECRET_KEY`, `DEBUG=false`, the storefront origin and allowed/CSRF hosts. Database secrets are protected and are not shared with another application. GitHub CI uses disposable PostgreSQL. `DEBUG=false` refuses an absent production database instead of silently writing ephemeral SQLite.
2. `vercel.json` defines the storefront and Django services. Ordered public routes select the built `/django` function for API and admin requests without changing the path Django receives; static admin assets route to the backend and the root selects `index.html`. The frontend-only rollback configuration is `vercel.frontend-only.json.example`. The older templates are examples, not the active configuration.
3. `backend/vercel_build.py` runs deployment security checks, migrations, non-overwriting catalogue seeding and role setup. It uses `DATABASE_URL_UNPOOLED` for build-time migrations and a PostgreSQL advisory lock to serialize concurrent builds. Runtime uses the pooled connection with `DATABASE_CONN_MAX_AGE=0`. Static assets are collected by the Django deployment builder.
4. Complete first-owner setup below, then verify authenticated merchant workflows. Verify database recovery/backups against the actual Neon plan before a commercial launch.
5. Configure a trusted client-IP source at the edge before launch. Database rate buckets currently use `REMOTE_ADDR` and never trust arbitrary forwarding headers. Confirm the hosting proxy preserves a usable client address or apply per-client rate limits at the edge; shared proxy addresses can throttle legitimate customers.

## First owner

In SOLE DISTRICT's Vercel Environment Variables, choose and enter `SOLE_OWNER_USERNAME`, `SOLE_OWNER_EMAIL` and `SOLE_OWNER_PASSWORD` yourself. Scope them to Production and mark the password Sensitive. Use a unique strong password; do not put it in chat or Git. Redeploy the current main commit. The build validates the values and Django's password rules before creating the initial superuser.

The bootstrap requires all three fields together. If any owner or superuser already exists, it preserves that account and password. It refuses to promote an existing customer or reuse their email. After the deployment confirms account creation, remove the three bootstrap variables and redeploy. Sign in at `/manage`; Django record setup is at `/django-admin/`. Further staff should receive only their required role.

## Store content

Use merchant Products to create accurate listings, photos, alt text, SKU/colour/size records, prices and costs. Record counted stock receipts in Inventory. The owner records supplier, invoice and private evidence references in Product details → Private sourcing review. These are actual document references, not generated certificates. Illustrative items remain blocked from checkout.

Use merchant Settings to draft and explicitly approve the five policy pages: delivery, returns, privacy, terms and store/contact details. Include the actual tax treatment in reviewed terms. Checkout currently charges SGD prices and Singapore delivery of S$8, free at S$150. Shipping configuration and policy must agree before `STORE_POLICIES_APPROVED=true`. Automatic tax and discount codes are not implemented; do not advertise them.

## Email and operations

Set the store's SMTP host, credentials, sender and `STORE_SUPPORT_EMAIL` securely. Run `python manage.py send_store_emails` periodically. It sends queued messages with a 10-second transport timeout, up to five attempts; failed messages need monitoring and operator retry. Successful messages are deleted after one day because they contain access links. Provider-accepted mail may be delivered more than once if a worker crashes before recording success; links are still single-use. SMTP acceptance is not proof of inbox delivery.

Verification links last 24 hours. Password reset and guest-order links last 30 minutes. Guest links grant only one order in the receiving browser for 30 minutes. Verify an account email to associate matching paid guest orders. New passwords revoke all outstanding reset tokens and invalidate old authenticated sessions through Django's password hash checks.

Schedule checkout reconciliation, email delivery, session cleanup and event retention on the backend host. No external scheduler has been activated. Monitor failed webhook receipts, pending refunds and outbox attempts. Unknown Checkout Session creation outcomes retain stock and require same-key recovery; never release those reservations based only on elapsed time.

## Stripe activation

Complete Stripe account verification and bank setup yourself. Store the SOLE DISTRICT **test** secret and webhook signing secret directly in the protected deployment settings; do not put them in chat, Vite variables, source or screenshots. Hosted Checkout handles cards and eligible wallets; enable PayNow through the eligible Singapore Stripe account.

Register the backend webhook `/api/stripe/webhook/` for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `refund.created`, `refund.updated` and `refund.failed`. Signatures are checked against the raw request body. Pin and test the webhook API version against the installed Stripe SDK.

Before live activation, exercise card success/decline, abandoned/expired checkout, delayed payment success/failure, duplicate and reordered webhooks, unknown network outcomes, refund pending/success/failure, inspected-return restocking and guest access. Confirm SGD totals, actual shipping addresses, physical stock, emails and eligible PayNow/Apple Pay/Google Pay on the deployed domain. Mock tests do not verify Stripe account eligibility or real payments.

Then configure the live key and the live endpoint's signing secret in the backend environment. Set `LIVE_TESTS_CONFIRMED=true`, `STORE_POLICIES_APPROVED=true`, `STRIPE_CHECKOUT_ENABLED=true` and `LIVE_COMMERCE_ENABLED=true` only after the checks are complete. The server also requires PostgreSQL, configured email transport and all five approved published policies for live checkout.

## Reporting and reconciliation limits

Operational sales reports include confirmed live-mode orders and workspace merchandise refunds, attributed to the original sale date; delivery is excluded. Profit uses recorded unit costs and retained units and can be negative. Costs consumed from mixed FIFO lots use an integer-cent weighted unit estimate, so this is not an accounting valuation ledger. Missing costs withhold profit. Returned units are treated as restored cost basis; damaged stock write-offs are not incorporated into that estimate.

Refunds made directly in the Stripe Dashboard raise a reconciliation alert for known orders. Failed or cancelled refund records require operator investigation rather than a second automatic refund attempt. Reconcile Stripe balance transactions and shipping refunds separately before financial reporting. Funnel counts consented browser identities in the selected range, not visits or a fixed cohort. Repeat-customer counts use repeated email purchases in that range.

## Verification

Commerce CI run 37746172639 passed all 42 backend tests on PostgreSQL 16, including competing purchases of the last unit, concurrent payment confirmation, database-readiness failures and first-owner safeguards. The frontend production build, four Sites packaging tests and migration consistency checks passed.

Hosted checks on 8 October 2026 confirmed the PostgreSQL health response, catalogue API, secure HttpOnly session cookie, CSRF rejection for unauthenticated login submissions without a token, a 401 response for a protected merchant endpoint, admin static CSS and the public account/recovery screens. A second deployment found no migrations to apply, confirming persistent storage across deployments. Authenticated merchant operations await first-owner credential entry. Email inbox delivery and real Stripe payment/refund flows remain unverified.
