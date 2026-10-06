/**
 * Montra Plus entitlement + display pricing helpers.
 *
 * Entitlement source of truth: public.plus_entitlements (server-synced from Stripe).
 * Frontend only reads the caller's own row via RLS. Never writes entitlement.
 */

/** Row shape from public.plus_entitlements (SELECT only). */
export type PlusEntitlement = {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string;
  current_period_end: string | null;
  created_at?: string;
  updated_at?: string;
};

/** Stripe subscription statuses that grant Plus access. */
const ACTIVE_STATUSES = new Set(["active", "trialing"]);

/**
 * Whether an entitlement row currently grants Plus in the UI.
 *
 * Rules:
 * - status must be `active` or `trialing`
 * - current_period_end must be missing OR strictly in the future
 *
 * This is a client-side UX gate only. Private data remains protected by RLS.
 */
export function isPlusEntitlementActive(
  entitlement: PlusEntitlement | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!entitlement) return false;
  const status = (entitlement.status ?? "").trim().toLowerCase();
  if (!ACTIVE_STATUSES.has(status)) return false;

  if (entitlement.current_period_end) {
    const end = Date.parse(entitlement.current_period_end);
    if (Number.isFinite(end) && end <= nowMs) return false;
  }
  return true;
}

/** @deprecated Always false. Use usePlusEntitlement() for real Plus access. */
export function hasPlusAccess(_email?: string | null): boolean {
  return false;
}

/**
 * @deprecated Prefer usePlusEntitlement(). Kept as a pure helper for tests / non-React code.
 * Does not accept email bypasses — entitlement table is the only source of truth.
 */
export function hasPlusAccessFromEntitlement(
  entitlement: PlusEntitlement | null | undefined,
): boolean {
  return isPlusEntitlementActive(entitlement);
}

/**
 * Canonical Plus subscription display pricing (NOK only).
 * Single source of truth for PlusPage, PricingPublic, and marketing.
 */
export const PLUS_PRICING = {
  monthlyAmount: 39,
  yearlyAmount: 329,
  /** Formatted labels shown in UI — never convert via display currency. */
  monthlyLabel: "39 NOK",
  yearlyLabel: "329 NOK",
  trialDays: 7,
  /** Approximate annual saving vs 12 × monthly (39×12=468; (468−329)/468 ≈ 29.7%). */
  yearlySavingsPercent: 30,
  yearlySavingsNoteEn: "About 30% off",
} as const;
