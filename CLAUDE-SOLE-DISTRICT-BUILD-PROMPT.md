# Claude coding prompt — SOLE DISTRICT

You are my senior full-stack engineer, UI designer, and QA engineer. Build SOLE DISTRICT: a premium branded streetwear e-commerce website for authentic sneakers, clothing, and accessories.

Start with the customer-facing site. Implement a real Python + Django commerce backend where needed to make shopping and payments work. The custom merchant/admin analytics dashboard is the next phase, not part of this release. Create a clean data foundation for it without building its UI now.

Do the implementation, run it, test it, and fix failures. Do not stop after giving me a plan or scaffolding. Work in phases and make routine reversible decisions independently. Ask only when missing information actually blocks dependent work. Missing payment credentials must not block storefront development.

## 1. Inspect before editing

- Inspect the repository, AGENTS.md, package files, routes, environment examples, existing APIs, assets, and tests first.
- If I supply a starter archive, inspect and continue its useful code instead of replacing it without reason. The current SOLE DISTRICT starter is unfinished: it contains React components, catalogue data, and image assets; its styling and Django/Stripe backend still need implementation and verification. Do not assume any existing component works.
- If no repository exists, create a clean project with frontend/, backend/, and docs/.
- Preserve any required hosting/runtime files in a supplied starter. Document necessary architectural changes.
- Create PLAN.md with checkable phases. Record scope and run instructions in README.md.
- Do not reuse secrets or configuration from my unrelated portfolio projects.

## 2. Product and business model

SOLE DISTRICT is one curated retailer selling multiple brands. There is one merchant, one catalogue, and one inventory system. Do not introduce marketplace sellers, bidding, seller payouts, crypto, or a full ERP.

Target customers: sneaker and streetwear shoppers, initially in Singapore. Store currency: SGD. Business timezone: Asia/Singapore; persist timestamps in UTC.

The shopping experience should feel premium and complete: discover products, select a purchasable variant, add to bag, pay, receive confirmation, track an order, and request a return.

Authenticity is an operational process. Maintain product/supplier evidence and verification records; software and AI cannot establish physical authenticity. Do not fabricate certificates, reviews, brand authorisation, stock scarcity, supplier evidence, sales counts, or guaranteed delivery claims.

## 3. Technology

- Frontend: React, Vite, JavaScript, responsive CSS or Tailwind. Keep the provided React/Vite starter if present. Do not migrate to TypeScript or Next.js without a concrete requirement.
- Backend: Python, Django, Django REST Framework, Django ORM and migrations.
- Database: PostgreSQL for production. SQLite may support local development, but concurrency-sensitive inventory tests must also run against PostgreSQL before production readiness is claimed.
- Payments: Stripe-hosted Checkout, official Stripe Python SDK, and verified webhooks.
- Images: optimised local assets during development; storage/CDN abstraction for production.
- Use a maintained icon library and bundled/open-licensed fonts. No emoji icons, hand-drawn substitute product images, or giant UI screenshots as the actual website.
- Use environment variables, pinned dependency lock files, same-origin API routing, and secure deployment defaults.
- Prepare the frontend for Vercel. Verify the selected Django hosting runtime and PostgreSQL persistence rather than assuming a static frontend deployment also hosts the backend. A separate persistent Django service is acceptable. Do not require Docker just to run locally.
- A modular Django application is sufficient. Do not add microservices, Redis, Celery, or elaborate infrastructure unless the implemented feature needs them.

## 4. Visual targets

Use my SOLE DISTRICT storefront and sneaker-detail prototypes as the visual source of truth. The admin analytics prototype is future context only. If image files are attached, inspect them directly before implementing.

Design language:
- Warm off-white #F6F5F1, ink black #161616, restrained acid-yellow #D8FF36 accents.
- Condensed bold display typography for the SOLE DISTRICT wordmark and editorial heading; clean readable sans-serif body copy.
- Generous spacing, thin dividers, restrained corners, excellent product photography, clear hierarchy.
- Reference homepage: announcement strip, logo/navigation, editorial streetwear hero, headline “THE NEXT STREET STANDARD.”, “Shop new arrivals” CTA, and four-product “Fresh rotation” row.
- Reference product screen: large image/gallery, brand and model, colour, SGD price, size selector with unavailable states, size guide, stock availability, Add to Bag, wishlist, and delivery/returns/details accordions.
- Preserve the design on desktop and adapt intelligently to mobile. No horizontal overflow, hidden checkout controls, or unreadable small text.

Use supplied image assets for the preview. Generated images are illustrative and must be replaced by accurate, authorised product photography before real inventory is sold. If references are unavailable, identify that gap clearly; do not claim pixel fidelity without inspecting them.

## 5. Customer pages and behaviour

Implement these routes or equivalent clean URLs:

