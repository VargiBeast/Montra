import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

/**
 * New login surface — independent of the previous LoginPage.
 * Uses the verified auth service contracts (Google OAuth + email OTP).
 */
export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const from = (location.state as { from?: string } | null)?.from || "/app";

  if (!auth.isLoading && auth.user) {
    navigate(from.startsWith("/") ? from : "/app", { replace: true });
    return null;
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } catch {
      /* auth.authError is set by the hook */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "var(--m-space-4)",
        background: "radial-gradient(ellipse at top, #0e1a14 0%, var(--m-bg) 55%)",
      }}
    >
      <Card padding="lg" style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: "var(--m-space-6)" }}>
          <h1 style={{ margin: 0, fontSize: "var(--m-text-2xl)", fontWeight: 700 }}>Montra</h1>
          <p style={{ margin: "8px 0 0", color: "var(--m-text-secondary)", fontSize: "var(--m-text-sm)" }}>
            Track your money. Understand your money. Plan your money.
          </p>
        </div>

        {!auth.isConfigured ? (
          <p style={{ color: "var(--m-warning)", fontSize: "var(--m-text-sm)" }}>
            Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.
          </p>
        ) : null}

        {auth.authError ? (
          <p
            role="alert"
            style={{
              marginBottom: "var(--m-space-4)",
              padding: "10px 12px",
              borderRadius: "var(--m-radius-sm)",
              background: "rgba(248, 113, 113, 0.1)",
              color: "var(--m-negative)",
              fontSize: "var(--m-text-sm)",
            }}
          >
            {auth.authError}
          </p>
        ) : null}

        <Button
          fullWidth
          disabled={busy || !auth.isConfigured}
          onClick={() => run(() => auth.signInWithProvider("google"))}
          style={{ marginBottom: "var(--m-space-3)" }}
        >
          Continue with Google
        </Button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            margin: "var(--m-space-4) 0",
            color: "var(--m-text-muted)",
            fontSize: "var(--m-text-xs)",
          }}
        >
          <div style={{ flex: 1, height: 1, background: "var(--m-border)" }} />
          or email
          <div style={{ flex: 1, height: 1, background: "var(--m-border)" }} />
        </div>

        <label style={{ display: "block", marginBottom: 6, fontSize: "var(--m-text-sm)", color: "var(--m-text-secondary)" }}>
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={{
            width: "100%",
            padding: "12px 14px",
            marginBottom: "var(--m-space-3)",
            borderRadius: "var(--m-radius-md)",
            border: "1px solid var(--m-border-strong)",
            background: "var(--m-bg-input)",
            color: "var(--m-text)",
            outline: "none",
          }}
        />
        <Button
          fullWidth
          variant="secondary"
          disabled={busy || !auth.isConfigured || !email.trim()}
          onClick={() => run(() => auth.signInWithEmail(email.trim()))}
        >
          Send magic link
        </Button>
      </Card>
    </div>
  );
}
