import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  ChevronDown,
  ChevronRight,
  CloudDownload,
  Coins,
  FileUp,
  Gift,
  Languages,
  LogOut,
  Moon,
  PiggyBank,
  Sparkles,
  Sun,
  UserRound,
  Laptop,
  CalendarClock,
} from "lucide-react";
import type { Transaction } from "../types/transaction";
import { isImportableTransaction, validateProductUrl } from "../lib/utils";
import { useLanguage, useTranslation } from "../lib/i18n";
import { resolveRecurringCopy } from "../lib/recurringCopy";
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
import {
  readStoredConsent,
  updateAnalyticsConsent,
  type AnalyticsConsent,
} from "../lib/gtm";

type Theme = "light" | "dark" | "system";

type ImportRecord = {
  type: "in" | "out";
  name: string;
  amount: number;
  date: string;
  method?: string | null;
  link?: string | null;
  note?: string | null;
};

interface MorePageProps {
  userId: string;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  transactions: Transaction[];
  onImport: (records: ImportRecord[]) => Promise<void>;
  onProfile: () => void;
  onSignOut: () => Promise<void>;
  onSavingsGoals?: () => void;
  onRecurring?: () => void;
  onWishlist?: () => void;
  onOpenPlus?: () => void;
  hasPlus?: boolean;
}

