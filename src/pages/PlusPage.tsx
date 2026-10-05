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
  plusCtaLocked: "Start 7-day free trial",
  plusCtaNote: "Payments are not enabled yet. When billing ships, this is where the trial and subscription start. Test accounts already unlock Plus features.",
  plusCompareTitle: "Free vs Plus",
  plusCompareFree: "Free",
  plusComparePlus: "Plus",
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
    // Pricing amounts and the ~30% savings note must stay exact across all languages.
    // Prefer PLUS_FALLBACK for these keys so a lagging dictionary cannot show old 79/790 NOK.
    const PRICE_KEYS = new Set([
      "plusPriceMonthly",
      "plusPriceYearly",
      "plusPriceYearlyNote",
    ]);
    if (PRICE_KEYS.has(key) && PLUS_FALLBACK[key]) {
      if (key === "plusPriceMonthly" || key === "plusPriceYearly") {
        return PLUS_FALLBACK[key];
      }
      // Yearly savings note: map known outdated dictionary strings to ~30% wording.
      const lookedUp = translate(key, values);
      const NOTE_MAP: Record<string, string> = {
        "Save two months vs monthly": "About 30% off",
        "Spar to måneder mot månedlig": "Omtrent 30 % rabatt",
        "Spara två månader jämfört med månadspris": "Cirka 30 % rabatt",
        "Spar to måneder i forhold til månedlig betaling": "Omkring 30 % rabat",
        "Zwei Monate gegenüber monatlich sparen": "Etwa 30 % sparen",
        "Deux mois économisés par rapport au mensuel": "Environ 30 % d'économie",
        "Ahorra dos meses frente al plan mensual": "Ahorra alrededor del 30 %",
        "Risparmi due mesi rispetto al mensile": "Circa il 30 % di risparmio",
        "Poupa dois meses face ao plano mensal": "Cerca de 30 % de desconto",
        "Bespaar twee maanden tegenover maandelijks": "Ongeveer 30 % korting",
        "Säästä kaksi kuukautta kuukausihintaan verrattuna": "Noin 30 % alennus",
        "Oszczędzasz dwa miesiące względem planu miesięcznego": "Około 30 % taniej",
        "Ušetříš dva měsíce oproti měsíční platbě": "Asi o 30 % levněji",
        "Aylığa göre iki ay kazan": "Yaklaşık %30 tasarruf",
        "وفّر شهرين مقارنة بالشهري": "وفر حوالي 30٪",
        "月額より2か月分お得": "約30%お得",
        "월간 대비 두 달 절약": "약 30% 절약",
        "比月付省两个月": "大约便宜 30%",
      };
      if (lookedUp && NOTE_MAP[lookedUp]) return NOTE_MAP[lookedUp];
      if (lookedUp && lookedUp !== "\u2014" && lookedUp !== key) return lookedUp;
      return PLUS_FALLBACK[key];
    }
    const lookedUp = translate(key, values);
    // Prefer real dictionary copy. Fall back to English PLUS_FALLBACK only when the
    // lookup still yields the missing-copy sentinel or the raw key.
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
        <div className="plus-trial-banner" role="status">
          <span className="plus-trial-badge">{t("plusTrialBadge")}</span>
          <span className="plus-trial-then">{t("plusTrialThen")}</span>
        </div>
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
