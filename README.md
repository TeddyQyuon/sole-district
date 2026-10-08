# SOLE DISTRICT

SOLE DISTRICT is a branded streetwear commerce project with a React storefront, a Django commerce API, a merchant workspace, size-level inventory and Shopify-style operational analytics.

The provided products, availability, prices and photographs are illustrative. Checkout is disabled until authentic product and supplier records, live stock, store policies and Stripe settings are ready. This project does not claim brand authorisation.

## Stack

- Customer site and merchant workspace: React 19, Vite, React Router, Phosphor icons.
- API and operations: Python 3.12, Django 6.0, Django sessions and Django admin.
- Database: PostgreSQL 16 for deployment; SQLite is the zero-setup local fallback.
- Payments: Stripe-hosted Checkout, with card and PayNow methods. Apple Pay and Google Pay are shown by Stripe only where the customer device, browser and merchant configuration qualify.

## Run locally in VS Code

Use two terminals from the sole-district folder.

### Terminal 1: Django

Windows PowerShell:

~~~powershell
cd backend
Copy-Item .env.example .env
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.lock
python manage.py migrate
python manage.py seed_catalog
python manage.py bootstrap_roles
python manage.py createsuperuser
python manage.py runserver 127.0.0.1:8000
~~~

macOS/Linux:

~~~bash
cd backend
cp .env.example .env
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.lock
python manage.py migrate
python manage.py seed_catalog
python manage.py bootstrap_roles
python manage.py createsuperuser
python manage.py runserver 127.0.0.1:8000
~~~

### Terminal 2: Vite

~~~bash
npm install
npm run dev
~~~

Open http://localhost:5173. The Vite development server proxies /api/ to Django on port 8000. The merchant workspace is at /manage; sign in with the Django superuser created above. Django’s record-focused admin is at /django-admin/.

For PostgreSQL in Docker, copy backend/.env.example to backend/.env, then run docker compose up --build. Create the first staff account with `docker compose exec backend python manage.py createsuperuser`. The Compose database password is only for local development.

## Payments

Stripe Checkout is disabled by default. For a test-mode integration:

1. Configure an eligible Singapore Stripe account and use its test secret key.
2. Enable cards and PayNow in the Stripe Dashboard. PayNow uses a Stripe-generated QR code and is settled through Stripe to the payout bank account linked in Stripe. A direct transfer to a personal DBS PayNow number is not used by this checkout.
3. Start a Stripe webhook listener and forward events to http://localhost:8000/api/stripe/webhook/. Put the listener’s signing secret in STRIPE_WEBHOOK_SECRET.
4. Set STRIPE_CHECKOUT_ENABLED=true in backend/.env, restart Django, and test completed, delayed, failed and expired Checkout Sessions.
5. Stripe can display Apple Pay and Google Pay through hosted Checkout when enabled and available for the shopper’s device/browser. Apple Pay needs no extra configuration for hosted Checkout; Google Pay requires payment methods enabled, an HTTPS storefront, and domain registration in Stripe. Test the production domain before launch.

The server builds line items from current database prices, reserves size-specific stock atomically, and verifies webhook signatures against the unmodified request body. A checkout redirect is not treated as proof of payment. Keep LIVE_COMMERCE_ENABLED=false until test-mode checks and launch requirements are complete. Live keys are rejected unless PostgreSQL, configured email transport, all five approved and published store policies, STORE_POLICIES_APPROVED, LIVE_TESTS_CONFIRMED and LIVE_COMMERCE_ENABLED are ready.

Never place a Stripe secret or webhook signing secret in Vite variables, source control, screenshots or chat.

## Staff roles

Create a Django user with createsuperuser for owner access. Assign other staff to the groups created by bootstrap_roles:

- catalogue: product catalogue.
- warehouse: stock and fulfilment.
- support: orders, returns and customer summaries.
- analyst: analytics and customer summaries.
- owner: full workspace access.

