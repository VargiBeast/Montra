import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

type Translate = (key: string) => string;

/**
 * Opens Stripe Customer Portal via create-stripe-portal Edge Function.
 * No Stripe secrets in the frontend. Redirects to the returned HTTPS URL.
 */
export function useStripePortal(user: User | null | undefined, t: Translate) {
  const navigate = useNavigate();
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const openPortal = useCallback(async () => {
    if (portalLoading) return;
    setPortalError(null);

    if (!user) {
      navigate("/login", { state: { from: "/plus" } });
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setPortalError(t("plusPortalError"));
      return;
    }

    setPortalLoading(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("create-stripe-portal");

      if (invokeError) {
        const anyErr = invokeError as { message?: string; context?: Response };
        let detail = anyErr?.message ?? invokeError.message ?? "invoke_failed";
        try {
          const ctx = anyErr?.context;
          if (ctx && typeof (ctx as Response).json === "function") {
            const body = await (ctx as Response).clone().json() as { error?: string; code?: string };
            if (body?.code) detail = body.code;
            else if (body?.error) detail = body.error;
          }
        } catch {
          /* ignore */
        }
        console.error("create-stripe-portal invoke error:", detail, invokeError);
        const isDev = Boolean(import.meta.env.DEV);
        setPortalError(isDev ? `${t("plusPortalError")} (${detail})` : t("plusPortalError"));
        setPortalLoading(false);
        return;
      }

      const payload = data as { url?: string; error?: string; code?: string } | null;
      const url = payload?.url;
      if (typeof url === "string" && url.startsWith("https://")) {
        window.location.href = url;
        return;
      }

      const safeCode = payload?.code ?? payload?.error ?? "no_url";
      console.error("create-stripe-portal unexpected response:", safeCode, data);
      const isDev = Boolean(import.meta.env.DEV);
      setPortalError(isDev ? `${t("plusPortalError")} (${safeCode})` : t("plusPortalError"));
      setPortalLoading(false);
    } catch (err) {
      console.error("create-stripe-portal failed:", err);
      setPortalError(t("plusPortalError"));
      setPortalLoading(false);
    }
  }, [user, portalLoading, navigate, t]);

  return { openPortal, portalLoading, portalError, setPortalError };
}
