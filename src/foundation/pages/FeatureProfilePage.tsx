import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ProfilePage } from "../../pages/ProfilePage";
import { LoadingState } from "../ui/LoadingState";

/** Bridge: profile + sign out. */
export function FeatureProfilePage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  if (auth.isLoading || !auth.user) {
    return <LoadingState label="Loading profile…" />;
  }

  return (
    <ProfilePage
      user={auth.user}
      busy={busy}
      onBack={() => navigate(-1)}
      onSignOut={async () => {
        setBusy(true);
        try {
          await auth.signOut();
          navigate("/login", { replace: true });
        } finally {
          setBusy(false);
        }
      }}
    />
  );
}
