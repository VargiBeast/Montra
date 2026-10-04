/**
 * Temporary Montra Plus entitlement helpers.
 *
 * DEVELOPMENT ONLY — replace with real subscription/entitlement checks
 * when payments are implemented. Do not scatter test emails in UI components.
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
