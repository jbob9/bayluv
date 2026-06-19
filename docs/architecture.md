# 🏗️ bayluv Architecture — How it works

This document explains how bayluv is put together: the request lifecycle, authentication, the data
model, routing, and the Stripe payment flows end to end.

---

## High-level overview

bayluv is a **server-rendered React Router v8** app. Routes are full-stack modules: each can export a
`loader` (server read), an `action` (server write/mutation), and a default component. There is no
separate API layer for most things — the same route that renders a page also handles its form
submissions. A handful of dedicated `api.*` routes exist for cross-cutting concerns (the auth
handler, checkout session creation, and the Stripe webhook).

```
Browser ──HTTP──> React Router (SSR)
                    ├── loader  ─┐
                    ├── action  ─┤── Drizzle ORM ──> libSQL / Turso (SQLite)
                    └── component│
                                 └── better-auth, Stripe SDK, Resend
```

Three external services, all optional in dev:
- **Stripe Connect** — payments + payouts (creators onboard Express accounts).
- **Resend** — transactional email (magic links, OTP). Falls back to console logging.
- **Cloudflare R2** — file/image storage. Falls back to URL inputs.

Configuration is centralized and validated in [`app/lib/env.server.ts`](../app/lib/env.server.ts);
`hasStripe` / `hasResend` / `hasR2` flags let the app degrade gracefully when a service isn't wired.

---

## Request lifecycle

1. A request hits the SSR server. React Router matches the URL against [`app/routes.ts`](../app/routes.ts).
2. **Loaders** run (parent → child) to fetch data. Guards like `requireUser` / `requireProfile`
   ([`app/lib/session.server.ts`](../app/lib/session.server.ts)) throw `redirect()` here to bounce
   unauthenticated or un-onboarded users.
3. The matched components render to HTML with their `loaderData`.
4. On the client, forms submit to **actions** (or `useFetcher`), which mutate via Drizzle and return
   data or a redirect; loaders then revalidate automatically.

`*.server.ts` files (and `.server` route helpers) are server-only — they never reach the client
bundle, keeping DB credentials and the Stripe secret key out of the browser.

---

## Authentication

Powered by **better-auth** ([`app/lib/auth.server.ts`](../app/lib/auth.server.ts)):

- **Email + password** (always on).
- **Social** — Google & GitHub, registered only when their env keys are present.
- **Magic link & email OTP** — passwordless, via plugins; the email is sent through
  [`app/lib/email.server.ts`](../app/lib/email.server.ts) (console-stubbed without a Resend key).

All `/api/auth/*` requests are handled by [`app/routes/api.auth.$.tsx`](../app/routes/api.auth.$.tsx),
which delegates to `auth.handler(request)`. Sessions are cookie-based and stored in the `session`
table via the Drizzle adapter. The browser uses [`app/lib/auth-client.ts`](../app/lib/auth-client.ts)
for sign-in/up/out.

**Guards** (server helpers):
- `getOptionalUser(request)` — user or `null`.
- `requireUser(request)` — redirects to `/login?redirect=…` if signed out.
- `requireProfile(request)` — also redirects to `/onboarding` if the user hasn't claimed a username.

### Onboarding

