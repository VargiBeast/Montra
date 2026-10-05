import { useEffect } from "react";

const SITE = "https://montra.cash";

export function useDocumentMeta(options: {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
}) {
  useEffect(() => {
    const title = options.title.includes("Montra") ? options.title : `${options.title} · Montra`;
    document.title = title;

    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        if (selector.startsWith('meta[name=')) {
          el.setAttribute("name", selector.slice(10, -2));
        } else if (selector.startsWith('meta[property=')) {
          el.setAttribute("property", selector.slice(14, -2));
        }
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    setMeta('meta[name="description"]', "content", options.description);
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", options.description);
    setMeta('meta[property="og:type"]', "content", "website");
    if (options.path) {
      const url = `${SITE}${options.path === "/" ? "" : options.path}`;
      setMeta('meta[property="og:url"]', "content", url);
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = url;
    }
    setMeta('meta[name="robots"]', "content", options.noIndex ? "noindex, nofollow" : "index, follow");
  }, [options.title, options.description, options.path, options.noIndex]);
}
