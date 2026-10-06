import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, BarChart3, Check, Lightbulb, Lock, Palette, PiggyBank, Sparkles, Target, TrendingUp,
} from "lucide-react";
import { languageForCopy, useLanguage, useTranslation } from "../lib/i18n";
import { fillMissingCopy } from "../lib/missingCopy";
import { PLUS_PRICING } from "../lib/plus";
import { plusCheckoutCopy } from "../lib/plusCheckoutCopy";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

interface PlusPageProps {
  hasPlus: boolean;
  onBack: () => void;
  onOpenAnalytics?: () => void;
  onOpenSavings?: () => void;
  onOpenPersonalize?: () => void;
  /** True while the entitlement row is being read. Does not grant Plus. */
  entitlementLoading?: boolean;
  /** Raw Stripe status from plus_entitlements, if any. Informational only. */
  entitlementStatus?: string | null;
  /** Re-read plus_entitlements. Checkout success must not unlock Plus by itself. */
  onRefreshEntitlement?: () => Promise<void> | void;
}

type Plan = "monthly" | "yearly";

const PLUS_FALLBACK: Record<string, string> = {
  plusTitle: "Montra Plus",
  plusSubtitle: "Deeper understanding of your money — built on the data you already track.",
  plusActiveBadge: "Active on this account",
  plusLockedBadge: "Premium",
  plusValueTitle: "What Plus adds",
  plusValueBody: "Free Montra already tracks purchases, receipts, goals and wishlist. Plus unlocks deeper analytics, planning tools and forecasts from your real history.",
  plusFeatureUnderstand: "Understand",
  plusFeatureUnderstandBody: "Spending by category, income vs expenses, trends and monthly comparisons so you can see where money actually goes.",
  plusFeaturePlan: "Plan",
  plusFeaturePlanBody: "Richer savings-goal progress: remaining amount, monthly pace needed and estimated completion from your target and deadline.",
  plusFeaturePredict: "Predict",
  plusFeaturePredictBody: "End-of-month estimates and savings projections based on your transaction history — clearly marked as estimates, never invented.",
  plusFeaturePersonalize: "Personalize",
  plusFeaturePersonalizeBody: "Choose which Home sections you see, reorder them, and pick a Liquid Glass accent — open Personalize Montra from Plus.",
  plusPricingTitle: "Pricing",
  plusPricingBody: "Start with 7 days free. Then choose monthly or yearly — prices stay clear, no hidden fees.",
  plusTrialBadge: "7 days free",
  plusTrialThen: "Then",
  plusPriceMonthly: "39 NOK",
  plusPriceMonthlyLabel: "per month",
  plusPriceYearly: "329 NOK",
  plusPriceYearlyLabel: "per year",
  plusPriceYearlyNote: "About 30% off",
  plusIncluded: "Included with Plus",
  plusIncluded1: "Advanced analytics & category insights",
  plusIncluded2: "Goal planning & progress projections",
  plusIncluded3: "Month forecast & savings outlook",
  plusIncluded4: "Priority access to new Plus tools",
  plusCtaActive: "You're on Montra Plus",
  plusCtaLocked: "Start free trial",
  plusCtaNote: "7-day free trial. Cancel anytime before it ends — you won't be charged.",
  plusCtaLoading: "Opening checkout…",
  plusCtaSignIn: "Sign in to continue",
  plusCheckoutError: "Could not start checkout. Please try again.",
  plusCheckoutCancelled: "Checkout was cancelled. No subscription was started.",
  plusCheckoutSuccess: "Payment received. Your Plus access will be confirmed shortly.",
  plusCompareTitle: "Free vs Plus",
  plusCompareFree: "Free",
  plusComparePlus: "Plus",
  plusOpenAnalytics: "Open analytics",
  plusOpenGoals: "Open savings goals",
  plusOpenPersonalize: "Personalize Montra",
  plusExplorePersonalize: "See personalization",
  plusBack: "Back",
  plusFreeTitle: "What you already have for free",
  plusFree1: "Track income & spending",
  plusFree2: "Receipts with capture",
  plusFree3: "Savings goals & wishlist",
  plusFree4: "Multi-language & display currency",
};

