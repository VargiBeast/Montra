import { useEffect, useState } from "react";
import { Copy, Link2, Share2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import {
  ensureShare,
  getOwnShare,
  publicShareUrl,
  setShareEnabled,
  type WishlistShare,
} from "../services/wishlistShares";
import { useTranslation } from "../lib/i18n";

function label(t: (k: string) => string, key: string, fallback: string) {
  const value = t(key);
  return value !== "\u2014" ? value : fallback;
}

export function WishlistSharePanel() {
  const t = useTranslation();
  const auth = useAuth();
  const [share, setShare] = useState<WishlistShare | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userId = auth.user?.id;
    if (!userId || !supabase) {
      setShare(null);
      return;
    }
    let active = true;
    setLoading(true);
    void getOwnShare(supabase, userId)
      .then((row) => {
        if (active) {
          setShare(row);
          setError(null);
        }
      })
      .catch((reason) => {
        console.error("Could not load wishlist share.", reason);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [auth.user?.id]);

  async function createOrEnable() {
    const userId = auth.user?.id;
    if (!userId || !supabase) return;
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const row = await ensureShare(supabase, userId);
      setShare(row);
      setMessage(label(t, "wishlistShareReady", "Share link is ready."));
    } catch (reason) {
      console.error(reason);
      setError(label(t, "wishlistShareError", "Could not create a share link."));
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!share?.token) return;
    try {
      await navigator.clipboard.writeText(publicShareUrl(share.token));
      setMessage(label(t, "wishlistShareCopied", "Link copied."));
      setError(null);
    } catch {
      setError(label(t, "wishlistShareCopyFailed", "Could not copy the link."));
    }
  }

  async function setEnabled(enabled: boolean) {
    const userId = auth.user?.id;
    if (!userId || !supabase || !share) return;
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const row = await setShareEnabled(supabase, userId, share.id, enabled);
      setShare(row);
      setMessage(
        enabled
          ? label(t, "wishlistShareEnabled", "Sharing is on.")
          : label(t, "wishlistShareDisabled", "Sharing is off."),
      );
    } catch (reason) {
      console.error(reason);
      setError(label(t, "wishlistShareError", "Could not update sharing."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="panel section-panel wishlist-share-panel"
      aria-label={label(t, "wishlistShareTitle", "Share wishlist")}
    >
      <div className="wishlist-share-head">
        <div>
          <span className="eyebrow">{label(t, "wishlistShareTitle", "Share")}</span>
          <p className="analytics-hint">
            {label(
              t,
              "wishlistShareBody",
              "Create a private link others can open without signing in. Images stay private.",
            )}
          </p>
        </div>
        <Share2 size={18} aria-hidden="true" />
      </div>
      {loading ? (
        <p className="analytics-hint">{label(t, "loading", "Loading…")}</p>
      ) : (
        <div className="wishlist-share-actions">
          {!share || !share.enabled ? (
            <button
              type="button"
              className="primary-button"
              disabled={busy || !auth.user}
              onClick={() => void createOrEnable()}
            >
              <Link2 size={16} />
              {share
                ? label(t, "wishlistShareEnable", "Enable sharing")
                : label(t, "wishlistShareCreate", "Create share link")}
            </button>
          ) : (
            <>
              <button
                type="button"
                className="primary-button"
                disabled={busy}
                onClick={() => void copyLink()}
              >
                <Copy size={16} />
                {label(t, "wishlistShareCopy", "Copy link")}
              </button>
              <button
                type="button"
                className="secondary-button"
                disabled={busy}
                onClick={() => void setEnabled(false)}
              >
                {label(t, "wishlistShareDisable", "Disable")}
              </button>
            </>
          )}
          {share?.enabled && share.token ? (
            <p className="wishlist-share-url" title={publicShareUrl(share.token)}>
              {publicShareUrl(share.token)}
            </p>
          ) : null}
        </div>
      )}
      {message ? (
        <p className="notice" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
