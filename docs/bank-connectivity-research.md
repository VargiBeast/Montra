# Bank connectivity research (Montra Life)

**Status:** Research only — **not implemented**. No provider accounts, secrets, or production changes.

## Goal
Automatic transaction import for Norwegian users, without storing bank passwords in Montra.

## Providers considered

### Tink (Visa)
- **Coverage NO:** Active Norwegian provider status page lists many banks (Sparebank network, Bank Norwegian, etc.).
- **Capabilities:** AIS (accounts/transactions), enrichment, optional PIS.
- **Regulation:** Licensed under Swedish FSA; PSD2 TPP onboarding for production AIS.
- **Pricing:** Quote / enterprise (not public self-serve production pricing).
- **Docs:** https://docs.tink.com · NO status: https://tinknorway.statuspage.io/

### Enable Banking
- **Coverage:** ~41 countries; AIS + PIS; more self-serve onboarding.
- **Pricing:** Volume-based with monthly minimums — sales quote.
- **HQ:** Finland (FIN-FSA).

## Architecture constraints
1. Never collect online-banking passwords in Montra.
2. OAuth/consent via provider Link UI; tokens server-side only.
3. RLS scoped to `auth.uid()`; no service-role in the browser.
4. Sync with dedupe against existing rows.
5. Manual entry remains first-class; do not present incomplete feeds as full net worth.

## Recommendation
1. Do not implement until commercial terms and NO coverage are confirmed in writing.
2. Shortlist **Tink** for Norwegian retail breadth; keep **Enable Banking** as a pilot/cost alternative.
3. Next step (separate approval): sandbox + map top banks + Edge Function design — no production migration until approved.

## Sources
- Open Banking Tracker (Tink vs Enable Banking, Norway directory, 2026)
- Tink Norway status page
- Tink PSD2 registration docs
