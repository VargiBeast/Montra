import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { ChevronDown, ChevronRight, CloudDownload, Coins, FileUp, Languages, LogOut, Moon, Sun, UserRound, Laptop } from "lucide-react";
import type { Transaction } from "../types/transaction";
import { isImportableTransaction, validateProductUrl } from "../lib/utils";
import { useLanguage, useTranslation } from "../lib/i18n";
import { fillMissingCopy } from "../lib/missingCopy";
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

export function MorePage({ userId, theme, onThemeChange, transactions, onImport, onProfile, onSignOut }: MorePageProps) {
  const { language, setLanguage } = useLanguage();
  const { currency, setCurrency } = useDisplayCurrency();
  const translate = useTranslation();
  const t = (key: string, values?: Record<string, string | number>) => fillMissingCopy(key, translate(key, values), language);
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
      setMessage(t("preferencesSaved"));
    } catch {
      setMessage(t("preferencesSaveFailed"));
    }
  }

  async function persistCurrency(next: DisplayCurrency) {
    setCurrency(next);
    try {
      await saveUserPreferences(userId, { locale: normalizePreferenceLocale(language), currency: next });
      setMessage(t("preferencesSaved"));
    } catch {
      setMessage(t("preferencesSaveFailed"));
    }
  }

  function handleThemeChange(next: Theme) {
    onThemeChange(next);
    setMessage(
      t("appearanceSelected", {
        appearance: next === "light" ? t("lightTheme") : next === "dark" ? t("darkTheme") : t("systemTheme"),
      }),
    );
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
    setMessage(t("backupExported", { count: transactions.length }));
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setWorking("import");
    setMessage(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as { transactions?: unknown[]; app?: string; version?: number };
      if (parsed.app && parsed.app !== "Montra") {
        setMessage(t("backupNotRecognized"));
        return;
      }
      if (parsed.version != null && parsed.version !== 1) {
        setMessage(t("backupUnsupported"));
        return;
      }
      const raw = parsed.transactions ?? [];
      if (!Array.isArray(raw) || raw.length === 0) {
        setMessage(t("backupEmpty"));
        return;
      }
      const records = raw.filter(isImportableTransaction).map((row) => {
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
      if (records.length === 0) {
        setMessage(t("backupInvalid"));
        return;
      }
      await onImport(records);
      setMessage(t("backupImported", { count: records.length }));
    } catch {
      setMessage(t("backupReadFailed"));
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

  const currentLanguageLabel =
    languageChoices.find((option) => option.locale === normalizePreferenceLocale(language))?.label ?? language;

  return (
    <main className="page-content more-page">
      <div className="page-header">
        <div>
          <p className="greeting">{t("yourSpace")}</p>
          <h1 className="page-title">{t("more")}</h1>
        </div>
      </div>

      {message && (
        <p className="stack-notice" role="status" aria-live="polite">
          {message}
        </p>
      )}

      <p className="section-label">{t("sectionPreferences")}</p>
      <section className="panel settings-list more-preferences" aria-label={t("sectionPreferences")}>
        <div className="setting-row is-static">
          <span className="setting-icon" aria-hidden="true">
            <Languages size={18} />
          </span>
          <span className="setting-copy">
            <strong>{t("language")}</strong>
            <span>{t("chooseLanguage")}</span>
          </span>
          <span className="setting-value" aria-hidden="true">
            {currentLanguageLabel}
          </span>
        </div>
        <label className="preference-field">
          <span className="visually-hidden">{t("language")}</span>
          <select
            value={normalizePreferenceLocale(language)}
            onChange={(e) => void persistLocale(normalizePreferenceLocale(e.target.value))}
            aria-label={t("language")}
          >
            {languageChoices.map((option) => (
              <option key={option.locale} value={option.locale}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown size={16} aria-hidden="true" />
        </label>

        <div className="setting-row is-static">
          <span className="setting-icon" aria-hidden="true">
            <Coins size={18} />
          </span>
          <span className="setting-copy">
            <strong>{t("originalCurrency")}</strong>
            <span>{t("currencySafety")}</span>
          </span>
          <span className="setting-value" aria-hidden="true">
            {currency}
          </span>
        </div>
        <label className="preference-field">
          <span className="visually-hidden">{t("originalCurrency")}</span>
          <select
            value={currency}
            onChange={(e) => void persistCurrency(normalizeDisplayCurrency(e.target.value))}
            aria-label={t("originalCurrency")}
          >
            {currencyChoices.map((option) => (
              <option key={option.code} value={option.code}>
                {option.code} — {option.label}
              </option>
            ))}
          </select>
          <ChevronDown size={16} aria-hidden="true" />
        </label>

        <div className="setting-row is-static">
          <span className="setting-icon" aria-hidden="true">
            <Moon size={18} />
          </span>
          <span className="setting-copy">
            <strong>{t("appearance")}</strong>
            <span>{t("appearanceHint")}</span>
          </span>
        </div>
        <div className="theme-choices" role="group" aria-label={t("appearance")}>
          {(
            [
              ["system", t("systemTheme"), Laptop],
              ["light", t("lightTheme"), Sun],
              ["dark", t("darkTheme"), Moon],
            ] as const
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              className={`theme-choice ${theme === value ? "active" : ""}`}
              aria-pressed={theme === value}
              onClick={() => handleThemeChange(value)}
            >
              <Icon size={16} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </section>

      <p className="section-label">{t("sectionData")}</p>
      <section className="panel settings-list more-data" aria-label={t("sectionData")}>
        <button className="setting-row" type="button" onClick={exportBackup}>
          <span className="setting-icon" aria-hidden="true">
            <CloudDownload size={18} />
          </span>
          <span className="setting-copy">
            <strong>{t("exportBackup")}</strong>
            <span>{t("saveCopy")}</span>
          </span>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
        <button
          className="setting-row"
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={Boolean(working)}
        >
          <span className="setting-icon" aria-hidden="true">
            <FileUp size={18} />
          </span>
          <span className="setting-copy">
            <strong>{working === "import" ? t("importingBackup") : t("importBackup")}</strong>
            <span>{t("restoreCopy")}</span>
          </span>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => void importFile(e)}
        />
      </section>

      <p className="section-label">{t("sectionAccount")}</p>
      <section className="panel settings-list more-account stack-panel-lg" aria-label={t("sectionAccount")}>
        <button className="setting-row" type="button" onClick={onProfile}>
          <span className="setting-icon" aria-hidden="true">
            <UserRound size={18} />
          </span>
          <span className="setting-copy">
            <strong>{t("profile")}</strong>
            <span>{t("accountDetails")}</span>
          </span>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
        <button className="setting-row" type="button" disabled={Boolean(working)} onClick={() => void signOut()}>
          <span className="setting-icon is-danger" aria-hidden="true">
            <LogOut size={18} />
          </span>
          <span className="setting-copy">
            <strong>{working === "signout" ? t("signingOut") : t("signOut")}</strong>
            <span>{t("signOutMontra")}</span>
          </span>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </section>
    </main>
  );
}
