# Login changes

Apple sign-in is removed from the UI. Google still uses the existing Supabase OAuth client and redirects to `window.location.origin` (not a hardcoded localhost).

Password sign-in uses `supabase.auth.signInWithPassword`. New accounts use `supabase.auth.signUp` with the same dynamic redirect. One-time code uses the existing `signInWithOtp` flow, then `verifyOtp` if the email contains a code. Magic links still complete through the existing PKCE session detection.

Language choice is stored in `localStorage` under `saldo.language`. English is the default.

## SUPABASE DASHBOARD TODO

1. Authentication → Providers: keep Google enabled. Apple can stay disabled; the app no longer offers it.
2. Authentication → Providers → Email: enable Email provider.
3. If you want password accounts to work immediately, either disable “Confirm email” or keep it on and use the confirmation link (the app tells the user to check email).
4. Authentication → Email Templates: the Magic Link / OTP template should include both `{{ .ConfirmationURL }}` and `{{ .Token }}` so the one-time code screen and the sign-in link both work.
5. Authentication → URL Configuration: add the live Replit origin (the exact site origin, no path required) to Redirect URLs. Do not rely on localhost for production. Site URL can be the same production origin.
6. No new tables, RLS changes, or API keys are required.
