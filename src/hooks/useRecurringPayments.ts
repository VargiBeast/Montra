import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import * as service from "../services/recurringPayments";
import type { RecurringPayment, RecurringPaymentInput } from "../types/recurringPayment";

export function useRecurringPayments(userId: string | undefined) {
  const [items, setItems] = useState<RecurringPayment[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);
  const latestRequest = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++latestRequest.current;
    if (!userId || !supabase) {
      setItems([]);
      setError(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await service.listRecurringPayments(supabase, userId);
      if (requestId === latestRequest.current) {
        setItems(result);
        setError(null);
      }
    } catch (reason) {
      console.error("Could not load recurring payments.", reason);
      if (requestId === latestRequest.current) {
        setError(
          reason instanceof Error && reason.message.trim()
            ? reason.message
            : "Could not load planned payments.",
        );
      }
    } finally {
      if (requestId === latestRequest.current) setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = useCallback(
    async (input: RecurringPaymentInput, existing?: RecurringPayment) => {
      if (!userId || !supabase) throw new Error("Sign in before saving.");
      await service.saveRecurringPayment(supabase, userId, input, existing);
      await refresh();
    },
    [userId, refresh],
  );

  const remove = useCallback(
    async (item: RecurringPayment) => {
      if (!userId || !supabase) throw new Error("Sign in before deleting.");
      await service.deleteRecurringPayment(supabase, userId, item);
      await refresh();
    },
    [userId, refresh],
  );

  const setActive = useCallback(
    async (item: RecurringPayment, active: boolean) => {
      if (!userId || !supabase) throw new Error("Sign in before updating.");
      await service.setRecurringActive(supabase, userId, item, active);
      await refresh();
    },
    [userId, refresh],
  );

  return { items, isLoading, error, refresh, save, remove, setActive };
}
