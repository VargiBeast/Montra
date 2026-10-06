import type { SupabaseClient } from "@supabase/supabase-js";

const TABLE = "wishlist_shares";

export interface WishlistShare {
  id: string;
  user_id: string;
  token: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

/** Cryptographically strong share token (48 hex chars ≈ 192 bits). */
export function generateShareToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function getOwnShare(
  client: SupabaseClient,
  userId: string,
): Promise<WishlistShare | null> {
  const { data, error } = await client
    .from(TABLE)
    .select("id, user_id, token, enabled, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as WishlistShare | null;
}

/** Create a new enabled share, or reuse the latest existing row. */
export async function ensureShare(
  client: SupabaseClient,
  userId: string,
): Promise<WishlistShare> {
  const existing = await getOwnShare(client, userId);
  if (existing) {
    if (existing.enabled) return existing;
    const now = new Date().toISOString();
    const { data, error } = await client
      .from(TABLE)
      .update({ enabled: true, updated_at: now })
      .eq("id", existing.id)
      .eq("user_id", userId)
      .select("id, user_id, token, enabled, created_at, updated_at")
      .single();
    if (error) throw error;
    return data as WishlistShare;
  }

  const token = generateShareToken();
  const now = new Date().toISOString();
  const { data, error } = await client
    .from(TABLE)
    .insert({
      user_id: userId,
      token,
      enabled: true,
      created_at: now,
      updated_at: now,
    })
    .select("id, user_id, token, enabled, created_at, updated_at")
    .single();
  if (error) throw error;
  return data as WishlistShare;
}

export async function setShareEnabled(
  client: SupabaseClient,
  userId: string,
  shareId: string,
  enabled: boolean,
): Promise<WishlistShare> {
  const now = new Date().toISOString();
  const { data, error } = await client
    .from(TABLE)
    .update({ enabled, updated_at: now })
    .eq("id", shareId)
    .eq("user_id", userId)
    .select("id, user_id, token, enabled, created_at, updated_at")
    .single();
  if (error) throw error;
  return data as WishlistShare;
}

export function publicShareUrl(token: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/wishlist/${token}`;
}

/** Safe public item shape returned by the public-wishlist Edge Function. */
export interface PublicWishlistItem {
  name: string;
  price: number;
  currency: string;
  url: string | null;
  details: string | null;
  purchased: boolean;
  image_url: string | null;
}

export interface PublicWishlistPayload {
  title?: string;
  items: PublicWishlistItem[];
}

export async function fetchPublicWishlist(
  client: SupabaseClient,
  token: string,
): Promise<PublicWishlistPayload> {
  // Edge Function allows GET only (POST returns "Method not allowed").
  // Token is passed as a query parameter.
  const { data, error } = await client.functions.invoke(
    `public-wishlist?token=${encodeURIComponent(token)}`,
    { method: "GET" },
  );

  if (error) {
    // Prefer body error text when the Edge Function returned a structured failure.
    let message = error.message || "shareUnavailable";
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === "function") {
      try {
        const body = await ctx.json();
        if (body && typeof body === "object" && "error" in body && body.error) {
          message = String(body.error);
        }
      } catch {
        /* keep message */
      }
    }
    throw new Error(message);
  }

  // Edge Function may return { error } in the body on soft failures
  if (data && typeof data === "object" && "error" in data && data.error) {
    throw new Error(String(data.error));
  }

  const items = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data)
      ? data
      : [];

  return {
    title: typeof data?.title === "string" ? data.title : undefined,
    items: items.map((row: Record<string, unknown>) => ({
      name: String(row.name ?? ""),
      price: Number(row.price) || 0,
      currency: String(row.currency ?? "NOK"),
      url: typeof row.url === "string" ? row.url : null,
      details: typeof row.details === "string" ? row.details : null,
      purchased: Boolean(row.purchased),
      image_url:
        typeof row.image_url === "string"
          ? row.image_url
          : typeof row.imageUrl === "string"
            ? row.imageUrl
            : null,
    })),
  };
}
