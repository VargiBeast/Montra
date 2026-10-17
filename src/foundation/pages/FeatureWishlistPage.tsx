import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useWishlist } from "../../hooks/useWishlist";
import { useSavingsGoals } from "../../hooks/useSavingsGoals";
import { WishlistPage } from "../../pages/WishlistPage";
import { LoadingState } from "../ui/LoadingState";

/** Bridge: full wishlist with goals link. */
export function FeatureWishlistPage() {
  const auth = useAuth();
  const wishlist = useWishlist(auth.user?.id);
  const goals = useSavingsGoals(auth.user?.id);
  const navigate = useNavigate();

  if (auth.isLoading) return <LoadingState label="Loading…" />;

  return (
    <WishlistPage
      items={wishlist.items}
      goals={goals.goals}
      isLoading={wishlist.isLoading}
      error={wishlist.error}
      onBack={() => navigate(-1)}
      onSave={wishlist.save}
      onDelete={wishlist.remove}
      getImageUrl={wishlist.getImageUrl}
      onRetry={() => void wishlist.refresh()}
    />
  );
}
