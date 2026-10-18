import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTranslation } from "../../lib/i18n";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const t = useTranslation();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const from = (location.state as { from?: string } | null)?.from || "/app";

  const label = (key: string, fallback: string) => {
    const v = t(key);
    return v && v !== "—" && v !== key ? v : fallback;
  };

  if (!auth.isLoading && auth.user) {
    navigate(from.startsWith("/") ? from : "/app", { replace: true });
    return null;
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } catch {
      /* auth.authError set by hook */
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
      <Card padding="lg" style={{ width: "100%", maxWidth: 400 }} className="m-anim-scale">
        <div style={{ textAlign: "center", marginBottom: "var(--m-space-6)" }}>
          <h1 style={{ margin: 0, fontSize: "var(--m-text-2xl)", fontWeight: 700 }}>Montra</h1>
          <p style={{ margin: "8px 0 0", color: "var(--m-text-secondary)", fontSize: "var(--m-text-sm)" }}>
            {label("loginTagline", "Track your money. Understand your money. Plan your money.")}
          </p>
        </div>

        {!auth.isConfigured ? (
          <p style={{ color: "var(--m-warning)", fontSize: "var(--m-text-sm)" }}>
            Supabase is not configured.
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
          onClick={() => void run(() => auth.signInWithProvider("google"))}
          style={{ marginBottom: "var(--m-space-3)" }}
        >
          {label("loginGoogle", "Continue with Google")}
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
          {label("loginOrEmail", "or email")}
          <div style={{ flex: 1, height: 1, background: "var(--m-border)" }} />
        </div>

        <label className="m-label" htmlFor="login-email">
          {label("loginEmail", "Email")}
        </label>
        <input
          id="login-email"
          className="m-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          disabled={otpSent}
          style={{ marginBottom: 12 }}
        />

        {otpSent ? (
          <>
            <label className="m-label" htmlFor="login-code">
              {label("loginCode", "Verification code")}
            </label>
            <input
              id="login-code"
              className="m-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              style={{ marginBottom: 12 }}
            />
            <Button
              fullWidth
              disabled={busy || !code.trim()}
              onClick={() =>
                void run(async () => {
                  await auth.verifyEmailCode(email.trim(), code.trim());
                  navigate(from.startsWith("/") ? from : "/app", { replace: true });
                })
              }
            >
              {label("loginVerify", "Verify and sign in")}
            </Button>
            <Button
              fullWidth
              variant="ghost"
              style={{ marginTop: 8 }}
              disabled={busy}
              onClick={() => {
                setOtpSent(false);
                setCode("");
              }}
            >
              {label("loginBack", "Use a different email")}
            </Button>
          </>
        ) : (
          <Button
            fullWidth
            variant="secondary"
            disabled={busy || !auth.isConfigured || !email.trim()}
            onClick={() =>
              void run(async () => {
                await auth.signInWithEmail(email.trim());
                setOtpSent(true);
              })
            }
          >
            {label("loginSendCode", "Send sign-in code")}
          </Button>
        )}
      </Card>
    </div>
  );
}
