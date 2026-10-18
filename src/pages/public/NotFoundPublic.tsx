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
      <section className="mkt-simple">
        <p className="mkt-eyebrow">404</p>
        <h1>{t("notFoundTitle") !== "\u2014" ? t("notFoundTitle") : "Page not found"}</h1>
        <p className="mkt-lead">
          {t("notFoundBody") !== "\u2014"
            ? t("notFoundBody")
            : "That address is not a public Montra page. Try the home page or use the links below."}
        </p>
        <div className="mkt-cta-row" style={{ marginTop: 20 }}>
          <Link to="/" className="mkt-btn mkt-btn-primary">
            {t("publicWishlistHome") !== "\u2014" ? t("publicWishlistHome") : "Go to Montra"}
          </Link>
          <Link to="/contact" className="mkt-btn mkt-btn-secondary">
            {t("navContact")}
          </Link>
        </div>
      </section>
    </main>
  );
}
