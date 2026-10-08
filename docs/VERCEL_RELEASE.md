# SOLE DISTRICT Vercel release

The current deployment serves the React storefront. Browsing, product details,
filters, sizes, the browser-stored bag and wishlist work without the Django API.
API requests return an explicit `503 BACKEND_NOT_ACTIVATED` response instead of
pretending to create an account or accept payment.

The Django API and merchant workspace are implemented and pass 10 backend tests.
The production build and all four Sites packaging checks pass. Stripe tests use
mocks; no real payment or refund has been verified.

## Activate the hosted backend

1. Authorize and create a dedicated free Neon PostgreSQL database in Singapore.
   Attach it to this Vercel project's production environment. Keep preview
   databases separate from production.
2. Generate and securely configure `DJANGO_SECRET_KEY`. Set `DEBUG=false`,
   `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`, `FRONTEND_ORIGIN` and `DATABASE_URL`.
   Keep both `STRIPE_CHECKOUT_ENABLED` and `LIVE_COMMERCE_ENABLED` false.
3. Replace `vercel.json` with the supplied `vercel.services.json.example`.
   Vercel Services is a beta feature; it deploys the Vite and Django services
   together. Delete `api/unavailable.js` when activating the backend.
4. Deploy and verify the catalogue API, same-origin CSRF/session cookies,
   customer accounts, protected staff routes and database persistence.
5. Create the owner's staff account through a secure management session.
   Do not ship shared administrator credentials or grant staff access to
   visitors of the portfolio.

`backend/vercel_build.py` checks configuration, applies migrations, seeds only
missing illustrative products and creates role groups. Vercel collects Django
static assets automatically. It refuses a deployment without persistent storage.

## Activate payments separately

Use the merchant's Singapore Stripe account and webhook signing secret. Run test
payments and signed webhooks before live activation. PayNow, Apple Pay and Google
Pay depend on the Stripe account and eligible shopper devices. Catalogue records
must have real inventory and verified sourcing before they can be purchased.

The storefront's generated product images and sample stock are illustrative.
Customer authentication, the hosted dashboard and real payments are not claimed
as active in the current storefront deployment.
