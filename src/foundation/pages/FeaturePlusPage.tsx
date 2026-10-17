import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { usePlusEntitlement } from "../../hooks/usePlusEntitlement";
import { PlusPage } from "../../pages/PlusPage";
import { LoadingState } from "../ui/LoadingState";

/** Bridge: full Plus checkout / entitlement UI inside the new shell. */
export function FeaturePlusPage() {
  const auth = useAuth();
  const plus = usePlusEntitlement(auth.user?.id);
  const navigate = useNavigate();

  if (auth.isLoading) return <LoadingState label="Loading…" />;

  return (
    <PlusPage
      hasPlus={plus.hasPlus}
      entitlementLoading={plus.isLoading}
      entitlementStatus={plus.entitlement?.status ?? null}
      onRefreshEntitlement={plus.refresh}
      onBack={() => navigate(-1)}
      onOpenAnalytics={() => navigate("/app/analytics")}
      onOpenSavings={() => navigate("/app/goals")}
      onOpenPersonalize={() => navigate("/app/personalize")}
    />
  );
}
