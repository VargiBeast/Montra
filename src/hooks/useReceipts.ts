import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import * as receiptService from "../services/receipts";
import type { Receipt } from "../types/receipt";

export function useReceipts(userId: string | undefined) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const latestRequest = useRef(0);

  const refresh = useCallback(async () => {
    if (!userId || !supabase) {
      setReceipts([]);
      setLoadedUserId(null);
      setError(null);
      setIsLoading(false);
      return;
    }
    const requestId = ++latestRequest.current;
    setIsLoading(true);
    const requestTimeout = window.setTimeout(() => {
      if (requestId === latestRequest.current) {
        setError("We couldn’t load your receipts. Check your connection and try again.");
        setLoadedUserId(userId);
        setIsLoading(false);
      }
    }, 15000);
    try {
      const result = await receiptService.listReceipts(supabase, userId);
      if (requestId === latestRequest.current) {
        setReceipts(result);
        setLoadedUserId(userId);
        setError(null);
      }
    } catch (reason) {
      console.error("Could not load receipts.", reason);
      if (requestId === latestRequest.current) {
        setError("We couldn’t load your receipts. Check your connection and try again.");
        setLoadedUserId(userId);
      }
    } finally {
      window.clearTimeout(requestTimeout);
      if (requestId === latestRequest.current) setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
    return () => {
      latestRequest.current += 1;
    };
  }, [refresh]);

  const upload = useCallback(
    async (image: File, currency = "NOK") => {
      if (!userId || !supabase) throw new Error("Sign in before uploading receipts.");
      try {
        await receiptService.uploadReceipt(supabase, userId, image, currency);
      } catch (error) {
        console.error("Could not upload a receipt.", error);
        throw new Error("We couldn’t upload this receipt. Check your connection and try again.");
      }
      await refresh();
    },
    [refresh, userId],
  );

  const remove = useCallback(
    async (receipt: Receipt) => {
      if (!userId || !supabase) throw new Error("Sign in before deleting receipts.");
      try {
        await receiptService.deleteReceipt(supabase, userId, receipt);
      } catch (error) {
        console.error("Could not delete a receipt.", error);
        throw new Error("We couldn’t delete this receipt. Check your connection and try again.");
      }
      await refresh();
    },
    [refresh, userId],
  );

  const getImageUrl = useCallback(
    (path: string) => {
      if (!userId || !supabase) return Promise.reject(new Error("Sign in to view this image."));
      return receiptService.getSignedReceiptUrl(supabase, userId, path);
    },
    [userId],
  );

  return {
    receipts,
    isLoading: isLoading || (Boolean(userId) && loadedUserId !== userId),
    error,
    refresh,
    upload,
    remove,
    getImageUrl,
  };
}
