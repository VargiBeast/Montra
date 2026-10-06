import { useCallback, useEffect, useRef, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import {
  isPlusEntitlementActive,
  type PlusEntitlement,
} from "../lib/plus";

export type PlusEntitlementState = {
  /** True while the first entitlement fetch is in flight. */
  isLoading: boolean;
  /** True when Plus is currently unlocked for the UI. */
  hasPlus: boolean;
  /** Raw entitlement row (or null if none / signed out). */
  entitlement: PlusEntitlement | null;
  /** Last fetch error message, if any. */
  error: string | null;
  /** Re-fetch entitlement from Supabase. */
  refresh: () => Promise<void>;
};

/**
 * Centralized Plus access for the authenticated user.
 *
 * Reads public.plus_entitlements under RLS (own row only).
 * Does not call Stripe or write entitlement rows.
 */
export function usePlusEntitlement(userId: string | null | undefined): PlusEntitlementState {
  const [isLoading, setIsLoading] = useState(Boolean(userId));
  const [entitlement, setEntitlement] = useState<PlusEntitlement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const fetchEntitlement = useCallback(async () => {
    const id = ++requestId.current;

    if (!userId || !isSupabaseConfigured || !supabase) {
      if (id === requestId.current) {
        setEntitlement(null);
        setError(null);
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    try {
      const { data, error: queryError } = await supabase
        .from("plus_entitlements")
        .select(
          "user_id, stripe_customer_id, stripe_subscription_id, status, current_period_end, created_at, updated_at",
        )
        .eq("user_id", userId)
        .maybeSingle();

      if (id !== requestId.current) return;

      if (queryError) {
        console.error("plus_entitlements fetch failed:", queryError);
        setError("Could not load Plus status.");
        setEntitlement(null);
      } else {
        setError(null);
        setEntitlement((data as PlusEntitlement | null) ?? null);
      }
    } catch (err) {
      if (id !== requestId.current) return;
      console.error("plus_entitlements fetch error:", err);
      setError("Could not load Plus status.");
      setEntitlement(null);
    } finally {
      if (id === requestId.current) setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void fetchEntitlement();
  }, [fetchEntitlement]);

  return {
    isLoading,
    hasPlus: isPlusEntitlementActive(entitlement),
    entitlement,
    error,
    refresh: fetchEntitlement,
  };
}