1. Home: editorial hero, new arrivals, featured categories/brands, everyday clothing edit.
2. Shop: catalogue, search, brand/category/size/colour/price/availability filters, sorting, pagination where appropriate, empty/loading/error states. Persist filters in the URL.
3. Brand directory and brand collections.
4. Product detail: useful image gallery and zoom, descriptions, materials/care, colour/size variants, brand-specific sizing, clear availability, wishlist and Add to Bag.
5. Wishlist with persistence and useful empty state.
6. Bag drawer and cart: selected variant, quantity controls, removal, validated discounts if implemented, subtotal, delivery estimate and total. Revalidate stock and pricing on the server.
7. Checkout review: items, shipping/tax explanation, payment options, secure Stripe handoff.
8. Payment return: confirmed, processing, failed, expired and cancelled states. Never equate a redirect with successful payment.
9. Customer accounts: register, sign in/out, verified email/password reset, addresses, order history and order detail. Also permit guest checkout with secure order access.
10. Order tracking and return-request form. A return request records a case; it must not automatically approve a refund.
11. Journal/editorial page plus clear delivery, returns, privacy, contact and store-information pages.
12. A useful 404 page.

Every visible core control must work. Do not invent a support address or claim email delivery without a configured provider. Draft store policies must remain clearly draft until the owner approves them.

All product, variant, quantity, discount and order calculations must come from authoritative backend data. Local storage can persist shopping preferences; it cannot authorise payment or determine stock availability.

## 6. Catalogue and data model

Model Brand, Category, Product, ProductImage, ProductVariant, InventoryMovement, Cart/CartItem as needed, Customer/Address, Order/OrderItem, PaymentRecord, Shipment, ReturnRequest, and webhook processing records.

Each purchasable size/colour combination needs a unique SKU, price in integer minor units, available inventory, publication/sellable state, and optional cost price for later profit reporting. Record size-system mappings per brand/product; do not present a universal conversion table as exact for every brand.

Orders must snapshot item names, SKU/variant, quantity, unit price, discounts, delivery and tax. Keep separate payment, fulfilment and return/refund states. Later catalogue edits must not rewrite historical orders.

Use decimal/integer money arithmetic, database constraints, server validation, and atomic reservation logic. Two customers must not buy the same last unit. Do not trust a client-supplied amount, customer ID, order status, or stock number.

Seed a useful illustrative catalogue, clearly separated from live sellable inventory. Sample prices and stocks must never silently become real purchasable stock. Support Nike/Jordan, adidas, New Balance, ASICS, Carhartt WIP and other selected labels only where product records/images are supplied or explicitly marked illustrative. Prioritise accurate products over a large fake catalogue.

Use Django's built-in admin only for initial catalogue/operational configuration. Do not build the custom Shopify-like merchant interface yet.

## 7. Real payments: Stripe, PayNow, Apple Pay and Google Pay

My desired methods are cards, PayNow, Apple Pay and Google Pay. My bank is DBS.

Use Stripe-hosted Checkout for this release. It supports wallet rendering where the merchant configuration, browser/device and customer wallet qualify. Verify the current official Stripe documentation during implementation.

Important PayNow distinction:
- Stripe PayNow uses Stripe-generated QR codes, payment confirmation and merchant payouts. Configure the eligible Singapore Stripe account, SGD charges and its linked DBS payout bank account.
- Do not substitute my personal DBS PayNow QR/mobile number and pretend Stripe can confirm that direct bank transfer.
- A direct-to-DBS PayNow flow would be a separate method requiring a genuine banking/payment confirmation integration, or explicitly manual reconciliation. Leave that separate mode unimplemented unless I specifically request it.

Backend requirements:
- Create Checkout Sessions on the server using current database prices, validated variants, quantities, delivery, tax and discount rules.
- Collect required delivery/contact information through the chosen secure flow. Initially ship to supported Singapore addresses only.
- Enable/configure relevant payment methods in Stripe; Apple Pay/Google Pay are wallets, not invented payment_method_types strings.
- Use an idempotency key tied to the shopper and checkout attempt. Rapid repeat submissions or retries must not create duplicate orders/reservations.
- Reserve stock atomically, handle expiration/cancellation/failure, and release reservations safely. Delayed PayNow payment confirmation must not cause premature fulfilment or release.
- Verify webhook signatures using the unmodified raw request body.
- Process completed/async-success/async-failure/expired events appropriately. Confirm actual paid status, currency, expected amount, merchant mode and order association.
- Make webhook processing durable, idempotent and tolerant of duplicated/out-of-order events. Record fulfilment only once. Reconcile missed events through a documented recovery mechanism.
- Keep reservation/order state consistent across Stripe/network failures. Retry an uncertain checkout attempt with the same idempotency key rather than assuming no session was created.
- The success page reads an authorised backend order status and can poll a pending payment. It must not mark orders paid or clear unrelated cart items.
- Distinguish test and live modes explicitly. Never claim live payment success using mocked responses.
- Never store raw card details, secret keys, webhook secrets, bank credentials or private customer information in frontend bundles/logs/source control.

