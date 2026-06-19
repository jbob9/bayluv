# ☕ bayluv

**Fund your creative work.** bayluv is a creator monetization + link-in-bio platform —
think [Buy Me a Coffee](https://buymeacoffee.com), [Ko-fi](https://ko-fi.com), and
[Beacons.ai](https://beacons.ai) rolled into one. Each creator gets a beautiful public page where
fans can leave **one-time tips**, subscribe to **membership tiers**, and buy **digital products** —
with money flowing directly to the creator via **Stripe Connect**, minus a small platform fee.

```
bayluv.com/yourname  →  tips · memberships · shop · links — all in one place
```

---

## ✨ Features

| Area | What you get |
|---|---|
| **Link-in-bio page** | Public profile at `/:username` with cover, avatar, bio, social icons, reorderable link blocks, goal bar, and a supporter feed. |
| **One-time tips** | "Buy me a coffee" — pick a quantity/amount, leave a message, optionally make it monthly. |
| **Memberships** | Recurring monthly/yearly tiers with benefits, member-only perks, and a self-serve billing portal. |
| **Shop** | Sell digital downloads, 1-1 calls, and commissions with one-tap checkout and a post-purchase access page. |
| **Creator dashboard** | Edit your page live, manage tiers & products, see supporters & earnings, and connect payouts. |
| **Auth** | Email + password, Google/GitHub social login, and passwordless magic-link / email-OTP. |
| **Payments** | Stripe Connect (Express) — creators are paid directly; the platform takes a configurable fee. |

---

## 🧱 Tech stack

- **[React Router v8](https://reactrouter.com)** (framework mode, SSR) + **React 19**
- **[Tailwind CSS v4](https://tailwindcss.com)** with a custom token-based design system
- **[Drizzle ORM](https://orm.drizzle.team)** on **libSQL / [Turso](https://turso.tech)** (SQLite)
- **[better-auth](https://better-auth.com)** for sessions, social, magic-link & OTP
- **[Stripe](https://stripe.com) Connect** for payments + payouts
- **[Resend](https://resend.com)** for transactional email · **Cloudflare R2** (S3-compatible) for uploads
- **[lucide-react](https://lucide.dev)** icons · **zod** validation

> **Documentation**
> - [`docs/design-system.md`](docs/design-system.md) — the "playful & warm" design language: tokens, fonts, components.
> - [`docs/architecture.md`](docs/architecture.md) — how it all works: request flow, auth, the data model, and the Stripe payment lifecycle.

---

## 🚀 Getting started

### 1. Install

```bash
npm install
```

### 2. Configure environment

Copy the example values into `.env` (one is already scaffolded in the repo). Only the **core**
block is required to boot — Stripe, email, and storage are optional and degrade gracefully in dev.

```bash
# --- Core (required) ---
NODE_ENV="development"
DATABASE_URL="file:./local.db"        # local SQLite; use a Turso URL in prod
BETTER_AUTH_SECRET="change-me"        # openssl rand -hex 16
BETTER_AUTH_URL="http://localhost:5173"
PLATFORM_FEE_PERCENT="5"

# --- Optional integrations (uncomment + fill to enable) ---
# GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
# GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET
# STRIPE_SECRET_KEY / STRIPE_PUBLISHABLE_KEY / STRIPE_WEBHOOK_SECRET
# RESEND_API_KEY / EMAIL_FROM
# R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET / R2_PUBLIC_URL
```

Env vars are validated at boot by [`app/lib/env.server.ts`](app/lib/env.server.ts) — a missing
required value fails fast with a clear message.

### 3. Set up the database

```bash
npx drizzle-kit generate   # generate SQL from the Drizzle schema
npx drizzle-kit migrate    # apply migrations (creates ./local.db)
```

### 4. Run

```bash
npm run dev
```

Open **http://localhost:5173**. Sign up, claim a username, and you're on your dashboard.

> 💡 Browse the whole component library at **`/dev/styleguide`**.

---

## 📜 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server with HMR (port 5173) |
| `npm run build` | Production build (client + SSR server) |
| `npm start` | Serve the production build |
| `npm run typecheck` | Generate route types + run `tsc` |
| `npx drizzle-kit generate` | Generate a migration from schema changes |
| `npx drizzle-kit migrate` | Apply pending migrations |

---

## 🗂️ Project structure

```
app/
├── root.tsx                 # HTML shell, fonts, ToastProvider, error boundary
├── routes.ts                # Central route config
├── app.css                  # Design tokens (@theme) + base layer
├── components/
│   ├── ui/                  # Primitives: Button, Card, Input, Dialog, Tabs, Toast…
│   ├── brand/               # Logo / wordmark
│   ├── auth/                # Auth split-screen layout, social buttons
│   ├── dashboard/           # PageHeader, empty states
│   └── profile/             # Public-page pieces: support widget, tier/product cards, socials
├── lib/
│   ├── env.server.ts        # zod-validated environment
│   ├── auth.server.ts       # better-auth config (server-only)
│   ├── auth-client.ts       # better-auth browser client
│   ├── session.server.ts    # requireUser / requireProfile guards
│   ├── stripe.server.ts     # Stripe client + Connect/checkout helpers
│   ├── email.server.ts      # Resend sender (console-stubbed in dev)
│   ├── profile.server.ts    # profile queries
│   ├── theme.ts             # accent color tokens for public pages
│   └── utils.ts             # cn(), formatMoney(), slugify()
├── db/
│   ├── index.server.ts      # Drizzle client
│   ├── schemas/             # auth, profile, payments, membership, shop
│   └── migrations/          # generated SQL
└── routes/
    ├── home.tsx             # marketing landing
    ├── login / signup / logout / onboarding
    ├── $username.tsx        # public creator page
    ├── l.$linkId.tsx        # link click tracker → redirect
    ├── d.$orderId.tsx       # post-purchase download/access page
    ├── account.tsx          # supporter membership management
    ├── dashboard/           # layout + overview, page, tiers, products, supporters, payouts, settings
    └── api.*                # auth handler, checkout (tip/subscription/product), Stripe webhook
```

See [`docs/architecture.md`](docs/architecture.md) for the full data model and request lifecycle.

---

## 💳 How payments work (in one paragraph)

Creators connect a **Stripe Express** account on the Payouts page. When a fan pays, bayluv creates a
Stripe **Checkout Session** as a *destination charge*: the funds settle to the creator's connected
account and bayluv takes an `application_fee` (default 5%). A signed **webhook** confirms the payment
and records it (tip, membership, or order). Subscriptions and orders are reconciled the same way, and
supporters manage their memberships through Stripe's billing portal. Full detail — including every
event handled and the fee math — is in [`docs/architecture.md`](docs/architecture.md).

---

## 🚢 Deployment

Production uses a **Turso** database (set `DATABASE_URL` + `DATABASE_AUTH_TOKEN`) and live Stripe keys.
Set `BETTER_AUTH_URL` to your public origin and register the webhook endpoint
`https://yourdomain.com/api/webhooks/stripe` in the Stripe dashboard.

### Docker

```bash
docker build -t bayluv .
docker run -p 3000:3000 --env-file .env bayluv
```

The image runs the built-in Node server (`react-router-serve`). Deploy the `build/` output to any
Node host — Fly.io, Railway, Render, Cloud Run, etc.

---

## 🛣️ Status

Phases 0–5 are built (foundation, auth, public page + editor, tips, memberships, shop); typecheck and
production build are clean. Live Stripe flows are wired and ready — add test keys to exercise them.
Email (Resend) and file uploads (R2) are stubbed in dev (console-logged links / URL inputs) until keys
are added.

---

Made with ☕ for creators.
