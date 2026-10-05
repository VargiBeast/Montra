/**
 * Montra Plus entitlement + display pricing helpers.
 *
 * Entitlement is temporary until payments ship.
 * Pricing amounts are always NOK and must NOT go through display-currency conversion.
 */

/** Google account used for pre-payment Plus testing. Remove when billing ships. */
const TEMP_PLUS_TEST_EMAILS = new Set(["ivargyt@gmail.com"]);

/**
 * Returns true when the user should see Plus features unlocked.
 * Currently: hardcoded test emails only. No payments, no Stripe, no webhooks.
 */
export function hasPlusAccess(email: string | null | undefined): boolean {
  if (!email) return false;
  return TEMP_PLUS_TEST_EMAILS.has(email.trim().toLowerCase());
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
