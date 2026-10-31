export interface WishlistItem {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  price: number | null;
  priority: number | null;
  image_url: string | null;
  link: string | null;
  savings_goal_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface WishlistItemInput {
  name: string;
  description: string | null;
  price: number | null;
  priority: number | null;
  link: string | null;
  savings_goal_id: string | null;
  image: File | null;
}
