import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { ChevronDown, ChevronRight, CloudDownload, Coins, FileUp, Languages, LogOut, Moon, Sun, UserRound, Laptop, PiggyBank, Gift } from "lucide-react";
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
  onWishlist?: () => void;
}

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
  CAD: "CAD",
  AUD: "AUD",
  INR: "INR",
  KRW: "KRW",
};

export function MorePage({ userId, theme, onThemeChange, transactions, onImport, onProfile, onSignOut, onSavingsGoals, onWishlist }: MorePageProps) {
  const { language, setLanguage } = useLanguage();
  const { currency, setCurrency } = useDisplayCurrency();
  const t = useTranslation();
  const fileInput = useRef<HTMLInputElement>(null);
  const [working, setWorking] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void ensureUserPreferences(userId)
      .then((prefs) => {
        if (!active || !prefs) return;
        setLanguage(prefs.locale);
        setCurrency(prefs.currency);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [userId, setLanguage, setCurrency]);

  async function persistLocale(next: PreferenceLocale) {
    setLanguage(next);
    try {
      await saveUserPreferences(userId, { locale: next, currency: normalizeDisplayCurrency(currency) });
    } catch {
      /* still applies for session */
    }
  }

  async function persistCurrency(next: DisplayCurrency) {
    setCurrency(next);
    try {
      await saveUserPreferences(userId, { locale: normalizePreferenceLocale(language), currency: next });
    } catch {
      /* still applies for session */
    }
  }

  function exportBackup() {
    const payload = {
      app: "Montra" as const,
      version: 1,
      exportedAt: new Date().toISOString(),
      transactions,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `montra-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage(t("backupExported"));
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setWorking("import");
    setMessage(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as { transactions?: unknown[] };
      const records = (parsed.transactions ?? []).filter(isImportableTransaction).map((row) => {
        const rawLink = typeof row.link === "string" ? row.link : "";
        const link = row.type === "out" ? validateProductUrl(rawLink) : { url: null, error: null };
        return {
          type: row.type,
          name: row.name,
          amount: Number(row.amount),
          date: row.date,
          method: typeof row.method === "string" ? row.method : null,
          link: link.url,
          note: typeof row.note === "string" ? row.note : null,
        };
      });
      await onImport(records);
      setMessage(t("backupImported"));
    } catch {
      setMessage(t("backupImportFailed"));
    } finally {
      setWorking(null);
    }
  }

  async function signOut() {
    setWorking("signout");
    try {
      await onSignOut();
    } finally {
      setWorking(null);
    }
  }

  return (
    <main className="page-content">
      <div className="page-header">
        <div>
          <p className="greeting">{t("settingsGreeting")}</p>
          <h1 className="page-title">{t("more")}</h1>
        </div>
      </div>

      {message && <p className="stack-notice">{message}</p>}

      <section className="panel settings-list language-settings">
        <div className="setting-row is-static">
          <span className="setting-icon"><Languages size={18} /></span>
          <span className="setting-copy"><strong>{t("language")}</strong><span>{t("languageHint")}</span></span>
        </div>
        <label className="preference-field">
          <span className="visually-hidden">{t("language")}</span>
          <select
            value={language}
            onChange={(e) => void persistLocale(normalizePreferenceLocale(e.target.value))}
          >
            {languageChoices.map((option) => (
              <option key={option.locale} value={option.locale}>{option.label}</option>
            ))}
          </select>
          <ChevronDown size={16} aria-hidden="true" />
        </label>
      </section>

      <section className="panel settings-list currency-settings">
        <div className="setting-row is-static">
          <span className="setting-icon"><Coins size={18} /></span>
          <span className="setting-copy"><strong>{t("displayCurrency")}</strong><span>{t("currencyHint")}</span></span>
        </div>
        <label className="preference-field">
          <span className="visually-hidden">{t("displayCurrency")}</span>
          <select
            value={currency}
            onChange={(e) => void persistCurrency(normalizeDisplayCurrency(e.target.value))}
          >
            {currencyChoices.map((option) => (
              <option key={option.code} value={option.code}>
                {CURRENCY_LABELS[option.code] ?? option.code}
              </option>
            ))}
          </select>
          <ChevronDown size={16} aria-hidden="true" />
        </label>
      </section>

      <section className="panel settings-list stack-panel">
        <div className="setting-row is-static">
          <span className="setting-icon"><Moon size={18} /></span>
          <span className="setting-copy"><strong>{t("appearance")}</strong><span>{t("appearanceHint")}</span></span>
        </div>
        <div className="theme-choices">
          {([
            ["system", t("systemTheme"), Laptop],
            ["light", t("lightTheme"), Sun],
            ["dark", t("darkTheme"), Moon],
          ] as const).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              className={`theme-choice ${theme === value ? "active" : ""}`}
              aria-pressed={theme === value}
              onClick={() => onThemeChange(value)}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="panel settings-list stack-panel">
        <button className="setting-row" type="button" onClick={exportBackup}>
          <span className="setting-icon"><CloudDownload size={18} /></span>
          <span className="setting-copy"><strong>{t("exportBackup")}</strong><span>{t("exportHint")}</span></span>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
        <button className="setting-row" type="button" onClick={() => fileInput.current?.click()} disabled={Boolean(working)}>
          <span className="setting-icon"><FileUp size={18} /></span>
          <span className="setting-copy"><strong>{t("importBackup")}</strong><span>{t("importHint")}</span></span>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
        <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={(e) => void importFile(e)} />
      </section>

      <section className="panel settings-list stack-panel">
        <button className="setting-row" type="button" onClick={() => onSavingsGoals?.()}>
          <span className="setting-icon"><PiggyBank size={18} /></span>
          <span className="setting-copy"><strong>{t("savingsGoals")}</strong><span>{t("savingsGoalsHint")}</span></span>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </section>

      <section className="panel settings-list stack-panel">
        <button className="setting-row" type="button" onClick={() => onWishlist?.()}>
          <span className="setting-icon"><Gift size={18} /></span>
          <span className="setting-copy"><strong>{t("wishlist")}</strong><span>{t("wishlistHint")}</span></span>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </section>

      <section className="panel settings-list stack-panel-lg">
        <button className="setting-row" type="button" onClick={onProfile}>
          <span className="setting-icon"><UserRound size={18} /></span>
          <span className="setting-copy"><strong>{t("profile")}</strong><span>{t("profileHint")}</span></span>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
        <button className="setting-row" type="button" disabled={Boolean(working)} onClick={() => void signOut()}>
          <span className="setting-icon is-danger"><LogOut size={18} /></span>
          <span className="setting-copy"><strong>{t("signOut")}</strong><span>{t("signOutHint")}</span></span>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </section>
    </main>
  );
}
