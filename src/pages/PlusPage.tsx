import {
  ArrowLeft, BarChart3, Check, Lightbulb, Lock, Palette, PiggyBank, Sparkles, Target, TrendingUp,
} from "lucide-react";
import { useLanguage, useTranslation } from "../lib/i18n";
import { fillMissingCopy } from "../lib/missingCopy";

interface PlusPageProps {
  hasPlus: boolean;
  onBack: () => void;
  onOpenAnalytics?: () => void;
  onOpenSavings?: () => void;
}

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
  plusFeaturePersonalizeBody: "Theme, language and display currency already adapt to you. Plus keeps expanding personal tools that fit the existing Montra design.",
  plusPricingTitle: "Pricing",
  plusPricingBody: "Simple pricing. Payment integration comes next — this screen is ready for it.",
  plusPriceMonthly: "79 NOK",
  plusPriceMonthlyLabel: "per month",
  plusPriceYearly: "790 NOK",
  plusPriceYearlyLabel: "per year",
  plusPriceYearlyNote: "Save two months vs monthly",
  plusIncluded: "Included with Plus",
  plusIncluded1: "Advanced analytics & category insights",
  plusIncluded2: "Goal planning & progress projections",
  plusIncluded3: "Month forecast & savings outlook",
  plusIncluded4: "Priority access to new Plus tools",
  plusCtaActive: "You're on Montra Plus",
  plusCtaLocked: "Get Montra Plus",
  plusCtaNote: "Payments are not enabled yet. When billing ships, this is where you'll upgrade. Test accounts already unlock Plus features.",
  plusOpenAnalytics: "Open analytics",
  plusOpenGoals: "Open savings goals",
  plusBack: "Back",
  plusFreeTitle: "What you already have for free",
  plusFree1: "Track income & spending",
  plusFree2: "Receipts with capture",
  plusFree3: "Savings goals & wishlist",
  plusFree4: "Multi-language & display currency",
};

export function PlusPage({ hasPlus, onBack, onOpenAnalytics, onOpenSavings }: PlusPageProps) {
  const translate = useTranslation();
  const { language } = useLanguage();
  const t = (key: string, values?: Record<string, string | number>) => {
    let value = fillMissingCopy(key, translate(key, values), language);
    if (value === "\u2014") value = PLUS_FALLBACK[key] ?? key;
    if (values) {
      value = value.replace(/\{(\w+)\}/g, (m, n) => Object.hasOwn(values, n) ? String(values[n]) : m);
    }
    return value;
  };

  const features = [
    { icon: <BarChart3 size={22} />, title: t("plusFeatureUnderstand"), body: t("plusFeatureUnderstandBody") },
    { icon: <Target size={22} />, title: t("plusFeaturePlan"), body: t("plusFeaturePlanBody") },
    { icon: <TrendingUp size={22} />, title: t("plusFeaturePredict"), body: t("plusFeaturePredictBody") },
    { icon: <Palette size={22} />, title: t("plusFeaturePersonalize"), body: t("plusFeaturePersonalizeBody") },
  ];
  const included = [t("plusIncluded1"), t("plusIncluded2"), t("plusIncluded3"), t("plusIncluded4")];
  const freeItems = [t("plusFree1"), t("plusFree2"), t("plusFree3"), t("plusFree4")];

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
      <section className="panel plus-pricing" aria-label={t("plusPricingTitle")}>
        <div className="plus-pricing-header">
          <Lightbulb size={18} aria-hidden="true" />
          <h2>{t("plusPricingTitle")}</h2>
        </div>
        <p className="plus-pricing-body">{t("plusPricingBody")}</p>
        <div className="plus-price-cards">
          <article className="plus-price-card">
            <strong className="plus-price-amount">{t("plusPriceMonthly")}</strong>
            <span className="plus-price-label">{t("plusPriceMonthlyLabel")}</span>
          </article>
          <article className="plus-price-card is-featured">
            <strong className="plus-price-amount">{t("plusPriceYearly")}</strong>
            <span className="plus-price-label">{t("plusPriceYearlyLabel")}</span>
            <span className="plus-price-note">{t("plusPriceYearlyNote")}</span>
          </article>
        </div>
        <p className="eyebrow plus-included-label">{t("plusIncluded")}</p>
        <ul className="plus-checklist">
          {included.map((item) => (
            <li key={item}><Check size={16} aria-hidden="true" /><span>{item}</span></li>
          ))}
        </ul>
        <button type="button" className={`primary-button plus-cta ${hasPlus ? "is-active" : ""}`} disabled={hasPlus} onClick={() => {}}>
          {hasPlus ? (<><Sparkles size={16} /> {t("plusCtaActive")}</>) : (<><Lock size={16} /> {t("plusCtaLocked")}</>)}
        </button>
        <p className="plus-cta-note">{t("plusCtaNote")}</p>
      </section>
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
        </section>
      )}
    </main>
  );
}
