import { Link } from "react-router-dom";
import {
  ArrowDownUp, Gift, Globe2, PiggyBank, Receipt, Sparkles, Wallet,
} from "lucide-react";
import { useTranslation } from "../../lib/i18n";
import { organizationJsonLd, useDocumentMeta, websiteJsonLd } from "../../lib/seo";

export function HomePublic() {
  const t = useTranslation();
  useDocumentMeta({
    title: t("seoHomeTitle"),
    description: t("seoHomeDescription"),
    path: "/",
    jsonLd: [websiteJsonLd(), organizationJsonLd()],
  });

  const pillars = [
    { icon: <Wallet size={22} />, title: t("homePillarTrackTitle"), body: t("homePillarTrackBody") },
    { icon: <Receipt size={22} />, title: t("homePillarReceiptsTitle"), body: t("homePillarReceiptsBody") },
    { icon: <PiggyBank size={22} />, title: t("homePillarGoalsTitle"), body: t("homePillarGoalsBody") },
    { icon: <Gift size={22} />, title: t("homePillarWishlistTitle"), body: t("homePillarWishlistBody") },
    { icon: <Globe2 size={22} />, title: t("homePillarLocaleTitle"), body: t("homePillarLocaleBody") },
    { icon: <Sparkles size={22} />, title: t("homePillarPlusTitle"), body: t("homePillarPlusBody") },
  ];

  return (
    <main className="marketing-main">
      <section className="marketing-hero panel">
        <p className="eyebrow accent-green">{t("homeHeroEyebrow")}</p>
        <h1>{t("homeHeroTitle")}</h1>
        <p className="marketing-lead">{t("homeHeroBody")}</p>
        <div className="marketing-cta-row">
          <Link to="/signup" className="primary-button">{t("navGetStarted")}</Link>
          <Link to="/login" className="secondary-button">{t("navSignIn")}</Link>
          <Link to="/plus" className="text-button">{t("navExplorePlus")}</Link>
        </div>
      </section>

      <section className="marketing-section" aria-label={t("homeWhatTitle")}>
        <h2>{t("homeWhatTitle")}</h2>
        <p className="marketing-section-lead">{t("homeWhatBody")}</p>
        <div className="marketing-feature-grid">
          {pillars.map((item) => (
            <article key={item.title} className="panel marketing-card">
              <span className="marketing-card-icon" aria-hidden="true">{item.icon}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel marketing-plus-banner">
        <div>
          <p className="eyebrow accent-green">Montra Plus</p>
          <h2>{t("homePlusBannerTitle")}</h2>
          <p>{t("homePlusBannerBody")}</p>
        </div>
        <div className="marketing-cta-row">
          <Link to="/pricing" className="primary-button">{t("navPricing")}</Link>
          <Link to="/plus" className="secondary-button">{t("navExplorePlus")}</Link>
        </div>
      </section>

      <section className="marketing-section">
        <div className="panel marketing-activity-preview">
          <span className="marketing-card-icon" aria-hidden="true"><ArrowDownUp size={22} /></span>
          <h2>{t("homeActivityTitle")}</h2>
          <p>{t("homeActivityBody")}</p>
          <Link to="/features" className="text-button">{t("navFeatures")}</Link>
        </div>
      </section>
    </main>
  );
}
