import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Archive, ChevronDown, ChevronRight, CloudDownload, Coins, FileUp, Languages, LogOut, Moon, Sun, UserRound, Laptop, PiggyBank } from "lucide-react";
import type { Transaction } from "../types/transaction";
import { isImportableTransaction, validateProductUrl } from "../lib/utils";
import { useLanguage, useTranslation } from "../lib/i18n";
import { useDisplayCurrency } from "../lib/currency";
import {
  currencyChoices,
  ensureUserPreferences,
  languageChoices,
  normalizeDisplayCurrency,
  normalizePreferenceLocale,
  saveUserPreferences,
  type DisplayCurrency,
  type PreferenceLocale,
} from "../lib/preferences";

type Theme = "light" | "dark" | "system";
interface MorePageProps {
  userId: string;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  transactions: Transaction[];
  onImport: (records: Array<{ type: "in" | "out"; name: string; amount: number; date: string; method?: string | null; link?: string | null; note?: string | null }>) => Promise<void>;
  onProfile: () => void;
  onSignOut: () => Promise<void>;
  onSavingsGoals?: () => void;
}

/** Short native-friendly labels for currencies (avoid English-only long names). */
const CURRENCY_LABELS: Record<string, string> = {
  NOK: "NOK",
  USD: "USD",
  EUR: "EUR",
  GBP: "GBP",
  SEK: "SEK",
  DKK: "DKK",
  CHF: "CHF",
  JPY: "JPY",
  CNY: "CNY",
  PLN: "PLN",
  CZK: "CZK",
  TRY: "TRY",
  KRW: "KRW",
  CAD: "CAD",
  AUD: "AUD",
  INR: "INR",
};

