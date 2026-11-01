import { useCallback, useEffect, useRef, useState } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import {
  isPlusEntitlementActive,
  type PlusEntitlement,
} from '@/lib/plus';

export type PlusEntitlementState = {
  isLoading: boolean;
  hasPlus: boolean;
  entitlement: PlusEntitlement | null;
  error: string | null;
  refresh: () => Promise<void>;
};

/** Reads public.plus_entitlements under RLS (own row only). */
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
        .from('plus_entitlements')
        .select(
          'user_id, stripe_customer_id, stripe_subscription_id, status, current_period_end, created_at, updated_at',
        )
        .eq('user_id', userId)
        .maybeSingle();

      if (id !== requestId.current) return;

      if (queryError) {
        console.error('plus_entitlements fetch failed:', queryError);
        setError('Could not load Plus status.');
        setEntitlement(null);
      } else {
        setError(null);
        setEntitlement((data as PlusEntitlement | null) ?? null);
      }
    } catch (err) {
      if (id !== requestId.current) return;
      console.error('plus_entitlements fetch error:', err);
      setError('Could not load Plus status.');
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
