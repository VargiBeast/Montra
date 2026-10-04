import { useRef, useState, type ChangeEvent } from "react";
import { Archive, ChevronRight, CloudDownload, FileUp, Languages, LogOut, Moon, Sun, UserRound, Laptop } from "lucide-react";
import type { Transaction } from "../types/transaction";
import { isImportableTransaction, validateProductUrl } from "../lib/utils";
import { languageOptions, normalizeLanguage, useLanguage, useTranslation } from "../lib/i18n";

type Theme = "light" | "dark" | "system";
interface MorePageProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  transactions: Transaction[];
  onImport: (records: Array<{ type: "in" | "out"; name: string; amount: number; date: string; method?: string | null; link?: string | null; note?: string | null }>) => Promise<void>;
  onProfile: () => void;
  onSignOut: () => Promise<void>;
}

export function MorePage({ theme, onThemeChange, transactions, onImport, onProfile, onSignOut }: MorePageProps) {
  const { language, setLanguage } = useLanguage();
  const t = useTranslation();
  const fileInput = useRef<HTMLInputElement>(null);
  const [working, setWorking] = useState("");
  const [message, setMessage] = useState("");

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
        <div className="setting-row" style={{ cursor: "default" }}>
          <span className="setting-icon"><Languages size={18} /></span>
          <span className="setting-copy"><strong>{t("language")}</strong><span>{t("chooseLanguage")}</span></span>
        </div>
        <div className="locale-field">
          <input
            id="montra-language"
            type="text"
            list="montra-language-options"
            autoComplete="off"
            aria-label={t("localeCode")}
            value={language}
            onChange={(event) => {
              const next = normalizeLanguage(event.target.value);
              if (next) setLanguage(next);
            }}
          />
          <datalist id="montra-language-options">
            {languageOptions.map(([locale, name]) => <option key={locale} value={locale}>{name}</option>)}
          </datalist>
        </div>
        <p className="settings-note">{t("languageFallback")}</p>
      </section>
      <section className="panel settings-list currency-settings">
        <div className="setting-row" style={{ cursor: "default" }}>
          <span className="setting-icon"><span aria-hidden="true">NOK</span></span>
          <span className="setting-copy"><strong>{t("currency")}</strong><span>{t("originalCurrency")}</span></span>
        </div>
        <p className="settings-note">{t("currencySafety")}</p>
      </section>
      <section className="panel settings-list" style={{ marginBottom: 17 }}>
        <div className="setting-row" style={{ cursor: "default" }}>
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
      <section className="panel settings-list" style={{ marginBottom: 17 }}>
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
      <section className="panel settings-list">
        <button className="setting-row" type="button" onClick={onProfile}>
          <span className="setting-icon"><UserRound size={18} /></span>
          <span className="setting-copy"><strong>{t("profile")}</strong><span>{t("accountDetails")}</span></span>
          <span className="setting-end"><ChevronRight size={17} /></span>
        </button>
        <button className="setting-row" type="button" disabled={Boolean(working)} onClick={() => void signOut()}>
          <span className="setting-icon" style={{ color: "var(--coral)", background: "var(--coral-soft)" }}><LogOut size={18} /></span>
          <span className="setting-copy"><strong>{working === "signout" ? t("signingOut") : t("signOut")}</strong><span>{t("signOutMontra")}</span></span>
          <span className="setting-end"><ChevronRight size={17} /></span>
        </button>
      </section>
      {message && <div className="notice" role="status" style={{ marginTop: 16 }}><Archive size={14} style={{ verticalAlign: "middle", marginRight: 7 }} />{message}</div>}
    </main>
  );
}