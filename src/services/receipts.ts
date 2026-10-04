import type { SupabaseClient } from "@supabase/supabase-js";
import { validateImage } from "../lib/utils";
import type { Receipt } from "../types/receipt";

const TABLE = "receipts";
const IMAGE_BUCKET = "receipts";

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
    throw new Error("This receipt image is not available for your account.");
  }
  return path;
}

async function removeImage(client: SupabaseClient, path: string | null) {
  if (!path) return;
  const { error } = await client.storage.from(IMAGE_BUCKET).remove([path]);
  if (error) console.warn("Could not remove a receipt image.", error);
}

export async function listReceipts(
  client: SupabaseClient,
  userId: string,
): Promise<Receipt[]> {
  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Receipt[];
}

export async function uploadReceipt(
  client: SupabaseClient,
  userId: string,
  image: File,
  currency = "NOK",
): Promise<Receipt> {
  const imageError = validateImage(image);
  if (imageError) throw new Error(imageError);

  const imagePath = `${userId}/${crypto.randomUUID()}.${imageExtension(image)}`;
  const { error: uploadError } = await client.storage.from(IMAGE_BUCKET).upload(imagePath, image, {
    upsert: false,
    contentType: image.type,
    cacheControl: "3600",
  });
  if (uploadError) throw uploadError;

  const payload = {
    user_id: userId,
    image_path: imagePath,
    merchant: null,
    total_amount: null,
    currency,
    receipt_date: null,
    status: "pending" as const,
  };

  try {
    const { data, error } = await client
      .from(TABLE)
      .insert(payload)
      .select("*")
      .single();
    if (error) throw error;
    return data as Receipt;
  } catch (error) {
    await removeImage(client, imagePath);
    throw error;
  }
}

export async function deleteReceipt(
  client: SupabaseClient,
  userId: string,
  receipt: Receipt,
): Promise<void> {
  const imagePath = requireUserImagePath(receipt.image_path, userId);
  const { data, error } = await client
    .from(TABLE)
    .delete()
    .eq("id", receipt.id)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("This receipt could not be found in your account.");
  await removeImage(client, imagePath);
}

export async function getSignedReceiptUrl(
  client: SupabaseClient,
  userId: string,
  path: string,
): Promise<string> {
  const safePath = requireUserImagePath(path, userId);
  const { data, error } = await client.storage
    .from(IMAGE_BUCKET)
    .createSignedUrl(safePath, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}
