import type { SupabaseClient } from '@supabase/supabase-js';
import type { Receipt } from '@/types/receipt';

const TABLE = 'receipts';
const BUCKET = 'receipts';

function normalizeReceipt(row: Record<string, unknown>): Receipt {
  const amount =
    row.amount != null
      ? Number(row.amount)
      : row.total_amount != null
        ? Number(row.total_amount)
        : null;
  const date =
    (row.date as string | null) ??
    (row.receipt_date as string | null) ??
    null;

  return {
    id: String(row.id),
    user_id: String(row.user_id),
    image_path: String(row.image_path ?? ''),
    extracted_text: (row.extracted_text as string | null) ?? null,
    amount,
    total_amount: row.total_amount != null ? Number(row.total_amount) : null,
    merchant: (row.merchant as string | null) ?? null,
    date,
    receipt_date: (row.receipt_date as string | null) ?? null,
    currency: (row.currency as string | null) ?? null,
    status: (row.status as string | null) ?? null,
    transaction_id: (row.transaction_id as string | null) ?? null,
    created_at: String(row.created_at ?? ''),
  };
}

export async function listReceipts(client: SupabaseClient, userId: string): Promise<Receipt[]> {
  // Select * so we tolerate both old and new column names
  const { data, error } = await client
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[receipts] list error', error);
    throw new Error(error.message || 'Failed to load receipts');
  }

  return (data ?? []).map((row) => normalizeReceipt(row as Record<string, unknown>));
}

export async function uploadReceipt(
  client: SupabaseClient,
  userId: string,
  file: File,
  meta: { extracted_text?: string; amount?: number | null; merchant?: string | null; date?: string | null },
): Promise<Receipt> {
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error: upError } = await client.storage.from(BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type,
    cacheControl: '3600',
  });
  if (upError) throw new Error(upError.message || 'Upload failed');

  // Try modern columns first; if the table uses older names the insert may still work with extras ignored
  const payload: Record<string, unknown> = {
    user_id: userId,
    image_path: path,
    extracted_text: meta.extracted_text ?? null,
    amount: meta.amount ?? null,
    total_amount: meta.amount ?? null,
    merchant: meta.merchant ?? null,
    date: meta.date ?? null,
    receipt_date: meta.date ?? null,
    transaction_id: null,
  };

  const { data, error } = await client.from(TABLE).insert(payload).select('*').single();

  if (error) {
    await client.storage.from(BUCKET).remove([path]);
    throw new Error(error.message || 'Could not save receipt');
  }

  return normalizeReceipt(data as Record<string, unknown>);
}

export async function deleteReceipt(client: SupabaseClient, userId: string, receipt: Receipt) {
  if (receipt.image_path && !receipt.image_path.startsWith(`${userId}/`)) {
    throw new Error('Not allowed');
  }
  const { error } = await client.from(TABLE).delete().eq('id', receipt.id).eq('user_id', userId);
  if (error) throw new Error(error.message || 'Delete failed');
  if (receipt.image_path) {
    await client.storage.from(BUCKET).remove([receipt.image_path]);
  }
}
