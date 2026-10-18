import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { languageForCopy, useLanguage, useTranslation } from "../../lib/i18n";
import { useDocumentMeta } from "../../lib/seo";
import { PLUS_PRICING } from "../../lib/plus";
import { plusCheckoutCopy } from "../../lib/plusCheckoutCopy";
import { trackEvent } from "../../lib/gtm";
import { useAuth } from "../../hooks/useAuth";
import { usePlusEntitlement } from "../../hooks/usePlusEntitlement";
import { useStripePortal } from "../../hooks/useStripePortal";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";

type Plan = "monthly" | "yearly";

/**
 * Public marketing page for Montra Plus at montra.cash/plus.
 * Visual system matches HomePublic / PricingPublic (marketing-v2).
 */
export function PlusPublic() {
  const translate = useTranslation();
  const { language } = useLanguage();
  const auth = useAuth();
  const plus = usePlusEntitlement(auth.user?.id);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<Plan>("yearly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<"success" | "cancelled" | null>(null);

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

  const { openPortal, portalLoading, portalError } = useStripePortal(auth.user, t);

  useDocumentMeta({
    title: t("seoPlusTitle"),
    description: t("seoPlusDescription"),
    path: "/plus",
  });

  useEffect(() => {
    if (portalError) setError(portalError);
  }, [portalError]);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      setStatusMsg("success");
      const next = new URLSearchParams(searchParams);
      next.delete("checkout");
      setSearchParams(next, { replace: true });
      void plus.refresh();
    } else if (checkout === "cancelled") {
      setStatusMsg("cancelled");
      const next = new URLSearchParams(searchParams);
      next.delete("checkout");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, plus]);

  const plusItems = [t("plusIncluded1"), t("plusIncluded2"), t("plusIncluded3"), t("plusIncluded4")];

  const startCheckout = useCallback(
    async (plan: Plan) => {
      if (loading) return;
      setError(null);
      setSelectedPlan(plan);
      trackEvent("upgrade_clicked", { surface: "plus_public" });

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
          body: { plan },
        });

        if (invokeError) {
          console.error("create-stripe-checkout", invokeError);
          setError(t("plusCheckoutError"));
          setLoading(false);
          return;
        }

        const url = (data as { url?: string } | null)?.url;
        if (typeof url === "string" && url.startsWith("https://")) {
          window.location.href = url;
          return;
        }

        setError(t("plusCheckoutError"));
        setLoading(false);
      } catch (err) {
        console.error(err);
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
        <p className="mkt-eyebrow">{t("navPlus")}</p>
        <h1>{t("plusHeroTitle") !== "—" ? t("plusHeroTitle") : t("homePillarPlusTitle")}</h1>
        <p className="mkt-lead">
          {t("plusHeroBody") !== "—" ? t("plusHeroBody") : t("homePillarPlusBody")}
        </p>
        <div className="mkt-cta-row">
          <Link to="/pricing" className="mkt-btn mkt-btn-secondary">
            {t("navPricing")}
          </Link>
          <Link to="/features" className="mkt-btn mkt-btn-ghost">
            {t("navFeatures")}
          </Link>
        </div>
      </section>

      {statusMsg === "success" && !plus.hasPlus ? (
        <div className="mkt-card" style={{ marginBottom: 16, borderColor: "rgba(52,211,153,0.35)" }}>
          <p style={{ margin: 0, color: "#34d399", fontSize: 14 }}>
            {t("plusCheckoutSuccessPending") !== "—"
              ? t("plusCheckoutSuccessPending")
              : "Payment received. Plus unlocks when the server confirms your entitlement."}
          </p>
        </div>
      ) : null}
      {statusMsg === "cancelled" ? (
        <div className="mkt-card" style={{ marginBottom: 16 }}>
          <p style={{ margin: 0, color: "#9fb3a6", fontSize: 14 }}>
            {t("plusCheckoutCancelled") !== "—" ? t("plusCheckoutCancelled") : "Checkout cancelled."}
          </p>
        </div>
      ) : null}

      <section className="mkt-price-grid">
        <article className="mkt-price-card is-featured">
          <p className="mkt-eyebrow">{t("plusComparePlus")}</p>
          <h2>{t("plusComparePlus")}</h2>

          {plus.hasPlus ? (
            <>
              <p className="mkt-price-amount" style={{ color: "#e8c547" }}>
                Active
              </p>
              <p className="mkt-note" style={{ marginBottom: 16 }}>
                {t("plusActiveBody") !== "—"
                  ? t("plusActiveBody")
                  : "Manage billing in the Stripe customer portal."}
              </p>
              <button
                type="button"
                className="mkt-btn mkt-btn-primary"
                style={{ width: "100%" }}
                disabled={portalLoading}
                onClick={() => void openPortal()}
              >
                {portalLoading ? t("plusCtaLoading") : t("plusManageBilling") !== "—" ? t("plusManageBilling") : "Manage subscription"}
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
        </article>

        <article className="mkt-price-card">
          <p className="mkt-eyebrow">{t("navFeatures")}</p>
          <h2>{t("homeWhatTitle")}</h2>
          <p style={{ margin: "0 0 16px", fontSize: 14, color: "#9fb3a6", lineHeight: 1.55 }}>
            {t("homeWhatBody")}
          </p>
          <ul className="mkt-checklist">
            <li>{t("plusFree1")}</li>
            <li>{t("plusFree2")}</li>
            <li>{t("plusFree3")}</li>
            <li>{t("plusFree4")}</li>
          </ul>
          <Link to="/app" className="mkt-btn mkt-btn-secondary" style={{ width: "100%", boxSizing: "border-box" }}>
            {t("navGetStarted")}
          </Link>
        </article>
      </section>

      <section className="mkt-banner" style={{ marginTop: 8 }}>
        <div>
          <h2>{t("navPricing")}</h2>
          <p>{t("pricingHeroBody")}</p>
        </div>
        <Link to="/pricing" className="mkt-btn mkt-btn-primary">
          {t("navPricing")}
        </Link>
      </section>
    </main>
  );
}
