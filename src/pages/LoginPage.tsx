import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, ChevronDown, Globe2, KeyRound, Mail } from "lucide-react";
import { getLoginCopy, languageOptions, useLanguage } from "../lib/i18n";

interface LoginPageProps {
  authError: string | null;
  busy: boolean;
  isConfigured: boolean;
  onGoogle: () => Promise<void>;
  onEmail: (email: string) => Promise<void>;
  onVerifyCode: (email: string, token: string) => Promise<void>;
  onPassword: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  onRetry: () => Promise<void>;
}

type EmailMethod = "password" | "code" | null;

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function LoginPage({
  authError,
  busy,
  isConfigured,
  onGoogle,
  onEmail,
  onVerifyCode,
  onPassword,
  onSignUp,
  onRetry,
}: LoginPageProps) {
  const { language, setLanguage } = useLanguage();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [method, setMethod] = useState<EmailMethod>(null);
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
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
    setMethod(null);
    setCreating(false);
    setSent(false);
    setCode("");
    resetFeedback();
  }

  function backToMethods() {
    setMethod(null);
    setCreating(false);
    setSent(false);
    setCode("");
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

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetFeedback();
    const value = requireEmail();
    if (!value) return;
    if (!password) {
      setLocalError(copy.enterPassword);
      return;
    }
    if (password.length < 6) {
      setLocalError(copy.shortPassword);
      return;
    }
    try {
      if (creating) {
        const result = await onSignUp(value, password);
        setNotice(result.needsConfirmation ? copy.accountCreated : copy.signedUpReady);
        setCreating(false);
        return;
      }
      await onPassword(value, password);
    } catch (reason) {
      setLocalError(reason instanceof Error ? reason.message : copy.couldNotSignIn);
    }
  }

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetFeedback();
    const value = requireEmail();
    if (!value) return;
    try {
      await onEmail(value);
      setSent(true);
      setNotice(copy.codeSent);
    } catch (reason) {
      setLocalError(reason instanceof Error ? reason.message : copy.couldNotSend);
    }
  }

  async function submitVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetFeedback();
    const value = requireEmail();
    if (!value) return;
    const token = code.replace(/\s/g, "");
    if (!token) {
      setLocalError(copy.enterCode);
      return;
    }
    try {
      await onVerifyCode(value, token);
    } catch (reason) {
      setLocalError(reason instanceof Error ? reason.message : copy.couldNotSignIn);
    }
  }

  const storyLines = copy.storyTitle.split("\n");

  return (
    <div className="auth-page">
      <section className="auth-story">
        <div className="brand" style={{ color: "#f5fff9" }}>
          <span className="brand-mark" aria-hidden="true" style={{ color: "var(--green)", background: "#f5fff9" }}><img className="mark-dark" src="/branding/mark-dark.png" alt="" /></span>
          MONTRA
        </div>
        <h1>{storyLines[0]}<br />{storyLines[1]}</h1>
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
                {languageOptions.map(([locale, name]) => {
                  const languageBase = language.toLowerCase().split("-")[0];
                  const localeBase = locale.toLowerCase().split("-")[0];
                  const selected = languageBase === localeBase || (languageBase === "no" && localeBase === "nb");
                  return <button key={locale} type="button" role="option" aria-selected={selected} className={selected ? "selected" : ""} onClick={() => chooseLanguage(locale)}>{name}</button>;
                })}
              </div>
            )}
          </div>
        </div>

        {!isConfigured && <div className="notice" role="alert">{authError || copy.notConnected}</div>}
        {authError && isConfigured && !localError && (
          <div className="notice" role="alert">
            {authError}
            <button className="text-action" type="button" onClick={() => void onRetry()} style={{ marginLeft: 7 }}>{copy.tryAgain}</button>
          </div>
        )}

        {!showEmail ? (
          <div className="auth-buttons auth-step">
            <button className="secondary-button auth-button wide" type="button" disabled={busy || !isConfigured} onClick={() => void onGoogle()}>
              <GoogleMark />
              {copy.continueGoogle}
            </button>
            <button className="secondary-button auth-button wide" type="button" disabled={busy || !isConfigured} onClick={() => { resetFeedback(); setShowEmail(true); }}>
              <Mail size={17} />
              {copy.continueEmail}
            </button>
          </div>
        ) : (
          <div className="auth-step">
            <button className="text-action auth-back" type="button" onClick={method || sent ? backToMethods : backToStart}>
              <ArrowLeft size={15} />
              {copy.back}
            </button>
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

            {!method && (
              <div className="method-chooser">
                <p>{copy.choose}</p>
                <div className="method-grid">
                  <button className="method-card" type="button" onClick={() => { resetFeedback(); setMethod("password"); }}>
                    <KeyRound size={18} />
                    <span>{copy.password}</span>
                  </button>
                  <button className="method-card" type="button" onClick={() => { resetFeedback(); setMethod("code"); }}>
                    <Mail size={18} />
                    <span>{copy.oneTime}</span>
                  </button>
                </div>
              </div>
            )}

            {method === "password" && (
              <form onSubmit={submitPassword}>
                <div className="form-field">
                  <label htmlFor="login-password">{copy.passwordLabel}</label>
                  <input
                    id="login-password"
                    type="password"
                    autoComplete={creating ? "new-password" : "current-password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={copy.passwordPlaceholder}
                  />
                </div>
                {localError && <p className="form-error" role="alert">{localError}</p>}
                {notice && <div className="notice" role="status">{notice}</div>}
                <button className="primary-button wide" style={{ marginTop: 13 }} type="submit" disabled={busy || !isConfigured}>
                  {busy ? copy.continuing : creating ? copy.createAccount : copy.continue}
                  {!busy && <ArrowRight size={15} />}
                </button>
                <p className="auth-switch">
                  {creating ? copy.haveAccount : copy.needAccount}{" "}
                  <button className="text-action" type="button" onClick={() => { setCreating((value) => !value); resetFeedback(); }}>
                    {creating ? copy.signInInstead : copy.createAccount}
                  </button>
                </p>
              </form>
            )}

            {method === "code" && !sent && (
              <form onSubmit={submitCode}>
                <p className="method-hint">{copy.choose} {copy.oneTime}</p>
                {localError && <p className="form-error" role="alert">{localError}</p>}
                <button className="primary-button wide" style={{ marginTop: 13 }} type="submit" disabled={busy || !isConfigured}>
                  <Mail size={16} />
                  {busy ? copy.sending : copy.sendCode}
                </button>
              </form>
            )}

            {method === "code" && sent && (
              <form onSubmit={submitVerify}>
                <div className="notice" role="status">
                  <strong>{copy.codeSent}.</strong> {copy.codeSentBody} <strong>{email.trim()}</strong>. {copy.codeSentHint}
                </div>
                <div className="form-field" style={{ marginTop: 14 }}>
                  <label htmlFor="login-code">{copy.codeLabel}</label>
                  <input
                    id="login-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    placeholder={copy.codePlaceholder}
                  />
                </div>
                {localError && <p className="form-error" role="alert">{localError}</p>}
                <button className="primary-button wide" style={{ marginTop: 13 }} type="submit" disabled={busy || !isConfigured}>
                  {busy ? copy.verifying : copy.verify}
                </button>
                <p className="auth-switch">
                  <button className="text-action" type="button" disabled={busy || !isConfigured} onClick={() => void submitCode({ preventDefault() {} } as FormEvent<HTMLFormElement>)}>
                    {busy ? copy.sending : copy.resend}
                  </button>
                </p>
              </form>
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
