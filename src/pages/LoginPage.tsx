import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, ChevronDown, Globe2, Mail } from "lucide-react";
import { getLoginCopy, languageOptions, useLanguage } from "../lib/i18n";
import { trackEvent } from "../lib/gtm";

interface LoginPageProps {
  authError: string | null;
  busy: boolean;
  isConfigured: boolean;
  onGoogle: () => Promise<void>;
  /** Send a magic-link email via Supabase OTP. */
  onMagicLink: (email: string) => Promise<void>;
  onRetry: () => Promise<void>;
  /** @deprecated Kept for backward-compat with guest force-login callers; unused. */
  onEmail?: (email: string) => Promise<void>;
  /** @deprecated Unused — password auth removed from UI. */
  onVerifyCode?: (email: string, token: string) => Promise<void>;
  /** @deprecated Unused — password auth removed from UI. */
  onPassword?: (email: string, password: string) => Promise<void>;
  /** @deprecated Unused — password auth removed from UI. */
  onSignUp?: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
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
  const [notice, setNotice] = useState("");
  const [localError, setLocalError] = useState("");
  const languageRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const copy = getLoginCopy(language);

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

  function resetFeedback() {
    setLocalError("");
    setNotice("");
  }

  function backToStart() {
    setShowEmail(false);
    setSent(false);
    resetFeedback();
  }

  function requireEmail() {
    const value = email.trim();
    if (!value) {
      setLocalError(copy.enterEmail);
      return null;
    }
    if (!isValidEmail(value)) {
      setLocalError(copy.invalidEmail);
      return null;
    }
    return value;
  }

  async function submitMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetFeedback();
    const value = requireEmail();
    if (!value) return;
    try {
      await onMagicLink(value);
      setSent(true);
      setNotice(copy.magicLinkSent);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : copy.couldNotSend;
      const lower = message.toLowerCase();
      if (lower.includes("rate") || lower.includes("limit") || lower.includes("too many")) {
        setLocalError(copy.magicLinkRateLimit);
      } else if (lower.includes("invalid") && lower.includes("email")) {
        setLocalError(copy.invalidEmail);
      } else {
        setLocalError(message || copy.couldNotSend);
      }
    }
  }

  const storyLines = copy.storyTitle.split("\n");

  return (
    <div className="auth-page">
      <section className="auth-story">
        <div className="brand" style={{ color: "#f5fff9" }}>
          <span className="brand-mark" aria-hidden="true" style={{ color: "var(--green)", background: "#f5fff9" }}>
            <img className="mark-dark" src="/branding/mark-dark.png" alt="" />
          </span>
          MONTRA
        </div>
        <h1>
          {storyLines[0]}
          <br />
          {storyLines[1]}
        </h1>
        <p>{copy.storyBody}</p>
      </section>
      <section className="panel auth-panel">
        <div className="auth-panel-top">
          <div>
            <h2>{copy.welcome}</h2>
            <p>{copy.welcomeBody}</p>
          </div>
          <div className="language-picker" ref={languageRef}>
            <button
              className="language-button"
              type="button"
              aria-haspopup="listbox"
              aria-expanded={languageOpen}
              aria-controls={menuId}
              onClick={() => setLanguageOpen((open) => !open)}
            >
              <Globe2 size={14} aria-hidden="true" />
              {new Intl.DisplayNames([language], { type: "language" }).of(language) ?? language}
              <ChevronDown size={14} />
            </button>
            {languageOpen && (
              <div className="language-menu" id={menuId} role="listbox" aria-label={copy.languageLabel}>
                {languageOptions.map((entry) => {
                  const locale = entry[0];
                  const name = entry[1];
                  const languageBase = language.toLowerCase().split("-")[0];
                  const localeBase = locale.toLowerCase().split("-")[0];
                  const selected =
                    languageBase === localeBase || (languageBase === "no" && localeBase === "nb");
                  return (
                    <button
                      key={locale}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={selected ? "selected" : ""}
                      onClick={() => chooseLanguage(locale)}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {!isConfigured && <div className="notice" role="alert">{authError || copy.notConnected}</div>}
        {authError && isConfigured && !localError && (
          <div className="notice" role="alert">
            {authError}
            <button
              className="text-action"
              type="button"
              onClick={() => void onRetry()}
              style={{ marginLeft: 7 }}
            >
              {copy.tryAgain}
            </button>
          </div>
        )}

        {!showEmail ? (
          <div className="auth-buttons auth-step">
            <button
              className="secondary-button auth-button wide"
              type="button"
              disabled={busy || !isConfigured}
              onClick={() => { trackEvent("login_started", { surface: "login" }); void onGoogle(); }}
            >
              <GoogleMark />
              {copy.continueGoogle}
            </button>
            <button
              className="secondary-button auth-button wide"
              type="button"
              disabled={busy || !isConfigured}
              onClick={() => {
                resetFeedback();
                setShowEmail(true);
                setSent(false);
              }}
            >
              <Mail size={17} />
              {copy.continueEmail}
            </button>
          </div>
        ) : (
          <div className="auth-step">
            <button className="text-action auth-back" type="button" onClick={backToStart}>
              <ArrowLeft size={15} />
              {copy.back}
            </button>

            {sent ? (
              <div className="notice" role="status">
                <strong>{copy.magicLinkSent}.</strong> {copy.magicLinkSentBody}{" "}
                <strong>{email.trim()}</strong>. {copy.magicLinkSentHint}
              </div>
            ) : (
              <form onSubmit={submitMagicLink}>
                <div className="form-field">
                  <label htmlFor="login-email">{copy.email}</label>
                  <input
                    id="login-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={copy.emailPlaceholder}
                  />
                </div>
                {localError && (
                  <p className="form-error" role="alert">
                    {localError}
                  </p>
                )}
                {notice && (
                  <div className="notice" role="status">
                    {notice}
                  </div>
                )}
                <button
                  className="primary-button wide"
                  style={{ marginTop: 13 }}
                  type="submit"
                  disabled={busy || !isConfigured}
                >
                  <Mail size={16} />
                  {busy ? copy.sending : copy.sendMagicLink}
                  {!busy && <ArrowRight size={15} />}
                </button>
              </form>
            )}

            {sent && (
              <p className="auth-switch">
                <button
                  className="text-action"
                  type="button"
                  disabled={busy || !isConfigured}
                  onClick={() => {
                    setSent(false);
                    resetFeedback();
                  }}
                >
                  {copy.resendMagicLink}
                </button>
              </p>
            )}
          </div>
        )}

        <p className="auth-legal">{copy.legal}</p>
      </section>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
