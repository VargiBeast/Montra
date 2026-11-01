/**
 * Montra Plus entitlement helpers.
 * Source of truth: public.plus_entitlements (server-synced from Stripe).
 * Frontend only SELECTs own row via RLS. Never writes entitlement.
 */

export type PlusEntitlement = {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string;
  current_period_end: string | null;
  created_at?: string;
  updated_at?: string;
};

const ACTIVE_STATUSES = new Set(['active', 'trialing']);

export function isPlusEntitlementActive(
  entitlement: PlusEntitlement | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!entitlement) return false;
  const status = (entitlement.status ?? '').trim().toLowerCase();
  if (!ACTIVE_STATUSES.has(status)) return false;

  if (entitlement.current_period_end) {
    const end = Date.parse(entitlement.current_period_end);
    if (Number.isFinite(end) && end <= nowMs) return false;
  }
  return true;
}

export const PLUS_PRICING = {
  monthlyAmount: 39,
  yearlyAmount: 329,
  monthlyLabel: '39 NOK',
  yearlyLabel: '329 NOK',
  trialDays: 7,
  yearlySavingsPercent: 30,
} as const;
