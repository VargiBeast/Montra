import type { SupabaseClient } from "@supabase/supabase-js";
import { isValidCalendarDate, validateImage, validateProductUrl } from "../lib/utils";
import type { Transaction, TransactionInput } from "../types/transaction";

const TABLE = "transactions";
const IMAGE_BUCKET = "purchase-images";

/** In-memory cache of signed Storage URLs, keyed by image path. */
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

function imageExtension(file: File): string {
  const extensionByType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return extensionByType[file.type] ?? "jpg";
}

function requireUserImagePath(path: string, userId: string): string {
  if (!path || !path.startsWith(`${userId}/`) || path.includes("..")) {
    throw new Error("This image is not available for your account.");
  }
  return path;
}

async function removeImage(client: SupabaseClient, path: string | null) {
  if (!path) return;
  const { error } = await client.storage.from(IMAGE_BUCKET).remove([path]);
  if (error) console.warn("Could not remove an old purchase image.", error);
}

export async function listTransactions(
  client: SupabaseClient,
  userId: string,
): Promise<Transaction[]> {
  const { data, error } = await client
    .from(TABLE)
    .select("id, user_id, type, name, amount, date, method, link, note, image_url, created_at")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Transaction[];
}

export async function saveTransaction(
  client: SupabaseClient,
  userId: string,
  input: TransactionInput,
  existing?: Transaction,
): Promise<void> {
  const name = input.name.trim();
  if (!name) throw new Error("Add a name for this transaction.");
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Enter an amount greater than zero.");
  }
  if (!isValidCalendarDate(input.date)) {
    throw new Error("Choose a valid date.");
  }
  const productLink = input.type === "out"
    ? validateProductUrl(input.link ?? "")
    : { url: null, error: null };
  if (productLink.error) throw new Error(productLink.error);
  if (input.image) {
    const imageError = validateImage(input.image);
    if (imageError) throw new Error(imageError);
  }

  const oldImagePath = existing?.image_url
    ? requireUserImagePath(existing.image_url, userId)
    : null;
  let imagePath = input.type === "out" ? oldImagePath : null;
  let uploadedImagePath: string | null = null;

  if (input.image && input.type === "out") {
    uploadedImagePath = `${userId}/${crypto.randomUUID()}.${imageExtension(input.image)}`;
    const { error } = await client.storage.from(IMAGE_BUCKET).upload(uploadedImagePath, input.image, {
      upsert: false,
      contentType: input.image.type,
      cacheControl: "3600",
    });
    if (error) throw error;
    imagePath = uploadedImagePath;
  }

  const payload = {
    type: input.type,
    name,
    amount: input.amount,
    date: input.date,
    method: input.method?.trim() || null,
    link: productLink.url,
    note: input.note?.trim() || null,
    image_url: imagePath,
  };

  try {
    if (existing) {
      const { data, error } = await client
        .from(TABLE)
        .update(payload)
        .eq("id", existing.id)
        .eq("user_id", userId)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("This transaction could not be found in your account.");
    } else {
      const { error } = await client.from(TABLE).insert({ ...payload, user_id: userId });
      if (error) throw error;
    }
  } catch (error) {
    if (uploadedImagePath) await removeImage(client, uploadedImagePath);
    throw error;
  }

  if (oldImagePath && oldImagePath !== imagePath) {
    await removeImage(client, oldImagePath);
  }
}

export async function deleteTransaction(
  client: SupabaseClient,
  userId: string,
  transaction: Transaction,
): Promise<void> {
  const imagePath = transaction.image_url
    ? requireUserImagePath(transaction.image_url, userId)
    : null;
  const { data, error } = await client
    .from(TABLE)
    .delete()
    .eq("id", transaction.id)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("This transaction could not be found in your account.");
  if (imagePath) await removeImage(client, imagePath);
}

const signedUrlInflight = new Map<string, Promise<string>>();

export async function getSignedImageUrl(
  client: SupabaseClient,
  userId: string,
  path: string,
): Promise<string> {
  const safePath = requireUserImagePath(path, userId);
  const cached = signedUrlCache.get(safePath);
  if (cached && cached.expiresAt > Date.now()) return cached.url;
  const existing = signedUrlInflight.get(safePath);
  if (existing) return existing;
  const request = (async () => {
    try {
      const { data, error } = await client.storage
        .from(IMAGE_BUCKET)
        .createSignedUrl(safePath, 60 * 60);
      if (error) throw error;
      // Expire slightly before the signed URL (50 of 60 minutes) so clients never use a stale link.
      signedUrlCache.set(safePath, { url: data.signedUrl, expiresAt: Date.now() + 50 * 60 * 1000 });
      return data.signedUrl;
    } finally {
      signedUrlInflight.delete(safePath);
    }
  })();
  signedUrlInflight.set(safePath, request);
  return request;
}

export async function importTransactions(
  client: SupabaseClient,
  userId: string,
  records: Array<{
    type: "in" | "out";
    name: string;
    amount: number;
    date: string;
    method?: string | null;
    link?: string | null;
    note?: string | null;
  }>,
): Promise<void> {
  if (records.length === 0) return;
  const rows = records.map((record) => {
    const productLink = record.type === "out"
      ? validateProductUrl(record.link ?? "")
      : { url: null, error: null };
    if (productLink.error) {
      throw new Error(`The product link for “${record.name}” is invalid. ${productLink.error}`);
    }
    return {
      user_id: userId,
      type: record.type,
      name: record.name.trim(),
      amount: Number(record.amount),
      date: record.date,
      method: record.method?.trim() || null,
      link: productLink.url,
      note: record.note?.trim() || null,
      image_url: null,
    };
  });
  const { error } = await client.from(TABLE).insert(rows);
  if (error) throw error;
}
