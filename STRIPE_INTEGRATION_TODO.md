# Stripe integration status (Montra Plus)

## Done — existing Checkout updated (Scenario A)

The existing Supabase Edge Function `create-stripe-checkout` was updated in place.
No new checkout endpoint, webhook, customer mapping, or entitlement system was added.

Architecture (unchanged):

```
Montra /plus
  → create-stripe-checkout
  → Stripe Checkout (hosted subscription)
  → Stripe subscription (+ webhook / Sync Engine)
  → plus_entitlements
```

### Checkout Session parameters now set

| Parameter | Value |
|-----------|--------|
| `mode` | `subscription` |
| `ui_mode` | `hosted` (API equivalent of Checkout Builder “hosted_page”) |
| `billing_address_collection` | `auto` |
| `phone_number_collection.enabled` | `true` |
| `payment_method_collection` | `always` |
| `allow_promotion_codes` | `true` |
| `automatic_tax.enabled` | `true` |
| `submit_type` | `auto` |
| `consent_collection.terms_of_service` | `required` |
| `custom_text.terms_of_service_acceptance.message` | Trial + Terms / Privacy acceptance copy |
| `subscription_data.trial_period_days` | `7` (preserved) |
| `payment_method_types` | **not set** — Stripe uses Dashboard-enabled methods |

### Real values preserved (not placeholders)

- **Monthly price:** `price_1UNWoLPoFbr8ckzNvSQANDDz` (39 NOK/month)
- **Yearly price:** `price_1UNWoLPoFbr8ckzNjxOSUmSY` (329 NOK/year)
- **Success URL:** `https://montra.cash/plus?checkout=success`
- **Cancel URL:** `https://montra.cash/plus?checkout=cancelled`
- **Customer mapping:** `stripe_customer_links` (create/reuse)
- **Identity:** `client_reference_id` + `metadata.montra_user_id` / `montra_plan`
- **Webhook / Sync Engine / plus_entitlements:** untouched

Builder fields `integration_identifier: hosted_web_0001` and `origin_context: web` are stored on session **metadata** (not forced as unknown top-level Session API fields under the current `stripe@17` Edge Function client).

## Remaining Stripe Dashboard setup

These are account-side requirements. The app does not configure them in code.

1. **Stripe Tax** — `automatic_tax.enabled = true` requires Stripe Tax to be active and ready for the account (origin address, tax registrations as applicable). If Tax is incomplete, Checkout Session creation can fail with a Stripe Tax-related error until the Dashboard setup is finished.
2. **Terms of Service URL** — `consent_collection.terms_of_service = required` requires a public Terms of Service URL under Stripe Dashboard → Settings → Public details (or Customer portal / business settings, depending on Stripe’s current UI). Point it at Montra’s live Terms page (e.g. `https://montra.cash/terms`).
3. **Privacy Policy URL** — recommended in the same business/public details area so Checkout can surface policy links consistently.
4. **Deploy Edge Function** — after merging, deploy the updated function:

   ```bash
   supabase functions deploy create-stripe-checkout
   ```

5. **Live smoke test** — complete one test-mode Checkout (monthly and yearly) with a test card and confirm webhook → `plus_entitlements` still updates. App-side payment success has not been re-verified in this change set.

## Explicitly out of scope (not changed)

- Authentication, transactions, receipts, savings goals, wishlist, i18n, currency, navigation
- Stripe webhook handlers / Sync Engine tables
- `plus_entitlements` schema or RLS
- Frontend Stripe keys or service-role usage
