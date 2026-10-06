import { useEffect } from "react";

const SITE = "https://montra.cash";
/** Real existing branding asset for social previews. */
const DEFAULT_OG_IMAGE = `${SITE}/icons/icon-512.png`;

function ensureMeta(selector: string, attr: string, value: string) {
  let el = document.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    if (selector.startsWith('meta[name="')) {
      el.setAttribute("name", selector.slice(10, -2));
    } else if (selector.startsWith('meta[property="')) {
      el.setAttribute("property", selector.slice(14, -2));
    }
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

function ensureCanonical(url: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = url;
}

function ensureJsonLd(id: string, data: Record<string, unknown> | Record<string, unknown>[]) {
  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

export function absoluteUrl(path = "/"): string {
  if (!path || path === "/") return SITE;
  return `${SITE}${path.startsWith("/") ? path : `/${path}`}`;
}

export function useDocumentMeta(options: {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
  /** Optional absolute or site-relative image for OG/Twitter. */
  image?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}) {
  useEffect(() => {
    const title = options.title.includes("Montra") ? options.title : `${options.title} · Montra`;
    document.title = title;

    const description = options.description || "";
    const path = options.path ?? "/";
    const url = absoluteUrl(path);
    const image =
      options.image && options.image.startsWith("http")
        ? options.image
        : options.image
          ? absoluteUrl(options.image)
          : DEFAULT_OG_IMAGE;

    ensureMeta('meta[name="description"]', "content", description);
    ensureMeta('meta[name="robots"]', "content", options.noIndex ? "noindex, nofollow" : "index, follow");

    // Open Graph
    ensureMeta('meta[property="og:title"]', "content", title);
    ensureMeta('meta[property="og:description"]', "content", description);
    ensureMeta('meta[property="og:type"]', "content", "website");
    ensureMeta('meta[property="og:url"]', "content", url);
    ensureMeta('meta[property="og:site_name"]', "content", "Montra");
    ensureMeta('meta[property="og:image"]', "content", image);

    // Twitter / X
    ensureMeta('meta[name="twitter:card"]', "content", "summary");
    ensureMeta('meta[name="twitter:title"]', "content", title);
    ensureMeta('meta[name="twitter:description"]', "content", description);
    ensureMeta('meta[name="twitter:image"]', "content", image);

    if (options.path !== undefined) {
      ensureCanonical(url);
    }

    if (options.jsonLd) {
      const payload = Array.isArray(options.jsonLd) ? options.jsonLd : [options.jsonLd];
      ensureJsonLd("montra-jsonld", payload.length === 1 ? payload[0] : payload);
    }
  }, [options.title, options.description, options.path, options.noIndex, options.image, options.jsonLd]);
}

/** Site-level structured data for the public homepage. */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Montra",
    url: SITE,
    description:
      "Personal money journal for tracking spending, receipts, savings goals and wishlists.",
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Montra",
    url: SITE,
    logo: `${SITE}/icons/icon-512.png`,
    email: "contact@montra.cash",
  };
}
