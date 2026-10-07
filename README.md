# Montra

Montra is a modern personal finance and purchase log for tracking income, expenses, receipts, and wishlists. It combines a clean, privacy-conscious web experience with secure cloud sync via Supabase.

All user data is isolated per account. Images are stored privately and cleaned up automatically when records are deleted or replaced.

**Status:** Private / proprietary product. Not open source.

**Live site:** [https://montra.cash](https://montra.cash)

---

## Features

- **Transaction tracking** — Record income and expenses with amount, date, payment method, notes, and optional product links.
- **Image attachments** — Attach photos to purchases; private signed URLs and automatic Storage cleanup on delete or replace.
- **Receipts** — Capture and store receipt images with optional merchant, total, currency, and date (OCR-assisted where available).
- **Wishlist** — Save desired items with price, currency, link, details, images, and optional savings-goal linkage. Shareable lists supported.
- **Savings goals** — Track progress toward financial targets.
- **Analytics & insights** — Spending overview and personalization helpers.
- **Multi-language support** — Interface language preference stored locally (English default).
- **Multi-currency display** — Preferred currency for amounts and wishlist items.
- **Authentication** — Google OAuth, email/password, and one-time code / magic-link flows (PKCE).
- **Montra Plus** — Subscription architecture prepared (Stripe Checkout + entitlements). Payments are not activated as live production billing in the current client.
- **PWA-ready** — Service worker, manifest, and icons for installable experience.
- **Responsive design** — Works across desktop and mobile browsers.

---

## Tech Stack

| Layer              | Technology                                      |
|--------------------|-------------------------------------------------|
| Frontend           | React 19, TypeScript, Vite                      |
| Routing            | React Router                                    |
| UI icons           | Lucide React                                    |
| Backend / Auth     | Supabase (Auth, Postgres, Storage)              |
| OCR (client)       | Tesseract.js                                    |
| Payments (prep)    | Stripe Checkout via Supabase Edge Function      |
| Deployment         | Vercel                                          |
| Analytics          | Optional GTM / analytics helpers                |

---

## Architecture

```
Browser (React SPA)
    │
    ├─ Auth (Supabase Auth, PKCE)
    ├─ Data services (transactions, receipts, wishlist, savings goals)
    ├─ Signed image URLs (Storage)
    └─ Plus entitlement check
         │
         ▼
Supabase
    ├─ Postgres (RLS-protected tables)
    ├─ Storage (user-scoped buckets)
    └─ Edge Functions (e.g. create-stripe-checkout)
```

- Client never holds service-role or secret keys.
- All data access is scoped by authenticated `user_id`.
- Images live under `{userId}/…` paths; the client validates paths before any Storage operation.

---

## Project Structure

```
├── public/                 # Static assets, icons, manifest, service worker
├── src/
│   ├── components/         # UI components (forms, details, dialogs, etc.)
│   ├── hooks/              # React hooks (auth, transactions, receipts, wishlist, Plus)
│   ├── lib/                # Shared utilities (supabase client, i18n, currency, SEO, etc.)
│   ├── pages/              # Route-level pages
│   ├── services/           # Supabase data & Storage access layer
│   ├── styles/             # Global styles
│   ├── types/              # TypeScript types
│   ├── App.tsx / AppRoutes.tsx / main.tsx
├── supabase/
│   ├── functions/          # Edge Functions (Stripe Checkout, etc.)
│   └── migrations/         # SQL migrations (savings goals, Plus entitlements)
├── scripts/                # Build/serve helpers and icon generation
├── tests/                  # Node test suite
├── vercel.json             # SPA rewrites and security headers
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## Authentication

Supported methods:

- Google OAuth (Supabase provider)
- Email + password (`signInWithPassword` / `signUp`)
- One-time code / magic link (`signInWithOtp` + `verifyOtp`)

Session handling uses PKCE with automatic refresh and URL detection. Language preference is stored in `localStorage`.

Apple Sign-In has been removed from the UI. Confirm email settings and redirect URLs in the Supabase Dashboard for production (see `AUTH_SETUP.md`).

---

## Supabase / Database

Tables used by the application (non-exhaustive; exact schema lives in the Supabase project):

- `transactions` — income/expense records + optional image path
- `receipts` — receipt metadata + image path
- `wishlists` — wishlist items + image path
- Savings goals table(s)
- `plus_entitlements` (and related Stripe sync tables)

All queries and mutations filter by `user_id`. The client assumes Row Level Security (RLS) is enabled and correctly configured so that users can only read/write their own rows.

Migrations in the repository cover savings goals and Plus entitlements sync. Core table definitions and RLS policies are maintained in the Supabase project.

---

## Security Model

- **Keys** — Only the publishable Supabase key (`VITE_SUPABASE_PUBLISHABLE_KEY`) and project URL are used in the browser. Service-role / secret keys must never appear in frontend code or client environment variables.
- **User isolation** — Every list/insert/update/delete operation includes an explicit `user_id` filter. Image paths are validated to start with the current user’s ID and reject path traversal.
- **Storage** — Private buckets; access via short-lived signed URLs (typically 1 hour).
- **Headers** — Vercel configuration sets `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and Cross-Origin-Opener-Policy.
- **Auth** — PKCE flow; session persistence and auto-refresh handled by the Supabase client.

Confirm RLS policies and Storage policies in the Supabase Dashboard match the path and `user_id` assumptions used by the application.

---

## Storage

| Bucket            | Purpose                          | Path pattern          |
|-------------------|----------------------------------|-----------------------|
| `purchase-images` | Transaction / purchase photos    | `{userId}/{uuid}.ext` |
| `receipts`        | Receipt images                   | `{userId}/{uuid}.ext` |
| `wishlist`        | Wishlist item images             | `{userId}/{uuid}.ext` |

**Cleanup behavior**

- On **delete** of a transaction, receipt, or wishlist item → corresponding Storage object is removed.
- On **replace** of an image → old object is removed after successful upload and DB update.
- On **upload failure** after a new object was written → the orphaned object is cleaned up.

The client never trusts a path that does not belong to the authenticated user.

---

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type-check + production build
npm run build

# Run tests
npm test

# Preview production build locally
npm run preview
# or
npm start
```

Development server defaults are defined in `vite.config.ts` and the `dev` script.

---

## Environment Variables

Names only (never commit real values):

| Variable                        | Description                              |
|---------------------------------|------------------------------------------|
| `VITE_SUPABASE_URL`             | Supabase project URL                     |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key          |

Optional analytics / GTM variables may be referenced by the analytics helpers; keep them out of source control.

Create a local `.env` (gitignored) for development. On Vercel, set the same names in the project environment settings.

---

## Testing

```bash
npm test
```

Runs the Node test suite (`tests/*.test.mjs`) with TypeScript stripping.

```bash
npm run build
```

Performs a full TypeScript check (`tsc --noEmit`) followed by the Vite production build.

---

## Production / Vercel

- Deployed as a single-page application on Vercel.
- `vercel.json` provides:
  - SPA fallback rewrite to `/index.html` (excluding robots.txt and sitemap.xml)
  - Security headers
  - Correct caching for the service worker
- Domain: **montra.cash**
- Environment variables must be configured in the Vercel project for production and preview deployments.

Do not change the production domain or Cloudflare DNS/SSL settings from application code.

---

## Montra Plus / Stripe Status

Montra Plus subscription infrastructure is prepared:

- Supabase Edge Function `create-stripe-checkout` creates hosted Stripe Checkout sessions (subscription mode, trial, tax, promotion codes, etc.).
- Customer mapping and `plus_entitlements` table exist.
- Frontend entitlement hook and portal helpers are present.
- Feature gating is driven by entitlement status, not hard-coded user lists.

**Current status:** Stripe Checkout and entitlement plumbing exist, but real production payments and live billing are **not** presented as fully activated in the client. Dashboard setup (Stripe Tax, public Terms of Service URL, function deployment, and end-to-end smoke tests) remains a manual operational step. See `STRIPE_INTEGRATION_TODO.md` for the precise remaining checklist.

---

## Roadmap

Realistic next steps (not commitments):

- Complete Stripe Dashboard configuration and live Checkout verification.
- Confirm and document exact RLS + Storage policies in repository migrations if desired.
- Optional client-side image compression before upload (size vs. quality trade-off).
- Further test coverage for critical flows.
- Continued polish of insights, onboarding, and Plus feature surface.

---

## License & Project Status

Montra is a **private, proprietary** product.  
It is not open source. All rights reserved.

Do not distribute, fork, or republish the source without explicit authorization from the owner.
