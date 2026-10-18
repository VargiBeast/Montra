import { Link, NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "../../lib/i18n";
import { PublicFooter } from "../../components/PublicFooter";

/** Shared shell for every public marketing route. */
export function MarketingLayout() {
  const t = useTranslation();
  return (
    <div className="marketing-shell">
      <header className="marketing-header">
        <Link to="/" className="marketing-brand" aria-label="Montra home">
          <span className="brand-mark" aria-hidden="true">
            <img className="mark-dark" src="/branding/mark-dark.png" alt="" />
            <img className="mark-light" src="/branding/mark-light.png" alt="" />
          </span>
          MONTRA
        </Link>
        <nav className="marketing-nav" aria-label={t("mainNavigation")}>
          <NavLink to="/features">{t("navFeatures")}</NavLink>
          <NavLink to="/plus">{t("navPlus")}</NavLink>
          <NavLink to="/pricing">{t("navPricing")}</NavLink>
          <NavLink to="/about">{t("navAbout")}</NavLink>
        </nav>
        <div className="marketing-header-actions">
          <Link to="/login" className="mkt-btn mkt-btn-secondary">
            {t("navSignIn")}
          </Link>
          <Link to="/app" className="mkt-btn mkt-btn-primary">
            {t("navGetStarted")}
          </Link>
        </div>
      </header>

      <div className="marketing-body">
        <Outlet />
      </div>

      <PublicFooter />
    </div>
  );
}
