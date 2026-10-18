import { Link } from "react-router-dom";
import {
  ArrowDownUp,
  Gift,
  Globe2,
  Home,
  PiggyBank,
  Receipt,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useTranslation } from "../../lib/i18n";
import { useDocumentMeta } from "../../lib/seo";

export function FeaturesPublic() {
  const t = useTranslation();
  useDocumentMeta({
    title: t("seoFeaturesTitle"),
    description: t("seoFeaturesDescription"),
    path: "/features",
  });

  const features = [
    { icon: <Home size={22} />, title: t("featHomeTitle"), body: t("featHomeBody") },
    { icon: <ArrowDownUp size={22} />, title: t("featActivityTitle"), body: t("featActivityBody") },
    { icon: <Wallet size={22} />, title: t("featTransactionsTitle"), body: t("featTransactionsBody") },
    { icon: <Receipt size={22} />, title: t("featReceiptsTitle"), body: t("featReceiptsBody") },
    { icon: <PiggyBank size={22} />, title: t("featGoalsTitle"), body: t("featGoalsBody") },
    { icon: <Gift size={22} />, title: t("featWishlistTitle"), body: t("featWishlistBody") },
    { icon: <Globe2 size={22} />, title: t("featCurrencyTitle"), body: t("featCurrencyBody") },
    { icon: <Globe2 size={22} />, title: t("featLanguagesTitle"), body: t("featLanguagesBody") },
    { icon: <Sparkles size={22} />, title: t("featPlusTitle"), body: t("featPlusBody") },
  ];

  return (
    <main className="marketing-main">
      <section className="mkt-hero">
        <div className="mkt-hero-glow" aria-hidden />
        <p className="mkt-eyebrow">{t("navFeatures")}</p>
        <h1>{t("featuresHeroTitle")}</h1>
        <p className="mkt-lead">{t("featuresHeroBody")}</p>
        <div className="mkt-cta-row">
          <Link to="/app" className="mkt-btn mkt-btn-primary">
            {t("navGetStarted")}
          </Link>
          <Link to="/pricing" className="mkt-btn mkt-btn-secondary">
            {t("navPricing")}
          </Link>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-grid">
          {features.map((f) => (
            <article key={f.title} className="mkt-card">
              <span className="mkt-card-icon" aria-hidden="true">
                {f.icon}
              </span>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