export function MorePage({
  userId,
  theme,
  onThemeChange,
  transactions,
  onImport,
  onProfile,
  onSignOut,
  onSavingsGoals,
  onRecurring,
  onWishlist,
  onOpenPlus,
  hasPlus = false,
}: MorePageProps) {
  const { language, setLanguage } = useLanguage();
  const { currency, setCurrency } = useDisplayCurrency();
  const translate = useTranslation();
  const t = (key: string, values?: Record<string, string | number>) =>
    fillMissingCopy(key, translate(key, values), language);
  const fileInput = useRef<HTMLInputElement>(null);
  const [working, setWorking] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<ImportRecord[] | null>(null);
  const [analyticsConsent, setAnalyticsConsent] = useState<AnalyticsConsent>(() =>
    typeof window !== "undefined" ? readStoredConsent() : null,
  );

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
      setMessage(t("currencyDisplayChanged", { currency: next }));
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
    setWorking("parse");
    setMessage(null);
    setPendingImport(null);
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
      setPendingImport(records);
    } catch {
      setMessage(t("backupReadFailed"));
    } finally {
      setWorking(null);
    }
  }

  async function confirmImport() {
    if (!pendingImport || pendingImport.length === 0) return;
    setWorking("import");
    setMessage(null);
    try {
      const count = pendingImport.length;
      await onImport(pendingImport);
      setPendingImport(null);
      setMessage(t("backupImported", { count }));
    } catch {
      setMessage(t("backupReadFailed"));
    } finally {
      setWorking(null);
    }
  }

  function cancelImport() {
    setPendingImport(null);
    setMessage(null);
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

      {pendingImport && (
        <section className="panel backup-import-preview" aria-label={t("backupPreviewTitle")} role="dialog" aria-modal="true">
          <h2 className="backup-preview-title">{t("backupPreviewTitle")}</h2>
          <p className="backup-preview-body">{t("backupPreviewBody")}</p>
          <p className="backup-preview-count" role="status">
            {t("backupPreviewCount", { count: pendingImport.length })}
          </p>
          <div className="backup-preview-lists">
            <div>
              <p className="eyebrow">{t("backupPreviewIncluded")}</p>
              <ul className="backup-preview-list">
                <li>{t("backupPreviewCount", { count: pendingImport.length })}</li>
              </ul>
            </div>
            <div>
              <p className="eyebrow">{t("backupPreviewExcluded")}</p>
              <ul className="backup-preview-list is-excluded">
                <li>{t("backupPreviewExcludedGoals")}</li>
                <li>{t("backupPreviewExcludedWishlist")}</li>
                <li>{t("backupPreviewExcludedReceipts")}</li>
              </ul>
            </div>
          </div>
          <div className="backup-preview-actions">
            <button
              type="button"
              className="primary-button"
              disabled={Boolean(working)}
              onClick={() => void confirmImport()}
            >
              {working === "import" ? t("backupImporting") : t("backupConfirmImport")}
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={Boolean(working)}
              onClick={cancelImport}
            >
              {t("backupCancelImport")}
            </button>
          </div>
        </section>
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

      {(onSavingsGoals || onWishlist || onRecurring) && (
        <>
          <p className="section-label">{t("planning")}</p>
          <section className="panel settings-list more-planning" aria-label={t("planning")}>
            {onRecurring && (
              <button className="setting-row" type="button" onClick={onRecurring}>
                <span className="setting-icon" aria-hidden="true">
                  <CalendarClock size={18} />
                </span>
                <span className="setting-copy">
                  <strong>{resolveRecurringCopy(language, "title")}</strong>
                  <span>{resolveRecurringCopy(language, "hint")}</span>
                </span>
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            )}
            {onSavingsGoals && (
              <button className="setting-row" type="button" onClick={onSavingsGoals}>
                <span className="setting-icon" aria-hidden="true">
                  <PiggyBank size={18} />
                </span>
                <span className="setting-copy">
                  <strong>{t("savingsGoals")}</strong>
                  <span>{t("savingsGoalsHint")}</span>
                </span>
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            )}
            {onWishlist && (
              <button className="setting-row" type="button" onClick={onWishlist}>
                <span className="setting-icon" aria-hidden="true">
                  <Gift size={18} />
                </span>
                <span className="setting-copy">
                  <strong>{t("wishlist")}</strong>
                  <span>{t("wishlistHint")}</span>
                </span>
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            )}
          </section>
        </>
      )}

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
          disabled={Boolean(working) || Boolean(pendingImport)}
        >
          <span className="setting-icon" aria-hidden="true">
            <FileUp size={18} />
          </span>
          <span className="setting-copy">
            <strong>
              {working === "parse" || working === "import" ? t("importingBackup") : t("importBackup")}
            </strong>
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

      {onOpenPlus && (
        <>
          <p className="section-label">{t("plusTitle")}</p>
          <section className="panel settings-list more-plus" aria-label={t("plusTitle")}>
            <button className="setting-row" type="button" onClick={onOpenPlus}>
              <span className="setting-icon" aria-hidden="true">
                <Sparkles size={18} />
              </span>
              <span className="setting-copy">
                <strong>{t("plusTitle")}</strong>
                <span>{hasPlus ? t("plusActiveBadge") : t("plusValueTitle")}</span>
              </span>
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </section>
        </>
      )}

      <p className="section-label">{t("consentManage")}</p>
      <section className="panel settings-list more-consent" aria-label={t("consentManage")}>
        <div className="setting-row is-static">
          <span className="setting-copy">
            <strong>{t("consentManage")}</strong>
            <span>{t("consentManageHint")}</span>
          </span>
          <span className="setting-value">
            {analyticsConsent === "granted"
              ? t("consentStatusGranted")
              : analyticsConsent === "denied"
                ? t("consentStatusDenied")
                : "—"}
          </span>
        </div>
        <div className="theme-choices consent-choices" role="group" aria-label={t("consentManage")}>
          <button
            type="button"
            className={`theme-choice ${analyticsConsent === "granted" ? "active" : ""}`}
            aria-pressed={analyticsConsent === "granted"}
            onClick={() => {
              updateAnalyticsConsent(true);
              setAnalyticsConsent("granted");
              setMessage(t("consentStatusGranted"));
            }}
          >
            {t("consentAccept")}
          </button>
          <button
            type="button"
            className={`theme-choice ${analyticsConsent === "denied" ? "active" : ""}`}
            aria-pressed={analyticsConsent === "denied"}
            onClick={() => {
              updateAnalyticsConsent(false);
              setAnalyticsConsent("denied");
              setMessage(t("consentStatusDenied"));
            }}
          >
            {t("consentReject")}
          </button>
        </div>
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
