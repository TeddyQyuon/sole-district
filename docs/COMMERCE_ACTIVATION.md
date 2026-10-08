# SOLE DISTRICT activation

Source implements the customer storefront and merchant workspace. The public deployment remains a frontend preview with payments disabled while the persistent API database is awaiting approval. Creating a Stripe live account alone does not activate checkout.

## Infrastructure and initial setup

1. Approve a persistent PostgreSQL database for this store. The proposed resource is the free Neon project `sole-district-production`, Singapore region. Do not reuse another application's credentials or data. GitHub CI uses disposable PostgreSQL and cannot replace the production database.
2. Configure `DATABASE_URL`, a unique `DJANGO_SECRET_KEY`, `DEBUG=false`, actual `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS` and `FRONTEND_ORIGIN` in protected backend environment settings. Run migrations, collect static files, create the owner account securely and bootstrap staff groups. Do not store SQLite, passwords or private invoice evidence in Git.
3. Deploy the Python API and route `/api/*` through a same-origin proxy. The existing `vercel.services.json.example` and release notes describe the Python service option. Keep the current frontend-only fallback until the API has persistent storage. Verify HttpOnly secure cookies, CSRF rejection, role permissions and database backups against the deployed service.
4. Configure a trusted client-IP source at the edge before launch. Database rate buckets currently use `REMOTE_ADDR` and never trust arbitrary forwarding headers. Confirm the hosting proxy preserves a usable client address or apply per-client rate limits at the edge; shared proxy addresses can throttle legitimate customers.

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

Local SQLite checks pass the application tests but skip two PostgreSQL-only races. Commerce CI executes the complete suite on PostgreSQL 16, including competing purchases of the last unit and concurrent payment confirmation. Frontend production build and four Sites packaging tests must pass. Hosted customer and authenticated merchant flows remain unverified until production API activation; the frontend preview can be inspected independently.
