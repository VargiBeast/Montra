import { useMemo, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { languageOptions, useLanguage, useTranslation } from "../lib/i18n";
import { currencyChoices, normalizeDisplayCurrency, type DisplayCurrency } from "../lib/preferences";
import { useDisplayCurrency } from "../lib/currency";
import {
  markOnboardingComplete,
  onboardingProgress,
  saveGuestTransaction,
  type OnboardingStep,
} from "../lib/onboarding";
import type { TransactionInput } from "../types/transaction";
import { trackEvent } from "../lib/gtm";

interface OnboardingFlowProps {
  onFinished: () => void;
  onSignIn: () => void;
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function OnboardingFlow({ onFinished, onSignIn }: OnboardingFlowProps) {
  const t = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { currency, setCurrency, convertToBase } = useDisplayCurrency();
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [txType, setTxType] = useState<"in" | "out">("out");
  const [txName, setTxName] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txNote, setTxNote] = useState("");

  const progress = useMemo(() => onboardingProgress(step), [step]);

  function goLanguage() {
    setError("");
    setStep("language");
  }

  function goCurrency() {
    setError("");
    setStep("currency");
  }

  function goFirstTx() {
    setError("");
    setStep("firstTransaction");
  }

  async function saveFirstTransaction(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const name = txName.trim();
    const amountDisplay = Number(txAmount);
    if (!name) {
      setError(t("onboardingNameRequired"));
      return;
    }
    if (!Number.isFinite(amountDisplay) || amountDisplay <= 0) {
      setError(t("onboardingAmountRequired"));
      return;
    }
    setBusy(true);
    try {
      const amountInBase = Math.round(convertToBase(amountDisplay, currency) * 100) / 100;
      const input: TransactionInput = {
        type: txType,
        name,
        amount: amountInBase,
        date: today(),
        method: null,
        link: null,
        note: txNote.trim() || null,
        image: null,
      };
      saveGuestTransaction(input);
      markOnboardingComplete();
      trackEvent("onboarding_completed"); onFinished();
    } catch (reason) {
      console.error("Onboarding first transaction failed.", reason);
      setError(reason instanceof Error ? reason.message : t("onboardingSaveFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app-shell onboarding-shell">
      <div className="app-frame onboarding-frame">
        {step !== "welcome" && (
          <div className="onboarding-progress" aria-label={t("onboardingProgressLabel")}>
            <div className="onboarding-progress-track">
              <span
                className="onboarding-progress-fill"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
            <p className="onboarding-progress-text">
              {t("onboardingStepOf", { current: progress.current, total: progress.total })}
            </p>
          </div>
        )}

        {step === "welcome" && (
          <section className="panel onboarding-card" aria-labelledby="onboarding-welcome-title">
            <div className="brand onboarding-brand">
              <span className="brand-mark" aria-hidden="true">
                <img className="mark-light" src="/branding/mark-light.png" alt="" />
                <img className="mark-dark" src="/branding/mark-dark.png" alt="" />
              </span>
              MONTRA
            </div>
            <h1 id="onboarding-welcome-title" className="page-title">
              {t("onboardingWelcomeTitle")}
            </h1>
            <p className="onboarding-body">{t("onboardingWelcomeBody")}</p>
            <button className="primary-button wide" type="button" onClick={goLanguage}>
              {t("onboardingGetStarted")}
              <ArrowRight size={16} />
            </button>
            <button className="secondary-button wide" type="button" onClick={onSignIn}>
              {t("onboardingSignIn")}
            </button>
          </section>
        )}

        {step === "language" && (
          <section className="panel onboarding-card" aria-labelledby="onboarding-language-title">
            <p className="eyebrow">{t("onboardingStepLanguage")}</p>
            <h1 id="onboarding-language-title" className="page-title">
              {t("onboardingLanguageTitle")}
            </h1>
            <p className="onboarding-body">{t("onboardingLanguageBody")}</p>
            <div className="onboarding-choice-list" role="listbox" aria-label={t("onboardingLanguageTitle")}>
              {languageOptions.map(([code, label]) => {
                const active =
                  language === code ||
                  language.startsWith(`${code}-`) ||
                  (code === "nb" && (language.startsWith("no") || language.startsWith("nn")));
                return (
                  <button
                    key={code}
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={`onboarding-choice ${active ? "active" : ""}`}
                    onClick={() => setLanguage(code)}
                  >
                    <span>{label}</span>
                    {active && <Check size={16} aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
            <button className="primary-button wide" type="button" onClick={goCurrency}>
              {t("onboardingContinue")}
              <ArrowRight size={16} />
            </button>
          </section>
        )}

        {step === "currency" && (
          <section className="panel onboarding-card" aria-labelledby="onboarding-currency-title">
            <p className="eyebrow">{t("onboardingStepCurrency")}</p>
            <h1 id="onboarding-currency-title" className="page-title">
              {t("onboardingCurrencyTitle")}
            </h1>
            <p className="onboarding-body">{t("onboardingCurrencyBody")}</p>
            <div className="onboarding-choice-list" role="listbox" aria-label={t("onboardingCurrencyTitle")}>
              {currencyChoices.map((choice) => {
                const active = currency === choice.code;
                return (
                  <button
                    key={choice.code}
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={`onboarding-choice ${active ? "active" : ""}`}
                    onClick={() => setCurrency(normalizeDisplayCurrency(choice.code) as DisplayCurrency)}
                  >
                    <span>
                      <strong>{choice.code}</strong>
                      <span className="onboarding-choice-sub">{choice.label}</span>
                    </span>
                    {active && <Check size={16} aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
            <button className="primary-button wide" type="button" onClick={goFirstTx}>
              {t("onboardingContinue")}
              <ArrowRight size={16} />
            </button>
          </section>
        )}

        {step === "firstTransaction" && (
          <section className="panel onboarding-card" aria-labelledby="onboarding-tx-title">
            <p className="eyebrow">{t("onboardingStepTransaction")}</p>
            <h1 id="onboarding-tx-title" className="page-title">
              {t("onboardingTxTitle")}
            </h1>
            <p className="onboarding-body">{t("onboardingTxBody")}</p>
            <form className="stack-md" onSubmit={(e) => void saveFirstTransaction(e)}>
              <div className="onboarding-type-toggle" role="group" aria-label={t("type")}>
                <button
                  type="button"
                  className={`onboarding-type ${txType === "out" ? "active" : ""}`}
                  onClick={() => setTxType("out")}
                >
                  {t("purchase")}
                </button>
                <button
                  type="button"
                  className={`onboarding-type ${txType === "in" ? "active" : ""}`}
                  onClick={() => setTxType("in")}
                >
                  {t("moneyIn")}
                </button>
              </div>
              <label className="form-field">
                <span>{t("name")}</span>
                <input
                  value={txName}
                  onChange={(e) => setTxName(e.target.value)}
                  placeholder={txType === "out" ? t("whatDidYouBuy") : t("whereFrom")}
                  maxLength={120}
                  required
                  autoFocus
                />
              </label>
              <label className="form-field">
                <span>{t("amountNok", { currency })}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </label>
              <label className="form-field">
                <span>{t("note")}</span>
                <input
                  value={txNote}
                  onChange={(e) => setTxNote(e.target.value)}
                  placeholder={t("notePlaceholder")}
                  maxLength={200}
                />
              </label>
              <p className="onboarding-hint">{t("onboardingTxDefaults", { date: today(), currency })}</p>
              {error && <p className="form-error">{error}</p>}
              <button className="primary-button wide" type="submit" disabled={busy}>
                {busy ? t("saving") : t("onboardingSaveAndContinue")}
                {!busy && <ArrowRight size={16} />}
              </button>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}