export function MorePage({ userId, theme, onThemeChange, transactions, onImport, onProfile, onSignOut, onSavingsGoals }: MorePageProps) {
  const { language, setLanguage } = useLanguage();
  const { currency, setCurrency } = useDisplayCurrency();
  const t = useTranslation();
  const fileInput = useRef<HTMLInputElement>(null);
  const [working, setWorking] = useState("");
  const [message, setMessage] = useState("");
  const [preferencesReady, setPreferencesReady] = useState(false);
  const selectedLocale = normalizePreferenceLocale(language);

  useEffect(() => {
    let active = true;
    setPreferencesReady(false);
    void ensureUserPreferences(userId)
      .then((preferences) => {
        if (!active) return;
        setLanguage(preferences.locale);
        setCurrency(preferences.currency);
        setPreferencesReady(true);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        console.error("Could not load Montra preferences.", reason);
        setMessage("preferencesLoadFailed");
        setPreferencesReady(true);
      });
    return () => { active = false; };
  }, [setCurrency, setLanguage, userId]);

  async function persist(next: { locale: PreferenceLocale; currency: DisplayCurrency }) {
    setWorking("preferences");
    try {
      await saveUserPreferences(userId, next);
      setMessage(t("preferencesSaved"));
    } catch (reason) {
      console.error("Could not save Montra preferences.", reason);
      setMessage(t("preferencesSaveFailed"));
      throw reason;
    } finally {
      setWorking("");
    }
  }

  async function changeLanguage(next: PreferenceLocale) {
    const previous = selectedLocale;
    setLanguage(next);
    try {
      await persist({ locale: next, currency });
    } catch {
      setLanguage(previous);
    }
  }

  async function changeCurrency(next: DisplayCurrency) {
    const previous = currency;
    setCurrency(next);
    try {
      await persist({ locale: selectedLocale, currency: next });
    } catch {
      setCurrency(previous);
    }
  }

  function exportBackup() {
    const backup = {
      app: "Montra",
      version: 5,
      exportedAt: new Date().toISOString(),
      transactions: transactions.map(({ type, name, amount, date, method, link, note }) => ({ type, name, amount, date, method, link, note })),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `montra-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(t("backupExported", { count: transactions.length }));
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setMessage("");
    setWorking("import");
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!parsed || typeof parsed !== "object" || !("transactions" in parsed) || !Array.isArray(parsed.transactions)) {
        throw new Error(t("backupNotRecognized"));
      }
      if (!("app" in parsed) || !["Saldo", "Montra"].includes(String(parsed.app)) || !("version" in parsed) || ![1, 3, 4, 5].includes(Number(parsed.version))) {
        throw new Error(t("backupUnsupported"));
      }
      const source = parsed.transactions as unknown[];
      if (!source.length) throw new Error(t("backupEmpty"));
      if (!source.every(isImportableTransaction)) throw new Error(t("backupInvalid"));
      const records = source.map((item) => {
        const record = item as Record<string, unknown>;
        const rawLink = typeof record.link === "string" ? record.link : "";
        const type = record.type as "in" | "out";
        const productLink = type === "out"
          ? validateProductUrl(rawLink)
          : { url: null, error: null };
        if (productLink.error) {
          throw new Error(t("backupBadLink"));
        }
        return {
          type,
          name: (record.name as string).trim(),
          amount: Number(record.amount),
          date: record.date as string,
          method: typeof record.method === "string" ? record.method : null,
          link: productLink.url,
          note: typeof record.note === "string" ? record.note : null,
        };
      });
      await onImport(records);
      setMessage(t("backupImported", { count: records.length }));
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : t("backupReadFailed"));
    } finally {
      setWorking("");
    }
  }

  async function signOut() {
    setWorking("signout");
    try { await onSignOut(); } catch (reason) { setMessage(reason instanceof Error ? reason.message : t("signOutFailed")); }
    finally { setWorking(""); }
  }

  return (
    <main className="page-content">
      <div className="page-header"><div><p className="greeting">{t("yourSpace")}</p><h1 className="page-title">{t("more")}</h1></div></div>
      <section className="panel settings-list language-settings">
        <div className="setting-row is-static">
          <span className="setting-icon"><Languages size={18} /></span>
          <span className="setting-copy"><strong>{t("language")}</strong><span>{t("chooseLanguage")}</span></span>
        </div>
        <label className="preference-field">
          <span className="visually-hidden">{t("language")}</span>
          <select
            id="montra-language"
            value={selectedLocale}
            disabled={!preferencesReady || working === "preferences"}
            onChange={(event) => void changeLanguage(normalizePreferenceLocale(event.target.value))}
          >
            {languageChoices.map((option) => <option key={option.locale} value={option.locale}>{option.label}</option>)}
          </select>
          <ChevronDown size={16} aria-hidden="true" />
        </label>
        <p className="settings-note">{t("languageFallback")}</p>
      </section>
      <section className="panel settings-list currency-settings">
        <div className="setting-row is-static">
          <span className="setting-icon"><Coins size={18} /></span>
          <span className="setting-copy"><strong>{t("currency")}</strong><span>{t("originalCurrency")}</span></span>
        </div>
        <label className="preference-field">
          <span className="visually-hidden">{t("currency")}</span>
          <select
            id="montra-currency"
            value={currency}
            disabled={!preferencesReady || working === "preferences"}
            onChange={(event) => void changeCurrency(normalizeDisplayCurrency(event.target.value))}
          >
            {currencyChoices.map((option) => (
              <option key={option.code} value={option.code}>
                {CURRENCY_LABELS[option.code] ?? option.code}
              </option>
            ))}
          </select>
          <ChevronDown size={16} aria-hidden="true" />
        </label>
        <p className="settings-note">{t("currencySafety")}</p>
      </section>
      <section className="panel settings-list stack-panel">
        <div className="setting-row is-static">
          <span className="setting-icon"><Sun size={18} /></span>
          <span className="setting-copy"><strong>{t("appearance")}</strong><span>{t("appearanceHint")}</span></span>
        </div>
        <div className="theme-choices">
          {([
            ["light", "light", Sun],
            ["dark", "dark", Moon],
            ["system", "system", Laptop],
          ] as const).map(([value, label, Icon]) => <button key={value} type="button" className={`theme-choice ${theme === value ? "active" : ""}`} aria-pressed={theme === value} onClick={() => onThemeChange(value)}>
            <span className="theme-swatch"><i /><i /></span><span>{t(label)}</span><Icon size={14} />
          </button>)}
        </div>
      </section>
      <section className="panel settings-list stack-panel">
        <button className="setting-row" type="button" onClick={exportBackup}>
          <span className="setting-icon"><CloudDownload size={18} /></span>
          <span className="setting-copy"><strong>{t("exportBackup")}</strong><span>{t("saveCopy")}</span></span>
          <span className="setting-end"><ChevronRight size={17} /></span>
        </button>
        <button className="setting-row" type="button" onClick={() => fileInput.current?.click()} disabled={Boolean(working)}>
          <span className="setting-icon"><FileUp size={18} /></span>
          <span className="setting-copy"><strong>{working === "import" ? t("importingBackup") : t("importBackup")}</strong><span>{t("restoreCopy")}</span></span>
          <span className="setting-end"><ChevronRight size={17} /></span>
        </button>
        <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={importFile} />
      </section>
            <section className="panel settings-list stack-panel">
        <button className="setting-row" type="button" onClick={() => onSavingsGoals?.()}>
          <span className="setting-icon"><PiggyBank size={18} /></span>
          <span className="setting-copy"><strong>{t("savingsGoals")}</strong><span>{t("savingsGoalsHint")}</span></span>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </section>
<section className="panel settings-list stack-panel-lg">
        <button className="setting-row" type="button" onClick={onProfile}>
          <span className="setting-icon"><UserRound size={18} /></span>
          <span className="setting-copy"><strong>{t("profile")}</strong><span>{t("accountDetails")}</span></span>
          <span className="setting-end"><ChevronRight size={17} /></span>
        </button>
        <button className="setting-row" type="button" disabled={Boolean(working)} onClick={() => void signOut()}>
          <span className="setting-icon is-danger"><LogOut size={18} /></span>
          <span className="setting-copy"><strong>{working === "signout" ? t("signingOut") : t("signOut")}</strong><span>{t("signOutMontra")}</span></span>
          <span className="setting-end"><ChevronRight size={17} /></span>
        </button>
      </section>
      {message && <div className="notice stack-notice" role="status"><Archive size={14} style={{ verticalAlign: "middle", marginRight: 7 }} />{message.startsWith("preferences") ? t(message) : message}</div>}
    </main>
  );
}
