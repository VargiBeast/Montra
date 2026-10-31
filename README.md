# Montra — Complete Rebuild

**Branch:** `feature/complete-montra-rebuild`

Zero-based reconstruction of Montra with a completely new UI inspired by premium emerald/lime finance design references.

## Product

Track your money. Understand your money. Plan your money.

## Stack

- React 19 + TypeScript + Vite
- Supabase (Auth, Postgres, Storage, Edge Functions)
- Lucide React
- Tesseract.js (local OCR)
- Stripe (via existing Edge Functions)

## Quick start

```bash
npm install
cp .env.example .env   # set VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Typecheck + production build |
| `npm run typecheck` | TypeScript only |
| `npm test` | Run tests |

## Architecture

See `docs/ARCHITECTURE.md` (to be expanded).

## Safety

- This branch is isolated from production.
- Main and montra.cash remain untouched.
- No service-role keys, no production schema changes.
