import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/authentication/AuthProvider';
import {
  listTransactions,
  saveTransaction,
  deleteTransaction,
} from '@/services/transactions';
import type { Transaction, TransactionInput } from '@/types/transaction';

export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!supabase || !user) {
      setTransactions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await listTransactions(supabase, user.id);
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (input: TransactionInput) => {
      if (!supabase || !user) throw new Error('Not authenticated');
      await saveTransaction(supabase, user.id, input);
      await refresh();
    },
    [user, refresh],
  );

  const update = useCallback(
    async (existing: Transaction, input: TransactionInput) => {
      if (!supabase || !user) throw new Error('Not authenticated');
      await saveTransaction(supabase, user.id, input, existing);
      await refresh();
    },
    [user, refresh],
  );

  const remove = useCallback(
    async (tx: Transaction) => {
      if (!supabase || !user) throw new Error('Not authenticated');
      await deleteTransaction(supabase, user.id, tx);
      await refresh();
    },
    [user, refresh],
  );

  return { transactions, loading, error, refresh, create, update, remove };
}