export function PlusPage({ hasPlus, onBack, onOpenAnalytics, onOpenSavings, onOpenPersonalize, entitlementLoading = false, entitlementStatus = null, onRefreshEntitlement }: PlusPageProps) {
  const translate = useTranslation();
  const { language } = useLanguage();
  const auth = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedPlan, setSelectedPlan] = useState<Plan>("yearly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<"success" | "cancelled" | null>(null);

  const t = (key: string, values?: Record<string, string | number>) => {
    // Checkout copy lives in plusCheckoutCopy (all 18 languages).
    const copyLang = languageForCopy(language);
    const fromCheckout = plusCheckoutCopy[copyLang]?.[key] ?? plusCheckoutCopy.en?.[key];
    if (fromCheckout) {
      let value = fromCheckout;
      if (values) {
        value = value.replace(/\{(\w+)\}/g, (m, n) => Object.hasOwn(values, n) ? String(values[n]) : m);
      }
      return value;
    }
    if (key === "plusPriceMonthly") return PLUS_PRICING.monthlyLabel;
    if (key === "plusPriceYearly") return PLUS_PRICING.yearlyLabel;
    if (key === "plusPriceYearlyNote") {
      const lookedUp = translate(key, values);
      if (lookedUp && /two months|to måneder|två månader|deux mois|dos meses|due mesi|dois meses|twee maanden|kaksi kuukautta|dwa miesiące|dva měsíce|iki ay|شهرين|2か|두 달|两个月/i.test(lookedUp)) {
        return PLUS_PRICING.yearlySavingsNoteEn;
      }
      if (lookedUp && lookedUp !== "\u2014" && lookedUp !== key) return lookedUp;
      return PLUS_FALLBACK[key] ?? PLUS_PRICING.yearlySavingsNoteEn;
    }
    const lookedUp = translate(key, values);
    let value = lookedUp;
    if (!value || value === "\u2014" || value === key) {
      value = fillMissingCopy(key, lookedUp, language);
    }
    if (!value || value === "\u2014" || value === key) {
      value = PLUS_FALLBACK[key] ?? "\u2014";
    }
    if (values) {
      value = value.replace(/\{(\w+)\}/g, (m, n) => Object.hasOwn(values, n) ? String(values[n]) : m);
    }
    return value;
  };

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      // Confirmation only. Plus stays locked until plus_entitlements says active/trialing.
      setStatusMessage("success");
      const next = new URLSearchParams(searchParams);
      next.delete("checkout");
      setSearchParams(next, { replace: true });
      void onRefreshEntitlement?.();
    } else if (checkout === "cancelled") {
      setStatusMessage("cancelled");
      const next = new URLSearchParams(searchParams);
      next.delete("checkout");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, onRefreshEntitlement]);

  useEffect(() => {
    if (statusMessage !== "success" || hasPlus || !onRefreshEntitlement) return;
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (attempts > 15) {
        window.clearInterval(timer);
        return;
      }
      void onRefreshEntitlement();
    }, 2000);
    return () => window.clearInterval(timer);
  }, [statusMessage, hasPlus, onRefreshEntitlement]);

  const startCheckout = useCallback(async () => {
    if (loading) return;
    setError(null);

    if (!auth.user) {
      navigate("/login", { state: { from: "/plus" } });
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setError(t("plusCheckoutError"));
      return;
    }

    setLoading(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("create-stripe-checkout", {
        body: { plan: selectedPlan },
      });

      if (invokeError) {
        console.error("create-stripe-checkout invoke error:", invokeError);
        setError(t("plusCheckoutError"));
        setLoading(false);
        return;
      }

      const url = (data as { url?: string } | null)?.url;
      if (typeof url === "string" && url.startsWith("https://")) {
        window.location.href = url;
        return;
      }

      console.error("create-stripe-checkout unexpected response:", data);
      setError(t("plusCheckoutError"));
      setLoading(false);
    } catch (err) {
      console.error("create-stripe-checkout failed:", err);
      setError(t("plusCheckoutError"));
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user, loading, selectedPlan, navigate]);

  const features = [
    { icon: <BarChart3 size={22} />, title: t("plusFeatureUnderstand"), body: t("plusFeatureUnderstandBody") },
    { icon: <Target size={22} />, title: t("plusFeaturePlan"), body: t("plusFeaturePlanBody") },
    { icon: <TrendingUp size={22} />, title: t("plusFeaturePredict"), body: t("plusFeaturePredictBody") },
    { icon: <Palette size={22} />, title: t("plusFeaturePersonalize"), body: t("plusFeaturePersonalizeBody") },
  ];
  const included = [t("plusIncluded1"), t("plusIncluded2"), t("plusIncluded3"), t("plusIncluded4")];
  const freeItems = [t("plusFree1"), t("plusFree2"), t("plusFree3"), t("plusFree4")];

  const ctaLabel = hasPlus
    ? t("plusCtaActive")
    : loading
      ? t("plusCtaLoading")
      : !auth.user
        ? t("plusCtaSignIn")
        : t("plusCtaLocked");

  return (
    <main className="page-content plus-page">
      <div className="page-header plus-page-header">
        <button type="button" className="icon-button" aria-label={t("plusBack")} onClick={onBack}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="greeting">
            <span className={`plus-badge ${hasPlus ? "is-active" : ""}`}>
              {hasPlus ? t("plusActiveBadge") : t("plusLockedBadge")}
            </span>
          </p>
          <h1 className="page-title">{t("plusTitle")}</h1>
          <p className="plus-subtitle">{t("plusSubtitle")}</p>
        </div>
      </div>

      {statusMessage === "success" && !hasPlus && (
        <div className="panel plus-status plus-status-success" role="status" data-entitlement-status={entitlementStatus ?? ""} aria-busy={entitlementLoading}>
          <Check size={18} aria-hidden="true" />
          <p>{t("plusCheckoutSuccess")}</p>
        </div>
      )}
      {statusMessage === "cancelled" && (
        <div className="panel plus-status plus-status-cancelled" role="status">
          <p>{t("plusCheckoutCancelled")}</p>
        </div>
      )}

      <section className="panel plus-hero" aria-label={t("plusValueTitle")}>
        <div className="plus-hero-icon" aria-hidden="true"><Sparkles size={28} /></div>
        <h2>{t("plusValueTitle")}</h2>
        <p>{t("plusValueBody")}</p>
      </section>
      <section className="plus-feature-grid" aria-label={t("plusValueTitle")}>
        {features.map((feature) => (
          <article key={feature.title} className="panel plus-feature-card">
            <span className="plus-feature-icon" aria-hidden="true">{feature.icon}</span>
            <h3>{feature.title}</h3>
            <p>{feature.body}</p>
          </article>
        ))}
      </section>
      <section className="panel plus-free-card" aria-label={t("plusFreeTitle")}>
        <h2>{t("plusFreeTitle")}</h2>
        <ul className="plus-checklist">
          {freeItems.map((item) => (
            <li key={item}><Check size={16} aria-hidden="true" /><span>{item}</span></li>
          ))}
        </ul>
      </section>
      <section className="plus-compare" aria-label={t("plusCompareTitle")}>
        <h2 className="plus-compare-heading">{t("plusCompareTitle")}</h2>
        <div className="plus-compare-grid">
          <article className="panel plus-compare-card">
            <p className="eyebrow">{t("plusCompareFree")}</p>
            <h3>{t("plusCompareFree")}</h3>
            <ul className="plus-checklist">
              {freeItems.map((item) => (
                <li key={`free-${item}`}><Check size={16} aria-hidden="true" /><span>{item}</span></li>
              ))}
            </ul>
          </article>
          <article className="panel plus-compare-card is-plus">
            <p className="eyebrow accent-green">{t("plusComparePlus")}</p>
            <h3>{t("plusComparePlus")}</h3>
            <ul className="plus-checklist">
              {included.map((item) => (
                <li key={`plus-${item}`}><Check size={16} aria-hidden="true" /><span>{item}</span></li>
              ))}
            </ul>
          </article>
        </div>
      </section>
      <section className="panel plus-pricing" aria-label={t("plusPricingTitle")}>
        <div className="plus-pricing-header">
          <Lightbulb size={18} aria-hidden="true" />
          <h2>{t("plusPricingTitle")}</h2>
        </div>
        <p className="plus-pricing-body">{t("plusPricingBody")}</p>
        <div className="plus-trial-banner" role="status">
          <span className="plus-trial-badge">{t("plusTrialBadge")}</span>
          <span className="plus-trial-then">{t("plusTrialThen")}</span>
        </div>
        <div className="plus-price-cards" role="radiogroup" aria-label={t("plusPricingTitle")}>
          <button
            type="button"
            role="radio"
            aria-checked={selectedPlan === "monthly"}
            className={`plus-price-card ${selectedPlan === "monthly" ? "is-selected" : ""}`}
            onClick={() => setSelectedPlan("monthly")}
            disabled={loading || hasPlus}
          >
            <strong className="plus-price-amount">{t("plusPriceMonthly")}</strong>
            <span className="plus-price-label">{t("plusPriceMonthlyLabel")}</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={selectedPlan === "yearly"}
            className={`plus-price-card is-featured ${selectedPlan === "yearly" ? "is-selected" : ""}`}
            onClick={() => setSelectedPlan("yearly")}
            disabled={loading || hasPlus}
          >
            <strong className="plus-price-amount">{t("plusPriceYearly")}</strong>
            <span className="plus-price-label">{t("plusPriceYearlyLabel")}</span>
            <span className="plus-price-note">{t("plusPriceYearlyNote")}</span>
          </button>
        </div>
        <p className="eyebrow plus-included-label">{t("plusIncluded")}</p>
        <ul className="plus-checklist">
          {included.map((item) => (
            <li key={item}><Check size={16} aria-hidden="true" /><span>{item}</span></li>
          ))}
        </ul>
        <button
          type="button"
          className={`primary-button plus-cta ${hasPlus ? "is-active" : ""} ${loading ? "is-loading" : ""}`}
          disabled={hasPlus || loading}
          aria-disabled={hasPlus || loading}
          aria-busy={loading}
          onClick={hasPlus ? undefined : startCheckout}
        >
          {hasPlus ? (
            <><Sparkles size={16} /> {ctaLabel}</>
          ) : loading ? (
            <>{ctaLabel}</>
          ) : !auth.user ? (
            <><Lock size={16} /> {ctaLabel}</>
          ) : (
            <><Sparkles size={16} /> {ctaLabel}</>
          )}
        </button>
        {error && (
          <p className="plus-cta-error" role="alert">{error}</p>
        )}
        {!hasPlus && (
          <p className="plus-cta-note">{t("plusCtaNote")}</p>
        )}
      </section>
      {onOpenPersonalize && (
        <section className="panel plus-personalize-cta" aria-label={t("plusFeaturePersonalize")}>
          <span className="plus-feature-icon" aria-hidden="true"><Palette size={22} /></span>
          <div>
            <h2>{t("plusFeaturePersonalize")}</h2>
            <p>{t("plusFeaturePersonalizeBody")}</p>
          </div>
          <button type="button" className="primary-button" onClick={onOpenPersonalize}>
            {hasPlus ? t("plusOpenPersonalize") : t("plusExplorePersonalize")}
          </button>
        </section>
      )}
      {hasPlus && (
        <section className="plus-quick-actions">
          {onOpenAnalytics && (
            <button type="button" className="panel plus-action-btn" onClick={onOpenAnalytics}>
              <BarChart3 size={18} /><span>{t("plusOpenAnalytics")}</span>
            </button>
          )}
          {onOpenSavings && (
            <button type="button" className="panel plus-action-btn" onClick={onOpenSavings}>
              <PiggyBank size={18} /><span>{t("plusOpenGoals")}</span>
            </button>
          )}
          {onOpenPersonalize && (
            <button type="button" className="panel plus-action-btn" onClick={onOpenPersonalize}>
              <Palette size={18} /><span>{t("plusOpenPersonalize")}</span>
            </button>
          )}
        </section>
      )}
    </main>
  );
}
