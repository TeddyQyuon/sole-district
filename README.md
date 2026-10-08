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

The server builds line items from current database prices, reserves size-specific stock atomically, and verifies webhook signatures against the unmodified request body. A checkout redirect is not treated as proof of payment. Keep LIVE_COMMERCE_ENABLED=false until test-mode checks and launch requirements are complete. Live keys are rejected unless the live switch is explicitly enabled.

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

Host Django and PostgreSQL on a Python-capable service. Run `python manage.py collectstatic` and serve Django admin assets from `STATIC_ROOT`. Serve the Vite build on Vercel or another static host. Route browser /api/* requests through a same-origin rewrite to the Django host so the HttpOnly session and CSRF cookies remain first-party. A rewrite template is in vercel.json.example; replace its example API host before using it.

Set production DJANGO_SECRET_KEY, DEBUG=false, ALLOWED_HOSTS, CSRF_TRUSTED_ORIGINS, FRONTEND_ORIGIN, DATABASE_URL, Stripe secrets, and email settings in the backend host’s secret manager. Register the Stripe webhook directly with https://<api-host>/api/stripe/webhook/. Use HTTPS, backups, monitoring, rate limiting at the edge, and a scheduled reconciliation/retention process.

## Current limits

- Discount codes and automatic tax are not implemented.
- Customer password-reset and transactional order-email flows are not implemented. SMTP settings are placeholders for a future provider integration.
- Products in the starter catalogue use generated illustrative imagery and preview stock. Replace them with accurate, authorised product media and physical sourcing checks before selling.
- Stripe credentials were not supplied, so real charges, PayNow, Apple Pay, Google Pay, refunds and production webhooks have not been run.
