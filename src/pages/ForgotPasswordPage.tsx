import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import { getLoginCopy, useLanguage } from "../lib/i18n";
import { useDocumentMeta } from "../lib/seo";

interface Props {
  busy: boolean;
  isConfigured: boolean;
  authError: string | null;
  onSubmit: (email: string) => Promise<void>;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function ForgotPasswordPage({ busy, isConfigured, authError, onSubmit }: Props) {
  const { language } = useLanguage();
  const copy = getLoginCopy(language);
  const [email, setEmail] = useState("");
  const [localError, setLocalError] = useState("");
  const [sent, setSent] = useState(false);

  useDocumentMeta({
    title: "Reset password · Montra",
    description: "Request a password reset link for your Montra account.",
    path: "/forgot-password",
    noIndex: true,
  });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLocalError("");
    const value = email.trim();
    if (!value) {
      setLocalError(copy.enterEmail);
      return;
    }
    if (!isValidEmail(value)) {
      setLocalError(copy.invalidEmail);
      return;
    }
    try {
      await onSubmit(value);
      setSent(true);
    } catch (reason) {
      setLocalError(reason instanceof Error ? reason.message : copy.couldNotSend);
    }
  }

  return (
    <div className="auth-page auth-page-solo">
      <section className="panel auth-panel">
        <Link to="/login" className="text-action auth-back">
          <ArrowLeft size={15} /> {copy.back}
        </Link>
        <h2>{copy.forgotTitle ?? "Forgot password"}</h2>
        <p>{copy.forgotBody ?? "Enter your email and we’ll send a link to reset your password."}</p>
        {sent ? (
          <div className="notice" role="status">
            {copy.forgotSent ?? "If an account exists for that email, a reset link is on its way."}
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)}>
            <div className="form-field">
              <label htmlFor="forgot-email">{copy.email}</label>
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={copy.emailPlaceholder}
              />
            </div>
            {(localError || authError) && (
              <p className="form-error" role="alert">{localError || authError}</p>
            )}
            <button className="primary-button wide" type="submit" disabled={busy || !isConfigured}>
              <Mail size={16} />
              {busy ? copy.sending : (copy.sendResetLink ?? "Send reset link")}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
