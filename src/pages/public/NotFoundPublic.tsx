import { Link } from "react-router-dom";
import { useTranslation } from "../../lib/i18n";
import { useDocumentMeta } from "../../lib/seo";

export function NotFoundPublic() {
  const t = useTranslation();
  useDocumentMeta({
    title: t("seoNotFoundTitle") !== "\u2014" ? t("seoNotFoundTitle") : "Page not found · Montra",
    description:
      t("seoNotFoundDescription") !== "\u2014"
        ? t("seoNotFoundDescription")
        : "This page does not exist on Montra.",
    path: undefined,
    noIndex: true,
  });

  return (
    <main className="marketing-main">
      <section className="panel marketing-simple">
        <p className="eyebrow">404</p>
        <h1>{t("notFoundTitle") !== "\u2014" ? t("notFoundTitle") : "Page not found"}</h1>
        <p className="marketing-lead">
          {t("notFoundBody") !== "\u2014"
            ? t("notFoundBody")
            : "That address is not a public Montra page. Try the home page or use the links below."}
        </p>
        <div className="marketing-cta-row">
          <Link to="/" className="primary-button">
            {t("publicWishlistHome") !== "\u2014" ? t("publicWishlistHome") : "Go to Montra"}
          </Link>
          <Link to="/contact" className="secondary-button">
            {t("navContact")}
          </Link>
        </div>
      </section>
    </main>
  );
}
