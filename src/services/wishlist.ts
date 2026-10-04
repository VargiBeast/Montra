import type { SupabaseClient } from "@supabase/supabase-js";
import { validateImage, validateProductUrl } from "../lib/utils";
import type { WishlistItem, WishlistItemInput } from "../types/wishlist";

const TABLE = "wishlists";
const IMAGE_BUCKET = "wishlist";

function imageExtension(file: File): string {
  const byType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  return byType[file.type] ?? "jpg";
}

function requireUserImagePath(path: string, userId: string): string {
  if (!path || !path.startsWith(`${userId}/`) || path.includes("..")) {
    throw new Error("This wishlist image is not available for your account.");
  }
  return path;
}

async function removeImage(client: SupabaseClient, path: string | null) {
  if (!path) return;
  const { error } = await client.storage.from(IMAGE_BUCKET).remove([path]);
  if (error) console.warn("Could not remove a wishlist image.", error);
}

function normalizeInput(input: WishlistItemInput): Omit<WishlistItemInput, "image" | "removeImage"> {
  const name = input.name.trim();
  if (!name) throw new Error("Add a name for this item.");
  if (!Number.isFinite(input.price) || input.price <= 0) {
    throw new Error("Enter a price greater than zero.");
  }
  const currency = (input.currency || "NOK").trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error("Choose a valid currency.");
  }
  const link = validateProductUrl(input.url ?? "");
  if (link.error) throw new Error(link.error);
  if (input.image) {
    const imageError = validateImage(input.image);
    if (imageError) throw new Error(imageError);
    if (!["image/jpeg", "image/png", "image/webp"].includes(input.image.type)) {
      throw new Error("invalidImageType");
    }
  }
  return {
    name,
    price: Math.round(input.price * 100) / 100,
    currency,
    url: link.url,
    details: input.details?.trim() || null,
    purchased: Boolean(input.purchased),
    savings_goal_id: input.savings_goal_id || null,
  };
}

export async function listWishlistItems(
  client: SupabaseClient,
  userId: string,
): Promise<WishlistItem[]> {
  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...row,
    price: Number(row.price),
    purchased: Boolean(row.purchased),
  })) as WishlistItem[];
}

export async function saveWishlistItem(
  client: SupabaseClient,
  userId: string,
  input: WishlistItemInput,
  existing?: WishlistItem,
): Promise<void> {
  const normalized = normalizeInput(input);
  const now = new Date().toISOString();

  let imagePath: string | null = existing?.image_path
    ? requireUserImagePath(existing.image_path, userId)
    : null;
  let uploadedPath: string | null = null;
  const oldPath = imagePath;

  if (input.removeImage && !input.image) {
    imagePath = null;
  }

  if (input.image) {
    uploadedPath = `${userId}/${crypto.randomUUID()}.${imageExtension(input.image)}`;
    const { error: uploadError } = await client.storage
      .from(IMAGE_BUCKET)
      .upload(uploadedPath, input.image, {
        upsert: false,
        contentType: input.image.type,
      });
    if (uploadError) throw uploadError;
    imagePath = uploadedPath;
  }

  try {
    if (existing) {
      const { error } = await client
        .from(TABLE)
        .update({
          name: normalized.name,
          price: normalized.price,
          currency: normalized.currency,
          url: normalized.url,
          details: normalized.details,
          purchased: normalized.purchased,
          savings_goal_id: normalized.savings_goal_id,
          image_path: imagePath,
          updated_at: now,
        })
        .eq("id", existing.id)
        .eq("user_id", userId);
      if (error) throw error;
    } else {
      const { error } = await client.from(TABLE).insert({
        user_id: userId,
        name: normalized.name,
        price: normalized.price,
        currency: normalized.currency,
        url: normalized.url,
        details: normalized.details,
        purchased: normalized.purchased,
        savings_goal_id: normalized.savings_goal_id,
        image_path: imagePath,
        created_at: now,
        updated_at: now,
      });
      if (error) throw error;
    }
  } catch (reason) {
    if (uploadedPath) await removeImage(client, uploadedPath);
    throw reason;
  }

  if (oldPath && oldPath !== imagePath) {
    await removeImage(client, oldPath);
  }
}

export async function deleteWishlistItem(
  client: SupabaseClient,
  userId: string,
  item: WishlistItem,
): Promise<void> {
  const imagePath = item.image_path
    ? requireUserImagePath(item.image_path, userId)
    : null;
  const { error } = await client
    .from(TABLE)
    .delete()
    .eq("id", item.id)
    .eq("user_id", userId);
  if (error) throw error;
  await removeImage(client, imagePath);
}

export async function getSignedWishlistImageUrl(
  client: SupabaseClient,
  userId: string,
  path: string,
): Promise<string> {
  const safe = requireUserImagePath(path, userId);
  const { data, error } = await client.storage
    .from(IMAGE_BUCKET)
    .createSignedUrl(safe, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}
