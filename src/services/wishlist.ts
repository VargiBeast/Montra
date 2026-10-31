import type { SupabaseClient } from '@supabase/supabase-js';
import type { WishlistItem, WishlistItemInput } from '@/types/wishlist';

const TABLE = 'wishlists';
const BUCKET = 'wishlist';

export async function listWishlist(client: SupabaseClient, userId: string): Promise<WishlistItem[]> {
  const { data, error } = await client
    .from(TABLE)
    .select('id, user_id, name, description, price, priority, image_url, link, savings_goal_id, created_at, updated_at')
    .eq('user_id', userId)
    .order('priority', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    ...r,
    price: r.price != null ? Number(r.price) : null,
    priority: r.priority != null ? Number(r.priority) : null,
  })) as WishlistItem[];
}

export async function saveWishlistItem(
  client: SupabaseClient,
  userId: string,
  input: WishlistItemInput,
  existing?: WishlistItem,
): Promise<void> {
  const name = input.name.trim();
  if (!name) throw new Error('Name is required');

  const payload = {
    name,
    description: input.description?.trim() || null,
    price: input.price,
    priority: input.priority,
    link: input.link?.trim() || null,
    savings_goal_id: input.savings_goal_id,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await client
      .from(TABLE)
      .update(payload)
      .eq('id', existing.id)
      .eq('user_id', userId);
    if (error) throw error;
  } else {
    const { error } = await client.from(TABLE).insert({
      ...payload,
      user_id: userId,
      image_url: null,
      created_at: new Date().toISOString(),
    });
    if (error) throw error;
  }
}

export async function deleteWishlistItem(
  client: SupabaseClient,
  userId: string,
  item: WishlistItem,
): Promise<void> {
  const { error } = await client.from(TABLE).delete().eq('id', item.id).eq('user_id', userId);
  if (error) throw error;
  if (item.image_url?.startsWith(`${userId}/`)) {
    await client.storage.from(BUCKET).remove([item.image_url]);
  }
}