The built-in Django admin is reserved for initial account and record setup. Merchant workflows use the custom /manage interface and role checks in the API.

## Data and reporting

- Product size/colour variants own their SKU, price, cost, on-hand stock and reservations.
- Order item names, sizes, SKUs, prices and costs are snapshotted at checkout.
- Stock receipts create FIFO stock lots. Gross profit is withheld when recorded product costs are missing.
- Browser events require explicit consent, use deduplicated event IDs and exclude staff. Purchases are recorded from successful Stripe webhooks.
- Reports show their date range and last refresh time. Optional event retention defaults to 180 days; schedule python manage.py purge_storefront_events.
- python manage.py reconcile_checkout_orders checks known Stripe sessions and reports uncertain sessions for safe same-key recovery. It does not automatically release a reservation when no Stripe session ID was saved.

## Checks

~~~bash
cd backend
python manage.py check
python manage.py test
python manage.py makemigrations --check --dry-run
cd ..
npm run build
npm run test:sites
~~~

## Deployment notes

The current `vercel.json` deploys React and Django as services in Singapore, with same-origin API/admin routing and a dedicated Neon production database. The build serializes migrations, seeds only missing illustrative products, initializes staff roles and collects admin assets. Production refuses an absent database; SQLite is for local development. `vercel.frontend-only.json.example` preserves the frontend-only rollback option.

Choose and enter `SOLE_OWNER_USERNAME`, `SOLE_OWNER_EMAIL` and a Sensitive `SOLE_OWNER_PASSWORD` directly in Production environment settings, then redeploy to create the first owner. Remove the bootstrap variables afterwards. The command never replaces an existing owner or resets a password. The [activation runbook](docs/COMMERCE_ACTIVATION.md) covers this setup and the remaining email, payment and operational requirements. Stripe keys and real email transport have not been configured.

## Current limits

- Discount codes and automatic tax are not implemented.
- Account verification, password reset, scoped guest-order links and order notifications use single-use hashed tokens and a durable email outbox. Configure SMTP and run `python manage.py send_store_emails` periodically before launch. Real email transport has not been activated.
- Products in the starter catalogue use generated illustrative imagery and preview stock. Replace them with accurate, authorised product media and physical sourcing checks before selling.
- Stripe credentials were not supplied, so real charges, PayNow, Apple Pay, Google Pay, refunds and production webhooks have not been run.

## Commerce continuation — 8 October 2026

- Customer accounts include email verification and password recovery. Guest orders have single-use links with 30-minute scoped access; links use URL fragments and are removed from browser history.
- Supplier, invoice and private evidence references require owner review. A manual sourcing flag cannot make a product sale-ready; the latest review controls clearance. Product editing includes galleries, alternative text, SKU prices, costs and availability. Changing identity or media requires a new review.
- Stripe webhooks validate order association, session identity, currency, expected amount and test/live mode. Durable event receipts survive failed processing. Delayed payments retain reservations. Refunds and inspected-return restocking complete only after a succeeded Stripe refund.
- Fulfilment moves through paid → fulfilling → shipped → completed, with tracking required and customer-visible updates. Staff navigation uses API permissions. CSV exports escape spreadsheet formulas.
- Sales reports exclude Stripe test orders, preserve fully refunded orders in their original sale period and show losses instead of clamping profit to zero. They include brand demand, return request rate and repeat customers within the selected period. External Stripe dashboard refunds require reconciliation; this is an operational report, not a tax ledger.
- Store policies can be drafted and approved in merchant Settings. Contact enquiries are recorded and queued to STORE_SUPPORT_EMAIL once configured. No policies or supplier claims have been fabricated.

See [the activation runbook](docs/COMMERCE_ACTIVATION.md) for the remaining production dependencies. Permanent GitHub Actions checks use an ephemeral PostgreSQL 16 service to exercise real row-lock races. No persistent production database is created by CI.
