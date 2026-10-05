import { Link, NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "../../lib/i18n";

export function MarketingLayout() {
  const t = useTranslation();
  return (
    <div className="marketing-shell">
      <header className="marketing-header">
        <Link to="/" className="brand marketing-brand">
          <span className="brand-mark" aria-hidden="true">
            <img className="mark-light" src="/branding/mark-light.png" alt="" />
            <img className="mark-dark" src="/branding/mark-dark.png" alt="" />
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
          <Link to="/login" className="secondary-button">{t("navSignIn")}</Link>
          <Link to="/signup" className="primary-button">{t("navGetStarted")}</Link>
        </div>
      </header>
      <Outlet />
      <footer className="marketing-footer">
        <div className="marketing-footer-grid">
          <div>
            <strong>MONTRA</strong>
            <p>{t("marketingFooterTagline")}</p>
          </div>
          <div>
            <span className="eyebrow">{t("marketingFooterProduct")}</span>
            <Link to="/features">{t("navFeatures")}</Link>
            <Link to="/plus">{t("navPlus")}</Link>
            <Link to="/pricing">{t("navPricing")}</Link>
          </div>
          <div>
            <span className="eyebrow">{t("marketingFooterCompany")}</span>
            <Link to="/about">{t("navAbout")}</Link>
            <Link to="/contact">{t("navContact")}</Link>
            <Link to="/faq">{t("navFaq")}</Link>
            <Link to="/help">{t("navHelp")}</Link>
          </div>
          <div>
            <span className="eyebrow">{t("marketingFooterLegal")}</span>
            <Link to="/privacy">{t("navPrivacy")}</Link>
            <Link to="/terms">{t("navTerms")}</Link>
            <Link to="/cookies">{t("navCookies")}</Link>
            <Link to="/security">{t("navSecurity")}</Link>
          </div>
        </div>
        <p className="marketing-footer-copy">{t("marketingFooterCopy")}</p>
      </footer>
    </div>
  );
}
