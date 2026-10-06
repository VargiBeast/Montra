/**
 * Google Tag Manager + Consent Mode v2 helpers.
 * Architecture: Montra → GTM-M7PLP5TK → GA4 G-F4G8LGHZSH (configured inside GTM).
 * Never send financial or personal data through dataLayer.
 */

export const GTM_CONTAINER_ID = "GTM-M7PLP5TK";
/** Measurement ID for the correct montra.cash GA4 web stream — configured inside GTM only. */
export const GA4_MEASUREMENT_ID = "G-F4G8LGHZSH";

const CONSENT_STORAGE_KEY = "montra.analytics.consent";

export type AnalyticsConsent = "granted" | "denied" | null;

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
  }
}

function ensureDataLayer() {
  window.dataLayer = window.dataLayer || [];
}

/** gtag stub that only pushes to dataLayer (required by Consent Mode). */
function gtag(...args: unknown[]) {
  ensureDataLayer();
  window.dataLayer!.push(args as unknown as Record<string, unknown>);
}

export function readStoredConsent(): AnalyticsConsent {
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (value === "granted" || value === "denied") return value;
  } catch {
    /* storage unavailable */
  }
  return null;
}

export function persistConsent(choice: "granted" | "denied") {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    /* storage unavailable */
  }
}

/**
 * Default Consent Mode v2 — must run before GTM loads.
 * All advertising + analytics signals denied until the user accepts.
 */
export function applyDefaultConsent() {
  ensureDataLayer();
  window.gtag = window.gtag || gtag;
  window.gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500,
  });
}

/** Restore a previously saved choice before tags can fire. */
export function restoreConsentIfKnown() {
  const stored = readStoredConsent();
  if (!stored) return;
  ensureDataLayer();
  window.gtag = window.gtag || gtag;
  window.gtag("consent", "update", {
    analytics_storage: stored === "granted" ? "granted" : "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

export function updateAnalyticsConsent(granted: boolean) {
  const choice = granted ? "granted" : "denied";
  persistConsent(choice);
  ensureDataLayer();
  window.gtag = window.gtag || gtag;
  window.gtag("consent", "update", {
    analytics_storage: granted ? "granted" : "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

let gtmInjected = false;

/** Inject GTM container once. Safe to call multiple times. */
export function initGtm() {
  if (typeof window === "undefined" || gtmInjected) return;
  if (document.getElementById("gtm-script")) {
    gtmInjected = true;
    return;
  }
  ensureDataLayer();
  window.dataLayer!.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });

  const script = document.createElement("script");
  script.id = "gtm-script";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}`;
  document.head.appendChild(script);
  gtmInjected = true;
}

const PUBLIC_PAGEVIEW_PATHS = new Set([
  "/",
  "/features",
  "/plus",
  "/pricing",
  "/about",
  "/contact",
  "/faq",
  "/help",
  "/privacy",
  "/terms",
  "/cookies",
  "/security",
]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PAGEVIEW_PATHS.has(pathname)) return true;
  // Public wishlist share pages — path only, no token value
  if (pathname.startsWith("/wishlist/") && pathname !== "/wishlist") return true;
  return false;
}

let lastPagePath: string | null = null;

/**
 * SPA pageview for public routes only.
 * Skips authenticated app routes and never includes financial data.
 */
export function trackPageView(pathname: string) {
  if (readStoredConsent() !== "granted") return;
  if (!isPublicPath(pathname)) return;
  // Strip query/hash and never send tokens or private segments beyond path shape
  const path = pathname.split("?")[0].split("#")[0];
  const safePath = path.startsWith("/wishlist/") ? "/wishlist/shared" : path;
  if (safePath === lastPagePath) return;
  lastPagePath = safePath;
  ensureDataLayer();
  window.dataLayer!.push({
    event: "page_view",
    page_path: safePath,
  });
}

export type ProductEvent =
  | "get_started"
  | "login_started"
  | "onboarding_completed"
  | "plus_viewed"
  | "pricing_viewed"
  | "upgrade_clicked";

/** Product interaction events — no financial or personal parameters. */
export function trackEvent(name: ProductEvent, context?: { surface?: string }) {
  if (readStoredConsent() !== "granted") return;
  ensureDataLayer();
  const payload: Record<string, unknown> = { event: name };
  if (context?.surface) payload.surface = context.surface;
  window.dataLayer!.push(payload);
}
