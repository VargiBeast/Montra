# Recurring payments (planned)

## Status
Feature branch: `feature/recurring-payments`

## Model
Table `recurring_payments` — **not** transactions. RLS mirrors `savings_goals`.

Migration file is in the repo only. **Not applied to production.**

## Date rules
- `schedule_day` (1–31) preserved for monthly/yearly so Jan 31 → Feb 28/29 → Mar 31.
- weekly: +7 days from anchor.

## Log as completed — deferred
MVP does **not** auto-create transactions from planned payments.

A two-step “insert transaction then advance next_due_date” flow is **not** atomic
and can create duplicate transactions on retry after a partial failure.
Until an idempotent design exists (e.g. unique occurrence key + RPC), completion
logging stays out of the product UI.

## Isolation
Planned rows are never passed into `getBalanceSummary`, Analytics, Snapshot,
What If, or Journey.
