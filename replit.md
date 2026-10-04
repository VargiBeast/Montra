# Montra on Replit

## Run

- The Replit web workflow runs `npm run dev` on port 5000.
- Build a production bundle with `npm run build`.
- Replit Autoscale runs the built app with `npm run start`; its static server binds to `0.0.0.0` and uses the assigned `PORT`.
- `npm run preview` is for local inspection of the production bundle.
- Regenerate the branded PWA PNG icons with `npm run generate:icons`.

## Branding and language

- Use the supplied Montra assets in `montra-images/`; `public/branding/` and `public/icons/` contain the files served by the app.
- The existing `saldo.*` browser-storage keys and old `"Saldo"` backup marker remain for data compatibility. New backups identify as Montra, and imports accept both formats.
- The language preference keeps its existing storage key, detects the browser locale for first-time users, accepts BCP 47 locale codes, and falls back to English copy when a translation is unavailable.
- Transaction amounts remain in NOK because the existing transaction records do not store a per-transaction currency. Do not relabel or convert them until that data can be represented safely.

## Supabase

The client reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from the app environment. The existing Supabase project, `public.transactions` table, `purchase-images` private bucket, and their access policies are the source of truth. Do not reset or replace the database or change its schema or RLS policies as part of routine app work.

Google sign-in, password confirmation links, and email one-time codes redirect back to the current app origin (`window.location.origin`). That origin must be present in the Supabase Auth redirect URL allow list. Apple sign-in has been removed from the login UI.