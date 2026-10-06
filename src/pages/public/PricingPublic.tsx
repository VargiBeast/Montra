import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Lock, Sparkles } from "lucide-react";
import { languageForCopy, useLanguage, useTranslation } from "../../lib/i18n";
import { useDocumentMeta } from "../../lib/seo";
import { PLUS_PRICING } from "../../lib/plus";
import { plusCheckoutCopy } from "../../lib/plusCheckoutCopy";
import { trackEvent } from "../../lib/gtm";
import { useAuth } from "../../hooks/useAuth";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";

type Plan = "monthly" | "yearly";

export function PricingPublic() {
  const translate = useTranslation();
  const { language } = useLanguage();
  const auth = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<Plan>("yearly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = useCallback(
    (key: string, values?: Record<string, string | number>) => {
      const copyLang = languageForCopy(language);
      const fromCheckout = plusCheckoutCopy[copyLang]?.[key] ?? plusCheckoutCopy.en?.[key];
      if (fromCheckout) {
        let value = fromCheckout;
        if (values) {
          value = value.replace(/\{(\w+)\}/g, (m, n) =>
            Object.hasOwn(values, n) ? String(values[n]) : m,
          );
        }
        return value;
      }
      return translate(key, values);
    },
    [language, translate],
  );

  useDocumentMeta({
    title: t("seoPricingTitle"),
    description: t("seoPricingDescription"),
    path: "/pricing",
  });

  const freeItems = [t("plusFree1"), t("plusFree2"), t("plusFree3"), t("plusFree4")];
  const plusItems = [t("plusIncluded1"), t("plusIncluded2"), t("plusIncluded3"), t("plusIncluded4")];

  const startCheckout = useCallback(
    async (plan: Plan) => {
      if (loading) return;
      setError(null);
      setSelectedPlan(plan);
      trackEvent("upgrade_clicked", { surface: "pricing" });

      if (!auth.user) {
        navigate("/login", { state: { from: "/pricing" } });
        return;
      }

      if (!isSupabaseConfigured || !supabase) {
        setError(t("plusCheckoutError"));
        return;
      }

      setLoading(true);
      try {
        const { data, error: invokeError } = await supabase.functions.invoke(
          "create-stripe-checkout",
          { body: { plan } },
        );

        if (invokeError) {
          console.error("create-stripe-checkout invoke error:", invokeError);
          setError(t("plusCheckoutError"));
          setLoading(false);
          return;
        }

        const payload = data as { url?: string; error?: string; code?: string } | null;
        const url = payload?.url;
        if (typeof url === "string" && url.startsWith("https://")) {
          window.location.href = url;
          return;
        }

        console.error("create-stripe-checkout unexpected response:", payload?.code ?? payload?.error, data);
        setError(t("plusCheckoutError"));
        setLoading(false);
      } catch (err) {
        console.error("create-stripe-checkout failed:", err);
        setError(t("plusCheckoutError"));
        setLoading(false);
      }
    },
    [auth.user, loading, navigate, t],
  );

  const ctaLabel = loading
    ? t("plusCtaLoading")
    : !auth.user
      ? t("plusCtaSignIn")
      : t("plusCtaLocked");

  return (
    <main className="marketing-main">
      <section className="marketing-hero panel">
        <p className="eyebrow accent-green">{t("navPricing")}</p>
        <h1>{t("pricingHeroTitle")}</h1>
        <p className="marketing-lead">{t("pricingHeroBody")}</p>
      </section>

      <section className="pricing-compare-grid">
        <article className="panel pricing-plan-card">
          <p className="eyebrow">{t("plusCompareFree")}</p>
          <h2>{t("plusCompareFree")}</h2>
          <p className="pricing-plan-price">{t("pricingFreeLabel")}</p>
          <ul className="plus-checklist">
            {freeItems.map((item) => (
              <li key={item}>
                <Check size={16} aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Link
            to="/app"
            className="secondary-button wide"
            onClick={() => trackEvent("get_started", { surface: "pricing" })}
          >
            {t("navGetStarted")}
          </Link>
        </article>

        <article className="panel pricing-plan-card is-featured">
          <p className="eyebrow accent-green">Montra Plus</p>
          <h2>{t("plusComparePlus")}</h2>
          <div className="plus-trial-banner" role="status">
            <span className="plus-trial-badge">{t("plusTrialBadge")}</span>
            <span className="plus-trial-then">
              {t("plusTrialThen")} {PLUS_PRICING.monthlyLabel}/{t("plusPriceMonthlyLabel").replace(/^per\s+/i, "")}
            </span>
          </div>

          <div className="plus-price-cards" role="radiogroup" aria-label={t("plusPricingTitle")}>
            <button
              type="button"
              role="radio"
              aria-checked={selectedPlan === "monthly"}
              className={`plus-price-card ${selectedPlan === "monthly" ? "is-selected" : ""}`}
              onClick={() => setSelectedPlan("monthly")}
            >
              <strong className="plus-price-amount">{PLUS_PRICING.monthlyLabel}</strong>
              <span className="plus-price-label">{t("plusPriceMonthlyLabel")}</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={selectedPlan === "yearly"}
              className={`plus-price-card is-featured ${selectedPlan === "yearly" ? "is-selected" : ""}`}
              onClick={() => setSelectedPlan("yearly")}
            >
              <strong className="plus-price-amount">{PLUS_PRICING.yearlyLabel}</strong>
              <span className="plus-price-label">{t("plusPriceYearlyLabel")}</span>
              <span className="plus-price-note">{t("plusPriceYearlyNote")}</span>
            </button>
          </div>

          <ul className="plus-checklist">
            {plusItems.map((item) => (
              <li key={item}>
                <Check size={16} aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="pricing-cta-row">
            <button
              type="button"
              className={`primary-button wide ${loading ? "is-loading" : ""}`}
              disabled={loading}
              aria-busy={loading}
              onClick={() => void startCheckout(selectedPlan)}
            >
              {!auth.user ? <Lock size={16} aria-hidden="true" /> : <Sparkles size={16} aria-hidden="true" />}
              {ctaLabel}
              <span className="pricing-cta-plan">
                {selectedPlan === "yearly" ? PLUS_PRICING.yearlyLabel : PLUS_PRICING.monthlyLabel}
              </span>
            </button>
            <div className="pricing-plan-ctas">
              <button
                type="button"
                className="secondary-button"
                disabled={loading}
                onClick={() => void startCheckout("monthly")}
              >
                {PLUS_PRICING.monthlyLabel} · {t("plusPriceMonthlyLabel")}
              </button>
              <button
                type="button"
                className="secondary-button"
                disabled={loading}
                onClick={() => void startCheckout("yearly")}
              >
                {PLUS_PRICING.yearlyLabel} · {t("plusPriceYearlyLabel")}
              </button>
            </div>
          </div>

          {error && (
            <p className="plus-cta-error" role="alert">
              {error}
            </p>
          )}
          <p className="plus-cta-note">{t("plusCtaNote")}</p>
        </article>
      </section>
    </main>
  );
}
