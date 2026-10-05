import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ChevronDown, Globe2, Mail } from "lucide-react";
import { getLoginCopy, languageOptions, useLanguage } from "../lib/i18n";

interface LoginPageProps {
  authError: string | null;
  busy: boolean;
  isConfigured: boolean;
  onGoogle: () => Promise<void>;
  /** Sends a magic-link email (Supabase OTP email). No password. */
  onMagicLink: (email: string) => Promise<void>;
  onRetry: () => Promise<void>;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function LoginPage({
  authError,
  busy,
  isConfigured,
  onGoogle,
  onMagicLink,
  onRetry,
}: LoginPageProps) {
  const { language, setLanguage } = useLanguage();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [localBusy, setLocalBusy] = useState(false);
  const [localError, setLocalError] = useState("");
  const languageRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const copy = getLoginCopy(language);
  const isBusy = busy || localBusy;

  useEffect(() => {
    if (!languageOpen) return;
    function onPointer(event: PointerEvent) {
      if (!languageRef.current?.contains(event.target as Node)) setLanguageOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setLanguageOpen(false);
    }
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [languageOpen]);

  function chooseLanguage(next: string) {
    setLanguage(next);
    setLanguageOpen(false);
  }

  function backToStart() {
    setShowEmail(false);
    setSent(false);
    setLocalError("");
  }

  async function submitMagicLink(event: FormEvent) {
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
    setLocalBusy(true);
    try {
      await onMagicLink(value);
      setSent(true);
    } catch (reason) {
      const message =
        reason instanceof Error && reason.message
          ? reason.message
          : (copy as { sendFailed?: string }).sendFailed ??
            "We couldn’t send the magic link. Please try again.";
      setLocalError(message);
    } finally {
      setLocalBusy(false);
    }
  }

  const sendLabel =
    (copy as { sendMagicLink?: string }).sendMagicLink ??
    copy.sendCode ??
    "Send magic link";
  const sentTitle =
    (copy as { magicLinkSent?: string }).magicLinkSent ?? copy.codeSent ?? "Magic link sent";
  const sentBody =
    (copy as { magicLinkSentBody?: string }).magicLinkSentBody ??
    copy.codeSentBody ??
    "Open the link we sent to";
  const sentHint =
    (copy as { magicLinkSentHint?: string }).magicLinkSentHint ??
    copy.codeSentHint ??
    "The link expires after a short time.";

  return (
    <div className="auth-shell">
      <section className="auth-story panel" aria-hidden="true">
        <div className="auth-story-brand">
          <span className="brand-mark" aria-hidden="true">
            <img className="mark-light" src="/branding/mark-light.png" alt="" />
            <img className="mark-dark" src="/branding/mark-dark.png" alt="" />
          </span>
          MONTRA
        </div>
        <h1 className="auth-story-title">{copy.storyTitle}</h1>
        <p className="auth-story-body">{copy.storyBody}</p>
      </section>

      <section className="auth-panel panel" aria-label={copy.welcome}>
        <div className="auth-panel-top">
          <div>
            <h2 className="auth-welcome">{copy.welcome}</h2>
            <p className="auth-welcome-body">{copy.welcomeBody}</p>
          </div>
          <div className="language-menu" ref={languageRef}>
            <button
              type="button"
              className="language-trigger"
              aria-label={copy.languageLabel}
              aria-expanded={languageOpen}
              aria-controls={menuId}
              onClick={() => setLanguageOpen((v) => !v)}
            >
              <Globe2 size={14} aria-hidden="true" />
              <span>{languageOptions.find((o) => o[0] === language)?.[1] ?? copy.languageName}</span>
              <ChevronDown size={14} aria-hidden="true" />
            </button>
            {languageOpen && (
              <ul id={menuId} className="language-dropdown" role="listbox">
                {languageOptions.map(([code, label]) => (
                  <li key={code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={code === language}
                      onClick={() => chooseLanguage(code)}
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {!isConfigured && (
          <div className="notice" role="alert">
            <strong>{copy.notConnected}</strong>
            <button type="button" className="text-action" onClick={() => void onRetry()}>
              {copy.tryAgain}
            </button>
          </div>
        )}

        {authError && !localError && (
          <p className="form-error" role="alert">
            {authError}
          </p>
        )}

        {!showEmail ? (
          <div className="auth-actions">
            <button
              className="secondary-button auth-button wide"
              type="button"
              disabled={isBusy || !isConfigured}
              onClick={() => void onGoogle()}
            >
              <GoogleMark />
              {copy.continueGoogle}
            </button>
            <p className="auth-or">{copy.or}</p>
            <button
              className="secondary-button auth-button wide"
              type="button"
              disabled={isBusy || !isConfigured}
              onClick={() => {
                setLocalError("");
                setSent(false);
                setShowEmail(true);
              }}
            >
              <Mail size={16} />
              {copy.continueEmail}
            </button>
          </div>
        ) : (
          <div className="auth-email-flow">
            <button type="button" className="text-action auth-back" onClick={backToStart} disabled={isBusy}>
              <ArrowLeft size={14} /> {copy.back}
            </button>

            {!sent ? (
              <form onSubmit={(e) => void submitMagicLink(e)}>
                <div className="form-field">
                  <label htmlFor="login-email">{copy.email}</label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={copy.emailPlaceholder}
                    disabled={isBusy}
                    required
                  />
                </div>
                {localError && (
                  <p className="form-error" role="alert">
                    {localError}
                  </p>
                )}
                <button
                  className="primary-button wide"
                  style={{ marginTop: 13 }}
                  type="submit"
                  disabled={isBusy || !isConfigured}
                >
                  <Mail size={16} />
                  {isBusy ? copy.sending : sendLabel}
                </button>
              </form>
            ) : (
              <div className="notice" role="status">
                <strong>{sentTitle}.</strong> {sentBody} <strong>{email.trim()}</strong>. {sentHint}
                <p className="auth-switch" style={{ marginTop: 12 }}>
                  <button
                    className="text-action"
                    type="button"
                    disabled={isBusy || !isConfigured}
                    onClick={() => void submitMagicLink({ preventDefault() {} } as FormEvent)}
                  >
                    {isBusy ? copy.sending : copy.resend ?? "Resend link"}
                  </button>
                </p>
              </div>
            )}
          </div>
        )}
        <p style={{ margin: "18px 0 0", fontSize: 11 }}>{copy.legal}</p>
      </section>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5z" />
      <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.6-1.9.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.9 10.7A5.4 5.4 0 0 1 3.6 9c0-.6.1-1.2.3-1.7V5H.9A9 9 0 0 0 0 9c0 1.4.3 2.8.9 4l3-2.3z" />
      <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6A9 9 0 0 0 .9 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6z" />
    </svg>
  );
}
