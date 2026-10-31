import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/authentication/AuthProvider';
import { listWishlist, saveWishlistItem, deleteWishlistItem } from '@/services/wishlist';
import type { WishlistItem, WishlistItemInput } from '@/types/wishlist';

export function useWishlist() {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!supabase || !user) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setItems(await listWishlist(supabase, user.id));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = useCallback(
    async (input: WishlistItemInput, existing?: WishlistItem) => {
      if (!supabase || !user) throw new Error('Not authenticated');
      await saveWishlistItem(supabase, user.id, input, existing);
      await refresh();
    },
    [user, refresh],
  );

  const remove = useCallback(
    async (item: WishlistItem) => {
      if (!supabase || !user) throw new Error('Not authenticated');
      await deleteWishlistItem(supabase, user.id, item);
      await refresh();
    },
    [user, refresh],
  );

  return { items, loading, refresh, save, remove };
}
