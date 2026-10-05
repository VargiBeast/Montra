import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Check, ExternalLink, Gift } from "lucide-react";
import { supabase } from "../../lib/supabase";
import {
  fetchPublicWishlist,
  type PublicWishlistItem,
} from "../../services/wishlistShares";
import { formatMoney } from "../../lib/utils";
import { useLanguage, useTranslation } from "../../lib/i18n";
import { useDocumentMeta } from "../../lib/seo";

type LoadState =
  | { status: "loading" }
  | { status: "error"; kind: "invalid" | "disabled" | "empty" | "network" }
  | { status: "ok"; title: string; items: PublicWishlistItem[] };

function classifyError(message: string): LoadState {
  const m = message.toLowerCase();
  if (m.includes("disabled") || m.includes("not enabled")) {
    return { status: "error", kind: "disabled" };
  }
  // Edge Function failures for bad/unknown tokens often surface as generic
  // "non-2xx" / FunctionsHttpError messages without the word "token".
  if (
    m.includes("invalid") ||
    m.includes("not found") ||
    m.includes("missing") ||
    m.includes("404") ||
    m.includes("token") ||
    m.includes("non-2xx") ||
    m.includes("edge function") ||
    m.includes("functionshttp") ||
    m.includes("shareunavailable")
  ) {
    return { status: "error", kind: "invalid" };
  }
  return { status: "error", kind: "network" };
}

export function PublicWishlistPage() {
  const { token } = useParams<{ token: string }>();
  const t = useTranslation();
  const { language } = useLanguage();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useDocumentMeta({
    title: t("publicWishlistSeoTitle") !== "\u2014"
      ? t("publicWishlistSeoTitle")
      : "Shared wishlist · Montra",
    description:
      t("publicWishlistSeoDescription") !== "\u2014"
        ? t("publicWishlistSeoDescription")
        : "A shared Montra wishlist.",
    path: token ? `/wishlist/${token}` : "/wishlist",
    noIndex: true,
  });

  useEffect(() => {
    let cancelled = false;
    const trimmed = token?.trim() ?? "";
    if (!trimmed || !supabase) {
      setState({ status: "error", kind: "invalid" });
      return;
    }

    setState({ status: "loading" });
    void (async () => {
      try {
        const payload = await fetchPublicWishlist(supabase, trimmed);
        if (cancelled) return;
        if (!payload.items.length) {
          setState({ status: "error", kind: "empty" });
          return;
        }
        setState({
          status: "ok",
          title:
            payload.title ||
            (t("publicWishlistTitle") !== "\u2014"
              ? t("publicWishlistTitle")
              : "Wishlist"),
          items: payload.items,
        });
      } catch (reason) {
        if (cancelled) return;
        const msg = reason instanceof Error ? reason.message : "network";
        setState(classifyError(msg));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, t]);

  return (
    <main className="marketing-main public-wishlist-page">
      <section className="panel marketing-hero public-wishlist-hero">
        <p className="eyebrow">
          {t("publicWishlistEyebrow") !== "\u2014" ? t("publicWishlistEyebrow") : "Montra"}
        </p>
        <h1>
          {state.status === "ok"
            ? state.title
            : t("publicWishlistTitle") !== "\u2014"
              ? t("publicWishlistTitle")
              : "Wishlist"}
        </h1>
        <p className="marketing-lead">
          {t("publicWishlistLead") !== "\u2014"
            ? t("publicWishlistLead")
            : "Items someone wanted to share with you."}
        </p>
      </section>

      {state.status === "loading" && (
        <div className="panel loading-block" role="status">
          {t("loading") !== "\u2014" ? t("loading") : "Loading…"}
        </div>
      )}

      {state.status === "error" && (
        <section className="panel section-panel">
          <div className="empty-state">
            <span className="empty-art">
              <Gift size={22} />
            </span>
            <h3>
              {state.kind === "empty"
                ? t("publicWishlistEmptyTitle") !== "\u2014"
                  ? t("publicWishlistEmptyTitle")
                  : "This wishlist is empty"
                : state.kind === "disabled"
                  ? t("publicWishlistDisabledTitle") !== "\u2014"
                    ? t("publicWishlistDisabledTitle")
                    : "Sharing is turned off"
                  : state.kind === "invalid"
                    ? t("publicWishlistInvalidTitle") !== "\u2014"
                      ? t("publicWishlistInvalidTitle")
                      : "This link is not available"
                    : t("publicWishlistErrorTitle") !== "\u2014"
                      ? t("publicWishlistErrorTitle")
                      : "Could not load this wishlist"}
            </h3>
            <p>
              {state.kind === "empty"
                ? t("publicWishlistEmptyBody") !== "\u2014"
                  ? t("publicWishlistEmptyBody")
                  : "There are no items to show right now."
                : state.kind === "disabled"
                  ? t("publicWishlistDisabledBody") !== "\u2014"
                    ? t("publicWishlistDisabledBody")
                    : "The owner has disabled this share link."
                  : state.kind === "invalid"
                    ? t("publicWishlistInvalidBody") !== "\u2014"
                      ? t("publicWishlistInvalidBody")
                      : "The link may be incorrect or no longer valid."
                    : t("publicWishlistErrorBody") !== "\u2014"
                      ? t("publicWishlistErrorBody")
                      : "Please try again later."}
            </p>
            <Link to="/" className="primary-button">
              {t("publicWishlistHome") !== "\u2014" ? t("publicWishlistHome") : "Go to Montra"}
            </Link>
          </div>
        </section>
      )}

      {state.status === "ok" && (
        <div className="wishlist-grid public-wishlist-grid">
          {state.items.map((item, index) => (
            <PublicWishlistCard key={`${item.name}-${index}`} item={item} language={language} t={t} />
          ))}
        </div>
      )}
    </main>
  );
}

function PublicWishlistCard({
  item,
  language,
  t,
}: {
  item: PublicWishlistItem;
  language: string;
  t: (key: string) => string;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const priceLabel = formatMoney(item.price, item.currency || "NOK", language, item.price);
  const purchasedLabel =
    t("wishlistPurchased") !== "\u2014" ? t("wishlistPurchased") : "Purchased";
  const openLabel =
    t("wishlistOpenProduct") !== "\u2014" ? t("wishlistOpenProduct") : "Open product";

  return (
    <article className={`panel wishlist-card ${item.purchased ? "is-purchased" : ""}`}>
      <div className="wishlist-card-media">
        {item.image_url && !imgFailed ? (
          <img
            src={item.image_url}
            alt={item.name}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="wishlist-img-placeholder">
            <Gift size={22} />
          </div>
        )}
        {item.purchased && (
          <span className="wishlist-purchased-badge">
            <Check size={12} /> {purchasedLabel}
          </span>
        )}
      </div>
      <div className="wishlist-card-body">
        <div className="wishlist-card-top">
          <strong className={`wishlist-card-name ${item.purchased ? "is-purchased" : ""}`}>
            {item.name}
          </strong>
          <strong className="wishlist-card-price">{priceLabel}</strong>
        </div>
        {item.details && <p className="wishlist-card-details">{item.details}</p>}
        {item.url ? (
          <div className="wishlist-card-actions">
            <a
              className="text-button wishlist-link-btn"
              href={item.url}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={14} /> {openLabel}
            </a>
          </div>
        ) : null}
      </div>
    </article>
  );
}
