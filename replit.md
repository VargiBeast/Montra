# Saldo on Replit

## Run

- The Replit web workflow runs `npm run dev` on port 5000.
- Build a production bundle with `npm run build`.
- Regenerate the branded PWA PNG icons with `npm run generate:icons`.

## Supabase

The client reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from the app environment. The existing Supabase project, `public.transactions` table, `purchase-images` private bucket, and their access policies are the source of truth. Do not reset or replace the database or change its schema or RLS policies as part of routine app work.

Google sign-in and email links redirect back to the current app origin. That origin must be present in the Supabase Auth redirect URL allow list. Apple sign-in uses the same provider flow and requires Apple to be enabled in Supabase before it can complete.