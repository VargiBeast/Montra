import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
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
        const { data, error: invokeError } = await supabase.functions.invoke("create-stripe-checkout", {
          body: { plan },
        });

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
      <section className="mkt-hero">
        <div className="mkt-hero-glow" aria-hidden />
        <p className="mkt-eyebrow">{t("navPricing")}</p>
        <h1>{t("pricingHeroTitle")}</h1>
        <p className="mkt-lead">{t("pricingHeroBody")}</p>
      </section>

      <section className="mkt-price-grid">
        <article className="mkt-price-card">
          <p className="mkt-eyebrow">{t("plusCompareFree")}</p>
          <h2>{t("plusCompareFree")}</h2>
          <p className="mkt-price-amount">{t("pricingFreeLabel")}</p>
          <ul className="mkt-checklist">
            {freeItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <button type="button" className="mkt-btn mkt-btn-secondary" style={{ width: "100%" }} onClick={() => navigate("/app")}>
            {t("navGetStarted")}
          </button>
        </article>

        <article className="mkt-price-card is-featured">
          <p className="mkt-eyebrow">{t("plusComparePlus")}</p>
          <h2>{t("plusComparePlus")}</h2>
          <div className="mkt-plan-toggle" role="radiogroup" aria-label={t("plusPricingTitle")}>
            <button
              type="button"
              role="radio"
              aria-checked={selectedPlan === "monthly"}
              className={selectedPlan === "monthly" ? "is-selected" : ""}
              onClick={() => setSelectedPlan("monthly")}
              disabled={loading}
            >
              {PLUS_PRICING.monthlyLabel}
              <span style={{ display: "block", fontSize: 11, fontWeight: 500, opacity: 0.8 }}>
                {t("plusPriceMonthlyLabel")}
              </span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={selectedPlan === "yearly"}
              className={selectedPlan === "yearly" ? "is-selected" : ""}
              onClick={() => setSelectedPlan("yearly")}
              disabled={loading}
            >
              {PLUS_PRICING.yearlyLabel}
              <span style={{ display: "block", fontSize: 11, fontWeight: 500, opacity: 0.8 }}>
                {t("plusPriceYearlyLabel")}
              </span>
            </button>
          </div>
          <p className="mkt-price-amount">
            {selectedPlan === "yearly" ? PLUS_PRICING.yearlyLabel : PLUS_PRICING.monthlyLabel}
          </p>
          <p className="mkt-note" style={{ marginTop: -8, marginBottom: 12 }}>
            {selectedPlan === "yearly" ? t("plusPriceYearlyNote") : t("plusTrialThen")}
          </p>
          <ul className="mkt-checklist">
            {plusItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <button
            type="button"
            className="mkt-btn mkt-btn-primary"
            style={{ width: "100%" }}
            disabled={loading}
            onClick={() => void startCheckout(selectedPlan)}
          >
            {ctaLabel}
          </button>
          {error ? (
            <p className="mkt-error" role="alert">
              {error}
            </p>
          ) : null}
          <p className="mkt-note">{t("plusCtaNote")}</p>
        </article>
      </section>
    </main>
  );
}
