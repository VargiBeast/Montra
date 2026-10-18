import { useTranslation } from "../../lib/i18n";
import { useDocumentMeta } from "../../lib/seo";

type PageKey =
  | "about"
  | "contact"
  | "faq"
  | "help"
  | "privacy"
  | "terms"
  | "cookies"
  | "security"
  | "refund";

const META: Record<PageKey, { titleKey: string; descKey: string; path: string }> = {
  about: { titleKey: "seoAboutTitle", descKey: "seoAboutDescription", path: "/about" },
  contact: { titleKey: "seoContactTitle", descKey: "seoContactDescription", path: "/contact" },
  faq: { titleKey: "seoFaqTitle", descKey: "seoFaqDescription", path: "/faq" },
  help: { titleKey: "seoHelpTitle", descKey: "seoHelpDescription", path: "/help" },
  privacy: { titleKey: "seoPrivacyTitle", descKey: "seoPrivacyDescription", path: "/privacy" },
  terms: { titleKey: "seoTermsTitle", descKey: "seoTermsDescription", path: "/terms" },
  cookies: { titleKey: "seoCookiesTitle", descKey: "seoCookiesDescription", path: "/cookies" },
  security: { titleKey: "seoSecurityTitle", descKey: "seoSecurityDescription", path: "/security" },
  refund: { titleKey: "seoRefundTitle", descKey: "seoRefundDescription", path: "/refund-policy" },
};

export function SimplePublic({ page }: { page: PageKey }) {
  const t = useTranslation();
  const meta = META[page];
  useDocumentMeta({
    title: t(meta.titleKey),
    description: t(meta.descKey),
    path: meta.path,
  });

  const body = t(`${page}Body`);
  const paragraphs = body
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <main className="marketing-main">
      <section className="mkt-simple">
        <h1>{t(`${page}Title`)}</h1>
        {paragraphs.map((para, i) => (
          <p key={i} className={i === 0 ? "mkt-lead" : undefined}>
            {para}
          </p>
        ))}
        {page === "contact" && (
          <p>
            <a className="mkt-btn mkt-btn-ghost" href="mailto:contact@montra.cash">
              contact@montra.cash
            </a>
          </p>
        )}
      </section>
    </main>
  );
}
