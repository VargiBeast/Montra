export interface WishlistItem {
  id: string;
  user_id: string;
  name: string;
  /** Amount in the item's own currency (not necessarily base NOK). */
  price: number;
  currency: string;
  url: string | null;
  image_path: string | null;
  details: string | null;
  purchased: boolean;
  /** Optional link to an existing savings goal. */
  savings_goal_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface WishlistItemInput {
  name: string;
  price: number;
  currency: string;
  url: string | null;
  details: string | null;
  purchased: boolean;
  savings_goal_id: string | null;
  /** New image file to upload; null means keep existing. */
  image: File | null;
  /** When true on edit, clear the existing image without uploading a new one. */
  removeImage?: boolean;
}
