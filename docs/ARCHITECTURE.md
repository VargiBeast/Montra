# Montra Rebuild Architecture

## Stack
- React 19 + TypeScript + Vite
- Supabase (Auth, Postgres, Storage, Edge Functions)
- Lucide React, Tesseract.js

## Structure
```
src/
  components/layout/     # AppShell, navigation
  features/
    authentication/
    dashboard/
    transactions/
    receipts/
    goals/
    wishlist/
    plus/
    settings/
  hooks/                 # useTransactions, useSavingsGoals, useReceipts, useWishlist, useDisplayCurrency
  lib/                   # supabase, utils, currency, insights, stripe, i18n, localOcr
  services/              # data access layer
  types/
  styles/
```

## Key contracts (reused from production)
- transactions (type in|out, amount, date, …)
- savings_goals
- wishlists.savings_goal_id → savings_goals.id
- receipts + private storage bucket `receipts`
- purchase-images, wishlist buckets
- Edge Function `create-stripe-checkout`
- NOK base currency + Frankfurter rates

## Safety
- No service-role keys in client
- All queries scoped by user_id + RLS
- OCR never auto-creates transactions
- Stripe secrets stay in Edge Functions
