import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { usePlusEntitlement } from "../../hooks/usePlusEntitlement";
import {
  applyAccentTheme,
  defaultPersonalization,
  readPersonalization,
  type PersonalizationSettings,
} from "../../lib/personalization";
import { PersonalizePage } from "../../pages/PersonalizePage";
import { LoadingState } from "../ui/LoadingState";

/** Bridge: personalization (Plus-gated) with local persistence. */
export function FeaturePersonalizePage() {
  const auth = useAuth();
  const plus = usePlusEntitlement(auth.user?.id);
  const navigate = useNavigate();
  const [settings, setSettings] = useState<PersonalizationSettings>(defaultPersonalization);

  useEffect(() => {
    if (!auth.user?.id) return;
    const loaded = readPersonalization(auth.user.id);
    setSettings(loaded);
    applyAccentTheme(loaded);
  }, [auth.user?.id]);

  if (auth.isLoading) return <LoadingState label="Loading…" />;

  return (
    <PersonalizePage
      hasPlus={plus.hasPlus}
      userId={auth.user?.id ?? null}
      settings={settings}
      onChange={setSettings}
      onBack={() => navigate(-1)}
      onOpenPlus={() => navigate("/app/plus")}
    />
  );
}
