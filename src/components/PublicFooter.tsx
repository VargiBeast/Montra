import { Link } from "react-router-dom";
import { useTranslation } from "../lib/i18n";

/**
 * Shared public/marketing footer. Used only inside MarketingLayout
 * so every public page gets the same links without duplication.
 */
export function PublicFooter() {
  const t = useTranslation();
  return (
    <footer className="marketing-footer" role="contentinfo">
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
  );
}
