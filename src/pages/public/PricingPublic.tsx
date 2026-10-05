import { Link } from "react-router-dom";
import { Check, Sparkles } from "lucide-react";
import { useTranslation } from "../../lib/i18n";
import { useDocumentMeta } from "../../lib/seo";
import { PLUS_PRICING } from "../../lib/plus";

export function PricingPublic() {
  const t = useTranslation();
  useDocumentMeta({
    title: t("seoPricingTitle"),
    description: t("seoPricingDescription"),
    path: "/pricing",
  });

  const freeItems = [t("plusFree1"), t("plusFree2"), t("plusFree3"), t("plusFree4")];
  const plusItems = [t("plusIncluded1"), t("plusIncluded2"), t("plusIncluded3"), t("plusIncluded4")];

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
              <li key={item}><Check size={16} aria-hidden="true" /><span>{item}</span></li>
            ))}
          </ul>
          <Link to="/signup" className="secondary-button wide">{t("navGetStarted")}</Link>
        </article>

        <article className="panel pricing-plan-card is-featured">
          <p className="eyebrow accent-green">Montra Plus</p>
          <h2>{t("plusComparePlus")}</h2>
          <div className="plus-trial-banner" role="status">
            <span className="plus-trial-badge">{t("plusTrialBadge")}</span>
            <span className="plus-trial-then">{t("plusTrialThen")}</span>
          </div>
          <div className="plus-price-cards">
            <div className="plus-price-card">
              <strong className="plus-price-amount">{PLUS_PRICING.monthlyLabel}</strong>
              <span className="plus-price-label">{t("plusPriceMonthlyLabel")}</span>
            </div>
            <div className="plus-price-card is-featured">
              <strong className="plus-price-amount">{PLUS_PRICING.yearlyLabel}</strong>
              <span className="plus-price-label">{t("plusPriceYearlyLabel")}</span>
              <span className="plus-price-note">
                {t("plusPriceYearlyNote") !== "\u2014" && t("plusPriceYearlyNote") !== "plusPriceYearlyNote"
                  ? t("plusPriceYearlyNote")
                  : PLUS_PRICING.yearlySavingsNoteEn}
              </span>
            </div>
          </div>
          <ul className="plus-checklist">
            {plusItems.map((item) => (
              <li key={item}><Check size={16} aria-hidden="true" /><span>{item}</span></li>
            ))}
          </ul>
          <Link to="/signup" className="primary-button wide">
            <Sparkles size={16} /> {t("plusCtaLocked")}
          </Link>
          <p className="plus-cta-note">{t("plusCtaNote")}</p>
        </article>
      </section>
    </main>
  );
}