Expected server environment variables include DJANGO_SECRET_KEY, DEBUG, ALLOWED_HOSTS, DATABASE_URL, FRONTEND_ORIGIN, CSRF_TRUSTED_ORIGINS, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_AUTOMATIC_TAX_ENABLED if used, and LIVE_COMMERCE_ENABLED. Add other variables only when necessary. Hosted Checkout need not expose a publishable key if the client only redirects to a server-created URL.

Without credentials, complete the site and integration code, leave payment activation safely unavailable, and provide precise configuration instructions. Never put a fake QR or pretend payment button in place of a real integration. Do not ask me to paste secret keys or DBS banking credentials into chat; use a secure environment/configuration flow.

## 8. Security and reliability

- Prefer secure HttpOnly session cookies and CSRF protection for same-origin customer sessions. Use strict allowed origins, HTTPS in production, correct proxy settings, and no broad wildcard CORS.
- Rate-limit authentication, password resets, checkout/session creation, contact and return submissions.
- Enforce order/customer ownership on every API. Guest order access must use a high-entropy, scoped and expiring mechanism; never expose orders by sequential ID or email alone.
- Validate image/document uploads and keep verification evidence/private documents access-controlled.
- Configure appropriate security headers, production error handling and secret redaction.
- Validate cart quantities, malformed JSON, unavailable variants, stale prices and duplicate items. Limit cart size and prevent reservation abuse.
- Review dependencies for known issues and fix relevant findings. Do not weaken protections just to make a preview run.

## 9. Analytics foundation for the later admin release

Persist trustworthy order, payment, refund, inventory and product-cost records now. Plan event names such as product_viewed, search_performed, cart_added, checkout_started and purchase_confirmed.

Browser interaction events and server-confirmed purchases have different trust levels. Do not calculate revenue from browser events. Add consent-aware tracking only if actually implemented; exclude test/staff/bot traffic, deduplicate events, define session windows and attribution rules, and document limitations.

Later reports will include sales, average order value, conversion funnel, product/brand/size performance, inventory ageing, returns, retention and campaign attribution. Do not build fake analytics charts or the merchant dashboard in this client-first release.

## 10. Verification and acceptance

Test meaningful behaviour, not merely whether components render:
- Search/filter/sort combinations, variant selection, unavailable sizes, cart quantity limits, wishlist/cart persistence and mobile navigation.
- Server-held prices despite client price tampering; invalid quantity/SKU rejection; out-of-stock handling; simultaneous attempts at the last unit using PostgreSQL.
- CSRF, session isolation, order ownership, guest access expiry, login/reset rate limits and private upload access.
- Card and PayNow test-mode flows where credentials permit, successful/failed/cancelled/expired/pending payments, double submission and duplicate/out-of-order webhooks.
- Payment return never fakes success. A failed or missing webhook must have a recoverable processing state.
- Wallet rendering on eligible real environments when available. Distinguish tested support from documented compatibility.
- Desktop/tablet/mobile at approximately 1440px, 768px and 390px widths, keyboard navigation, focus management, modal behaviour, readable contrast, alt text and reduced motion.
- Open the site in a browser, compare screenshots to the supplied prototypes, exercise the actual shopping flow and check console/network errors. Build success is not browser verification.
- Optimise image sizes, lazy-load below-the-fold imagery, prioritise the hero and avoid unnecessary JavaScript.

If a test requires unavailable credentials, a device, PostgreSQL or a deployment, record it as blocked with the exact reason. Do not label it passed.

## 11. Delivery workflow

Implement in this order:
1. Inspect existing code/assets, establish architecture and working local startup.
2. Finish the responsive visual storefront and customer browsing flow.
3. Build authoritative Django catalogue/inventory/order APIs and guest/customer access.
4. Implement real Stripe checkout and webhook lifecycle.
5. Complete customer account/order/return flows and policy states.
6. Run frontend/backend/security/browser checks, fix material failures, document remaining activation requirements and package the project.

Keep changes inside each phase scope. After each phase, update PLAN.md and commit locally if this is a git repository. Do not push publicly or deploy until requested. Do not overwrite unrelated work.

Final delivery:
- The actual runnable project, including source, supplied/generated assets, migrations, dependency locks, env examples, tests and README.
- Exact local setup commands and a prepared deployment guide.
- Payment activation guide for Singapore Stripe, PayNow, wallets, webhook registration and DBS payout configuration.
- Test results with honest blocked items, browser screenshots, and a short visual QA report.
- A concise explanation of what is complete, what is not live yet, and the exact remaining configuration.

Begin by inspecting the repository. Then implement Phase 1 and continue until the client site and its necessary backend are complete. Do not stop at a proposal.
