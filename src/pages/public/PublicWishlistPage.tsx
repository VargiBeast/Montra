import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Check, ExternalLink, Gift } from "lucide-react";
import { supabase } from "../../lib/supabase";
import {
  fetchPublicWishlist,
  type PublicWishlistItem,
} from "../../services/wishlistShares";
import { formatMoney, safeExternalHref } from "../../lib/utils";
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
  if (
    m.includes("invalid") ||
    m.includes("share link") ||
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
    title:
      t("publicWishlistSeoTitle") !== "\u2014"
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
            (t("publicWishlistTitle") !== "\u2014" ? t("publicWishlistTitle") : "Wishlist"),
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

  const homeLabel =
    t("publicWishlistHome") !== "\u2014" ? t("publicWishlistHome") : "Go to Montra";

  return (
    <main className="marketing-main">
      <section className="mkt-hero">
        <div className="mkt-hero-glow" aria-hidden />
        <p className="mkt-eyebrow">
          {t("publicWishlistEyebrow") !== "\u2014" ? t("publicWishlistEyebrow") : "Montra"}
        </p>
        <h1>
          {state.status === "ok"
            ? state.title
            : t("publicWishlistTitle") !== "\u2014"
              ? t("publicWishlistTitle")
              : "Wishlist"}
        </h1>
        <p className="mkt-lead">
          {t("publicWishlistLead") !== "\u2014"
            ? t("publicWishlistLead")
            : "Items someone wanted to share with you."}
        </p>
      </section>

      {state.status === "loading" && (
        <div className="mkt-card" role="status">
          {t("loading") !== "\u2014" ? t("loading") : "Loading…"}
        </div>
      )}

      {state.status === "error" && (
        <section className="mkt-card" style={{ textAlign: "center", padding: 32 }}>
          <Gift size={28} style={{ margin: "0 auto 12px", color: "#10b981" }} />
          <h3 style={{ margin: "0 0 8px" }}>
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
          <p className="mkt-lead" style={{ marginInline: "auto" }}>
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
                    : "This share link is invalid or expired."
                  : t("publicWishlistErrorBody") !== "\u2014"
                    ? t("publicWishlistErrorBody")
                    : "Check your connection and try again later."}
          </p>
          <Link to="/" className="mkt-btn mkt-btn-primary" style={{ marginTop: 16 }}>
            {homeLabel}
          </Link>
        </section>
      )}

      {state.status === "ok" && (
        <div className="mkt-grid">
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
  const href = safeExternalHref(item.url);

  return (
    <article className="mkt-card" style={{ opacity: item.purchased ? 0.7 : 1 }}>
      <div
        style={{
          height: 140,
          borderRadius: 12,
          marginBottom: 12,
          background: "rgba(16,185,129,0.08)",
          display: "grid",
          placeItems: "center",
          overflow: "hidden",
        }}
      >
        {item.image_url && !imgFailed ? (
          <img
            src={item.image_url}
            alt={item.name}
            onError={() => setImgFailed(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <Gift size={28} color="#10b981" />
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <strong
          style={{
            fontSize: 15,
            textDecoration: item.purchased ? "line-through" : undefined,
          }}
        >
          {item.name}
        </strong>
        <strong style={{ whiteSpace: "nowrap" }}>{priceLabel}</strong>
      </div>
      {item.purchased ? (
        <p style={{ margin: "6px 0 0", fontSize: 12, color: "#10b981" }}>
          <Check size={12} style={{ display: "inline", verticalAlign: "-2px" }} /> {purchasedLabel}
        </p>
      ) : null}
      {item.details ? (
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "#9fb3a6" }}>{item.details}</p>
      ) : null}
      {href ? (
        <a
          className="mkt-btn mkt-btn-ghost"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginTop: 12, padding: "8px 0" }}
        >
          <ExternalLink size={14} /> {openLabel}
        </a>
      ) : null}
    </article>
  );
}
