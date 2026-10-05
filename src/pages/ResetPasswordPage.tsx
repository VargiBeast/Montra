import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, KeyRound } from "lucide-react";
import { getLoginCopy, useLanguage } from "../lib/i18n";
import { useDocumentMeta } from "../lib/seo";

interface Props {
  busy: boolean;
  isConfigured: boolean;
  authError: string | null;
  onSubmit: (password: string) => Promise<void>;
}

export function ResetPasswordPage({ busy, isConfigured, authError, onSubmit }: Props) {
  const { language } = useLanguage();
  const copy = getLoginCopy(language);
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [localError, setLocalError] = useState("");
  const [done, setDone] = useState(false);

  useDocumentMeta({
    title: "Choose a new password · Montra",
    description: "Set a new password for your Montra account.",
    path: "/reset-password",
    noIndex: true,
  });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLocalError("");
    if (!password) {
      setLocalError(copy.enterPassword);
      return;
    }
    if (password.length < 6) {
      setLocalError(copy.shortPassword);
      return;
    }
    if (password !== confirm) {
      setLocalError(copy.passwordMismatch ?? "Passwords do not match.");
      return;
    }
    try {
      await onSubmit(password);
      setDone(true);
      window.setTimeout(() => navigate("/app", { replace: true }), 1200);
    } catch (reason) {
      setLocalError(reason instanceof Error ? reason.message : copy.couldNotSignIn);
    }
  }

  return (
    <div className="auth-page auth-page-solo">
      <section className="panel auth-panel">
        <Link to="/login" className="text-action auth-back">
          <ArrowLeft size={15} /> {copy.back}
        </Link>
        <h2>{copy.resetTitle ?? "Choose a new password"}</h2>
        <p>{copy.resetBody ?? "Enter a new password for your Montra account."}</p>
        {done ? (
          <div className="notice" role="status">
            {copy.resetDone ?? "Password updated. Taking you to your account…"}
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)}>
            <div className="form-field">
              <label htmlFor="reset-password">{copy.passwordLabel}</label>
              <input
                id="reset-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={copy.passwordPlaceholder}
              />
            </div>
            <div className="form-field">
              <label htmlFor="reset-confirm">{copy.confirmPassword ?? "Confirm password"}</label>
              <input
                id="reset-confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={copy.passwordPlaceholder}
              />
            </div>
            {(localError || authError) && (
              <p className="form-error" role="alert">{localError || authError}</p>
            )}
            <button className="primary-button wide" type="submit" disabled={busy || !isConfigured}>
              <KeyRound size={16} />
              {busy ? copy.continuing : (copy.savePassword ?? "Save password")}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
