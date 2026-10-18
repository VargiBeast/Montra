import { Link } from "react-router-dom";
import {
  ArrowDownUp,
  Gift,
  Globe2,
  PiggyBank,
  Receipt,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useTranslation } from "../../lib/i18n";
import { trackEvent } from "../../lib/gtm";
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
      <section className="mkt-hero">
        <div className="mkt-hero-glow" aria-hidden />
        <p className="mkt-eyebrow">{t("homeHeroEyebrow")}</p>
        <h1>{t("homeHeroTitle")}</h1>
        <p className="mkt-lead">{t("homeHeroBody")}</p>
        <div className="mkt-cta-row">
          <Link
            to="/app"
            className="mkt-btn mkt-btn-primary"
            onClick={() => trackEvent("get_started", { surface: "home" })}
          >
            {t("navGetStarted")}
          </Link>
          <Link to="/login" className="mkt-btn mkt-btn-secondary">
            {t("navSignIn")}
          </Link>
          <Link to="/plus" className="mkt-btn mkt-btn-ghost">
            {t("navExplorePlus")}
          </Link>
        </div>
      </section>

      <section className="mkt-section" aria-label={t("homeWhatTitle")}>
        <h2>{t("homeWhatTitle")}</h2>
        <p className="mkt-section-lead">{t("homeWhatBody")}</p>
        <div className="mkt-grid">
          {pillars.map((item) => (
            <article key={item.title} className="mkt-card">
              <span className="mkt-card-icon" aria-hidden="true">
                {item.icon}
              </span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mkt-banner">
        <div>
          <h2>{t("homePillarPlusTitle")}</h2>
          <p>{t("homePillarPlusBody")}</p>
        </div>
        <div className="mkt-cta-row">
          <Link to="/pricing" className="mkt-btn mkt-btn-primary">
            {t("navPricing")}
          </Link>
          <Link to="/features" className="mkt-btn mkt-btn-secondary">
            {t("navFeatures")}
          </Link>
        </div>
      </section>

      <section className="mkt-section">
        <h2>
          <ArrowDownUp size={18} style={{ display: "inline", verticalAlign: "-3px", marginRight: 8 }} />
          {t("featActivityTitle")}
        </h2>
        <p className="mkt-section-lead">{t("featActivityBody")}</p>
        <Link to="/app" className="mkt-btn mkt-btn-primary" onClick={() => trackEvent("get_started", { surface: "home_activity" })}>
          {t("navGetStarted")}
        </Link>
      </section>
    </main>
  );
}
