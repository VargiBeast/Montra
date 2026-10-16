# Recurring payments (planned)

## Status
Feature branch: `feature/recurring-payments`

## Model
Table `recurring_payments` — **not** transactions. RLS mirrors `savings_goals`.

## Date rules
- `schedule_day` (1–31) preserved for monthly/yearly so Jan 31 → Feb 28/29 → Mar 31.
- weekly: +7 days from anchor.

## Log as completed
Sequential: insert one `transactions` row, then update `next_due_date`.
Not a single DB transaction (no RPC). On second-step failure, user can retry or edit.
Requires explicit confirm in UI.

## Isolation
Never passed into `getBalanceSummary`, Analytics, Snapshot, What If, or Journey.

## Production
Migration file is in repo only — **not** applied to production without explicit approval.
