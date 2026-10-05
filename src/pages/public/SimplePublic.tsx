import { Link } from "react-router-dom";
import { useTranslation } from "../../lib/i18n";
import { useDocumentMeta } from "../../lib/seo";

type PageKey =
  | "about" | "contact" | "faq" | "help"
  | "privacy" | "terms" | "cookies" | "security";

const META: Record<PageKey, { titleKey: string; descKey: string; path: string }> = {
  about: { titleKey: "seoAboutTitle", descKey: "seoAboutDescription", path: "/about" },
  contact: { titleKey: "seoContactTitle", descKey: "seoContactDescription", path: "/contact" },
  faq: { titleKey: "seoFaqTitle", descKey: "seoFaqDescription", path: "/faq" },
  help: { titleKey: "seoHelpTitle", descKey: "seoHelpDescription", path: "/help" },
  privacy: { titleKey: "seoPrivacyTitle", descKey: "seoPrivacyDescription", path: "/privacy" },
  terms: { titleKey: "seoTermsTitle", descKey: "seoTermsDescription", path: "/terms" },
  cookies: { titleKey: "seoCookiesTitle", descKey: "seoCookiesDescription", path: "/cookies" },
  security: { titleKey: "seoSecurityTitle", descKey: "seoSecurityDescription", path: "/security" },
};

export function SimplePublic({ page }: { page: PageKey }) {
  const t = useTranslation();
  const meta = META[page];
  useDocumentMeta({
    title: t(meta.titleKey),
    description: t(meta.descKey),
    path: meta.path,
  });

  return (
    <main className="marketing-main">
      <section className="panel marketing-simple">
        <h1>{t(`${page}Title`)}</h1>
        <p className="marketing-lead">{t(`${page}Body`)}</p>
        {page === "contact" && (
          <p>
            <a className="text-button" href="mailto:hello@montra.cash">hello@montra.cash</a>
          </p>
        )}
        {(page === "faq" || page === "help") && (
          <div className="marketing-cta-row">
            <Link to="/contact" className="secondary-button">{t("navContact")}</Link>
            <Link to="/app" className="primary-button">{t("navGetStarted")}</Link>
          </div>
        )}
      </section>
    </main>
  );
}
