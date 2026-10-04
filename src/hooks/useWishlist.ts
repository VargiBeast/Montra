import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import * as wishlistService from "../services/wishlist";
import type { WishlistItem, WishlistItemInput } from "../types/wishlist";

export function useWishlist(userId: string | undefined) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);
  const [loadedUserId, setLoadedUserId] = useState<string | undefined>();
  const latestRequest = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++latestRequest.current;
    if (!userId || !supabase) {
      setItems([]);
      setLoadedUserId(undefined);
      setError(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await wishlistService.listWishlistItems(supabase, userId);
      if (requestId === latestRequest.current) {
        setItems(result);
        setLoadedUserId(userId);
        setError(null);
      }
    } catch (reason) {
      console.error("Could not load wishlist.", reason);
      if (requestId === latestRequest.current) {
        setError("We couldn\u2019t load your wishlist. Check your connection and try again.");
        setLoadedUserId(userId);
      }
    } finally {
      if (requestId === latestRequest.current) setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = useCallback(
    async (input: WishlistItemInput, existing?: WishlistItem) => {
      if (!userId || !supabase) throw new Error("Sign in before saving wishlist items.");
      await wishlistService.saveWishlistItem(supabase, userId, input, existing);
      await refresh();
    },
    [userId, refresh],
  );

  const remove = useCallback(
    async (item: WishlistItem) => {
      if (!userId || !supabase) throw new Error("Sign in before deleting wishlist items.");
      await wishlistService.deleteWishlistItem(supabase, userId, item);
      await refresh();
    },
    [userId, refresh],
  );

  const getImageUrl = useCallback(
    async (path: string) => {
      if (!userId || !supabase) throw new Error("Sign in to view this image.");
      return wishlistService.getSignedWishlistImageUrl(supabase, userId, path);
    },
    [userId],
  );

  return {
    items: userId && loadedUserId === userId ? items : [],
    isLoading: Boolean(userId) && isLoading,
    error,
    refresh,
    save,
    remove,
    getImageUrl,
  };
}
