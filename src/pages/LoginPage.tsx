import { useState, type FormEvent } from "react";
import { Apple, ArrowRight, Mail, WalletCards } from "lucide-react";

interface LoginPageProps {
  authError: string | null;
  busy: boolean;
  isConfigured: boolean;
  onGoogle: () => Promise<void>;
  onApple: () => Promise<void>;
  onEmail: (email: string) => Promise<void>;
  onRetry: () => Promise<void>;
}

export function LoginPage({ authError, busy, isConfigured, onGoogle, onApple, onEmail, onRetry }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [localError, setLocalError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError("");
    try { await onEmail(email.trim()); setSent(true); }
    catch (reason) { setLocalError(reason instanceof Error ? reason.message : "We couldn’t send your sign-in link."); }
  }

  return (
    <div className="auth-page">
      <section className="auth-story">
        <div className="brand" style={{ color: "#f5fff9" }}><span className="brand-mark" style={{ color: "var(--green)", background: "#f5fff9" }}><WalletCards size={18} /></span>saldo</div>
        <h1>Your money,<br />in a softer focus.</h1>
        <p>A personal journal for the things you spend on and the things that come in. Clear enough to understand, human enough to return to.</p>
      </section>
      <section className="panel auth-panel">
        <h2>Welcome to Saldo</h2>
        <p>Sign in to find your money story right where you left it.</p>
        {!isConfigured && <div className="notice" role="alert">{authError || "Saldo isn’t connected yet. Add the Supabase connection settings to continue."}</div>}
        {authError && isConfigured && <div className="notice" role="alert">{authError}<button className="text-action" type="button" onClick={() => void onRetry()} style={{ marginLeft: 7 }}>Try again</button></div>}
        {sent ? <div className="notice" role="status">A sign-in link is on its way to <strong>{email}</strong>. You can close this page once it arrives.</div> : <>
          <div className="auth-buttons">
            <button className="secondary-button auth-button wide" type="button" disabled={busy || !isConfigured} onClick={() => void onGoogle()}><span style={{ fontWeight: 800, color: "#477bd4" }}>G</span> Continue with Google</button>
            <button className="secondary-button auth-button wide" type="button" disabled={busy || !isConfigured} onClick={() => void onApple()}><Apple size={17} /> Continue with Apple</button>
          </div>
          <div className="auth-divider">or use email</div>
          <form onSubmit={submit}>
            <div className="form-field">
              <label htmlFor="login-email">Email address</label>
              <input id="login-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
            </div>
            {localError && <p className="form-error" role="alert">{localError}</p>}
            <button className="primary-button wide" style={{ marginTop: 13 }} type="submit" disabled={busy || !isConfigured}><Mail size={16} />{busy ? "Sending…" : "Send me a sign-in link"}<ArrowRight size={15} /></button>
          </form>
        </>}
        <p style={{ margin: "18px 0 0", fontSize: 11 }}>By continuing, you’re signing in to your personal Saldo space.</p>
      </section>
    </div>
  );
}