New users land on `/onboarding` to claim a unique **username** (their page slug) and display name.
Usernames are slugified, validated, checked for uniqueness, and screened against a reserved list (so
they can't shadow routes like `/login` or `/dashboard`). This creates their `profile` row.

---

## Data model

Schemas live in [`app/db/schemas/`](../app/db/schemas/) and are re-exported from `index.server.ts`.
SQLite via Drizzle; timestamps are stored as epoch-ms integers; ids are UUIDs.

| Table | Purpose | Key relations |
|---|---|---|
| `user`, `session`, `account`, `verification` | better-auth identity | — |
| `profile` | The creator page (username, bio, theme, goal, supporterCount, isPublished) | 1-1 `user` |
| `social_link` | Social icons on the page | → `profile` |
| `link` | Link-in-bio blocks (`link` / `header` / `affiliate`), with click counts | → `profile` |
| `payment_account` | Stripe Connect account + capability flags | 1-1 `user` |
| `support` | One-time (and monthly) tips; guest-allowed | → `profile`, `user?` |
| `tier` | Membership tier (price, interval, benefits, Stripe product/price ids) | → `profile` |
| `membership` | A supporter's subscription to a tier | → `profile`, `tier`, `user` |
| `product` | Shop item (`digital` / `call` / `commission`) | → `profile` |
| `order` | A product purchase, with an `accessToken` for delivery | → `product`, `profile`, `user?` |

**Cached counters** (`profile.supporterCount`, `tier.memberCount`, `product.salesCount`) are bumped
by webhooks so public pages render fast without aggregate queries.

---

## Routing map

| Path | What |
|---|---|
| `/` | Marketing landing |
| `/login`, `/signup`, `/logout` | Auth |
| `/onboarding` | Claim username (creates profile) |
| `/:username` | **Public creator page** — About / Membership / Shop tabs + support widget |
| `/l/:linkId` | Link click tracker (increments, then redirects) |
| `/d/:orderId?token=…` | Post-purchase download / access page |
| `/account` | Supporter membership management (billing portal) |
| `/dashboard/*` | Creator dashboard: overview, page editor, tiers, products, supporters, payouts, settings |
| `/api/auth/*` | better-auth handler |
| `/api/checkout/{tip,subscription,product}` | Create Stripe Checkout Sessions |
| `/api/webhooks/stripe` | Stripe event handler |

> The dynamic `/:username` route is registered **last** so static routes (`/login`, `/dashboard`, …)
> always win the match.

---

## Payments (Stripe Connect)

bayluv is a marketplace: creators get paid directly, the platform skims a fee. Helpers live in
[`app/lib/stripe.server.ts`](../app/lib/stripe.server.ts); the fee is
`PLATFORM_FEE_PERCENT` (default 5%) via `platformFeeCents()`.

### Onboarding payouts

On `/dashboard/payouts`, "Connect with Stripe" creates a **Stripe Express** connected account and
redirects the creator through a Stripe-hosted onboarding flow (Account Link). On return, capability
flags (`chargesEnabled`, `payoutsEnabled`, `detailsSubmitted`) are synced into `payment_account`.
Selling is gated on `chargesEnabled`.

### One-time tips (`/api/checkout/tip`)

1. A pending `support` row is created.
2. A Stripe **Checkout Session** is created as a *destination charge*:
   `payment_intent_data.transfer_data.destination` = the creator's account, and
   `application_fee_amount` = the platform fee. (Monthly tips use `subscription` mode instead.)
3. The fan completes payment on Stripe; bayluv redirects back to the creator page.

### Memberships (`/api/checkout/subscription`)

Each tier mirrors to a Stripe **Product + Price** (recurring) when created. Joining opens a
`subscription`-mode Checkout Session with `application_fee_percent` + `transfer_data.destination`.
Requires a signed-in supporter (so the subscription can be managed). Supporters cancel/update via the
**billing portal** linked from `/account`.

### Products (`/api/checkout/product`)

A pending `order` is created with a random `accessToken`, then a one-time destination charge. The
success URL points at `/d/:orderId?token=…`, which reveals the download/booking link once paid.

### Webhooks ([`app/routes/api.webhooks.stripe.tsx`](../app/routes/api.webhooks.stripe.tsx))

Every payment is confirmed server-side by a **signature-verified** webhook — never trusted from the
browser redirect alone. Handlers are **idempotent** (they no-op if a row is already `paid`/active):

| Event | Effect |
|---|---|
| `checkout.session.completed` (tip) | Mark `support` paid, set payment intent, `supporterCount++` |
| `checkout.session.completed` (product) | Mark `order` paid, capture buyer email, `salesCount++` |
| `customer.subscription.created`/`updated` | Upsert `membership`, set status + period end; bump counters on first activation |
| `customer.subscription.deleted` | Mark canceled, decrement counters |
| `account.updated` | Sync connected-account capability flags |

The download page also has a **fallback**: if the webhook is delayed, it retrieves the Checkout
Session directly and confirms payment so the buyer is never stuck.

### Local webhook testing

The Stripe CLI isn't required to develop, but to exercise webhooks locally either:

```bash
stripe listen --forward-to localhost:5173/api/webhooks/stripe
```

...or POST a payload signed with `stripe.webhooks.generateTestHeaderString()` using your
`STRIPE_WEBHOOK_SECRET`.

---

## Conventions

- **Server-only code** ends in `.server.ts` or uses `.server` route helpers — never imported into
  client components.
- **Mutations** go through route `action`s (or `useFetcher` for inline ones like the support widget),
  using a hidden `intent` field to multiplex several operations on one route (see the page/tiers/
  products editors).
- **Validation** uses zod at the boundary (env, onboarding, form parsing).
- **Money** is always integer **cents** in the DB; format for display with `formatMoney()`.
- **Ownership checks**: every mutation re-verifies the target row belongs to the current creator
  before writing.
