import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Transaction, TransactionInput } from "../types/transaction";
import * as transactionService from "../services/transactions";

export function useTransactions(userId: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadedUserId, setLoadedUserId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);
  const latestRequest = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++latestRequest.current;
    if (!userId || !supabase) {
      setTransactions([]);
      setLoadedUserId(undefined);
      setError(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    const requestTimeout = window.setTimeout(() => {
      if (requestId === latestRequest.current) {
        setError("We couldn’t load your transactions. Check your connection and try again.");
        setLoadedUserId(userId);
        setIsLoading(false);
      }
    }, 15000);
    try {
      const result = await transactionService.listTransactions(supabase, userId);
      if (requestId === latestRequest.current) {
        setTransactions(result);
        setLoadedUserId(userId);
        setError(null);
      }
    } catch (reason) {
      console.error("Could not load transactions.", reason);
      if (requestId === latestRequest.current) {
        setError("We couldn’t load your transactions. Check your connection and try again.");
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

  const save = useCallback(
    async (input: TransactionInput, existing?: Transaction) => {
      if (!userId || !supabase) throw new Error("Sign in before saving transactions.");
      try {
        await transactionService.saveTransaction(supabase, userId, input, existing);
      } catch (error) {
        console.error("Could not save a transaction.", error);
        throw new Error("We couldn’t save this transaction. Check your connection and try again.");
      }
      await refresh();
    },
    [refresh, userId],
  );

  const remove = useCallback(
    async (transaction: Transaction) => {
      if (!userId || !supabase) throw new Error("Sign in before deleting transactions.");
      try {
        await transactionService.deleteTransaction(supabase, userId, transaction);
      } catch (error) {
        console.error("Could not delete a transaction.", error);
        throw new Error("We couldn’t delete this transaction. Check your connection and try again.");
      }
      await refresh();
    },
    [refresh, userId],
  );

  const getImageUrl = useCallback(
    (path: string) => {
      if (!userId || !supabase) return Promise.reject(new Error("Sign in to view this image."));
      return transactionService.getSignedImageUrl(supabase, userId, path);
    },
    [userId],
  );

  const importBackup = useCallback(
    async (
      records: Array<{
        type: "in" | "out";
        name: string;
        amount: number;
        date: string;
        method?: string | null;
        link?: string | null;
        note?: string | null;
      }>,
    ) => {
      if (!userId || !supabase) throw new Error("Sign in before importing a backup.");
      try {
        await transactionService.importTransactions(supabase, userId, records);
      } catch (error) {
        console.error("Could not import the backup.", error);
        throw new Error("We couldn’t import this backup. Check your connection and try again.");
      }
      await refresh();
    },
    [refresh, userId],
  );

  return {
    transactions: userId && loadedUserId === userId ? transactions : [],
    isLoading: isLoading || Boolean(userId && loadedUserId !== userId),
    error,
    refresh,
    save,
    remove,
    getImageUrl,
    importBackup,
  };
}

export function useSignedImage(
  path: string | null | undefined,
  getImageUrl: (path: string) => Promise<string>,
) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    setUrl(null);
    setFailed(false);
    if (path) {
      void getImageUrl(path)
        .then((signedUrl) => {
          if (active) setUrl(signedUrl);
        })
        .catch((error: unknown) => {
          console.error("Could not load a private purchase image.", error);
          if (active) setFailed(true);
        });
    }
    return () => {
      active = false;
    };
  }, [getImageUrl, path]);
  return { url, failed };
}