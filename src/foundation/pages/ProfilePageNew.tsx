import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { readLanguage } from "../../lib/i18n";
import { PageHeader } from "../ui/PageHeader";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { LoadingState } from "../ui/LoadingState";

export function ProfilePageNew() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  if (auth.isLoading || !auth.user) {
    return <LoadingState label="Loading profile…" />;
  }

  const user = auth.user;
  const email = user.email ?? "—";
  const name =
    user.user_metadata?.full_name ?? user.user_metadata?.name ?? email.split("@")[0];
  const provider = user.app_metadata?.provider;
  const signInLabel =
    provider === "google" ? "Google" : provider === "apple" ? "Apple" : "Email";
  const created = user.created_at
    ? new Intl.DateTimeFormat(readLanguage(), { dateStyle: "medium" }).format(new Date(user.created_at))
    : "—";

  return (
    <div className="m-anim-in">
      <PageHeader title="Profile" subtitle="Account" />

      <Card padding="lg" className="m-anim-scale" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "var(--m-accent-soft)",
              color: "var(--m-accent)",
              display: "grid",
              placeItems: "center",
              fontWeight: 700,
              fontSize: 22,
            }}
          >
            {String(name).slice(0, 1).toUpperCase()}
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 17 }}>{name}</p>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--m-text-secondary)" }}>{email}</p>
          </div>
        </div>
      </Card>

      <Card padding="md" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--m-border)" }}>
          <span style={{ color: "var(--m-text-muted)", fontSize: 13 }}>Sign-in</span>
          <strong style={{ fontSize: 13 }}>{signInLabel}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
          <span style={{ color: "var(--m-text-muted)", fontSize: 13 }}>Created</span>
          <strong style={{ fontSize: 13 }}>{created}</strong>
        </div>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Button variant="secondary" onClick={() => navigate("/app/personalize")}>
          Personalize
        </Button>
        <Button variant="secondary" onClick={() => navigate("/app/plus")}>
          Montra Plus
        </Button>
        <Button
          variant="danger"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void auth.signOut().then(() => navigate("/login", { replace: true }));
          }}
        >
          {busy ? "Signing out…" : "Sign out"}
        </Button>
      </div>
    </div>
  );
}
