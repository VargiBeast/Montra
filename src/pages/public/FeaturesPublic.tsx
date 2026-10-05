import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { useTranslation } from "../../lib/i18n";
import { useDocumentMeta } from "../../lib/seo";

export function FeaturesPublic() {
  const t = useTranslation();
  useDocumentMeta({
    title: t("seoFeaturesTitle"),
    description: t("seoFeaturesDescription"),
    path: "/features",
  });

  const items = [
    { title: t("homePillarTrackTitle"), body: t("homePillarTrackBody") },
    { title: t("homePillarReceiptsTitle"), body: t("homePillarReceiptsBody") },
    { title: t("homePillarGoalsTitle"), body: t("homePillarGoalsBody") },
    { title: t("homePillarWishlistTitle"), body: t("homePillarWishlistBody") },
    { title: t("homePillarLocaleTitle"), body: t("homePillarLocaleBody") },
    { title: t("homePillarPlusTitle"), body: t("homePillarPlusBody") },
  ];

  return (
    <main className="marketing-main">
      <section className="marketing-hero panel">
        <p className="eyebrow accent-green">{t("navFeatures")}</p>
        <h1>{t("featuresHeroTitle")}</h1>
        <p className="marketing-lead">{t("featuresHeroBody")}</p>
        <div className="marketing-cta-row">
          <Link to="/app" className="primary-button">{t("navGetStarted")}</Link>
          <Link to="/pricing" className="secondary-button">{t("navPricing")}</Link>
        </div>
      </section>

      <section className="marketing-section">
        <div className="marketing-feature-grid">
          {items.map((item) => (
            <article key={item.title} className="panel marketing-card">
              <span className="marketing-card-icon" aria-hidden="true"><Check size={18} /></span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
