import type { SupabaseClient } from '@supabase/supabase-js';
import type { Receipt } from '@/types/receipt';

const TABLE = 'receipts';
const BUCKET = 'receipts';

export async function listReceipts(client: SupabaseClient, userId: string): Promise<Receipt[]> {
  const { data, error } = await client
    .from(TABLE)
    .select('id, user_id, image_path, extracted_text, amount, merchant, date, transaction_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Receipt[];
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
  if (upError) throw upError;

  const { data, error } = await client
    .from(TABLE)
    .insert({
      user_id: userId,
      image_path: path,
      extracted_text: meta.extracted_text ?? null,
      amount: meta.amount ?? null,
      merchant: meta.merchant ?? null,
      date: meta.date ?? null,
      transaction_id: null,
    })
    .select()
    .single();

  if (error) {
    await client.storage.from(BUCKET).remove([path]);
    throw error;
  }
  return data as Receipt;
}

export async function deleteReceipt(client: SupabaseClient, userId: string, receipt: Receipt) {
  if (!receipt.image_path.startsWith(`${userId}/`)) {
    throw new Error('Not allowed');
  }
  const { error } = await client.from(TABLE).delete().eq('id', receipt.id).eq('user_id', userId);
  if (error) throw error;
  await client.storage.from(BUCKET).remove([receipt.image_path]);
}

export async function getReceiptSignedUrl(client: SupabaseClient, userId: string, path: string) {
  if (!path.startsWith(`${userId}/`)) throw new Error('Not allowed');
  const { data, error } = await client.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}
