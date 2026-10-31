import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/authentication/AuthProvider';
import { listReceipts, uploadReceipt, deleteReceipt } from '@/services/receipts';
import { runLocalOcr } from '@/lib/localOcr';
import type { Receipt } from '@/types/receipt';

export function useReceipts() {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!supabase || !user) {
      setReceipts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await listReceipts(supabase, user.id);
      setReceipts(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load receipts';
      setError(msg);
      console.error('[useReceipts]', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const upload = useCallback(
    async (file: File) => {
      if (!supabase || !user) throw new Error('Not authenticated');
      let meta: {
        extracted_text?: string;
        amount?: number | null;
        merchant?: string | null;
        date?: string | null;
      } = {};
      try {
        const ocr = await runLocalOcr(file);
        meta = {
          extracted_text: ocr.text,
          amount: ocr.suggestedAmount,
          merchant: ocr.suggestedMerchant,
          date: ocr.suggestedDate,
        };
      } catch {
        // OCR failure is non-fatal
      }
      const receipt = await uploadReceipt(supabase, user.id, file, meta);
      await refresh();
      return receipt;
    },
    [user, refresh],
  );

  const remove = useCallback(
    async (receipt: Receipt) => {
      if (!supabase || !user) throw new Error('Not authenticated');
      await deleteReceipt(supabase, user.id, receipt);
      await refresh();
    },
    [user, refresh],
  );

  return { receipts, loading, error, refresh, upload, remove };
}
