import { useRef, useState, type ChangeEvent } from "react";
import { Archive, ChevronRight, CloudDownload, FileUp, LogOut, Moon, Sun, UserRound, Laptop } from "lucide-react";
import type { Transaction } from "../types/transaction";
import { isImportableTransaction, validateProductUrl } from "../lib/utils";

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
  const fileInput = useRef<HTMLInputElement>(null);
  const [working, setWorking] = useState("");
  const [message, setMessage] = useState("");

  function exportBackup() {
    const backup = {
      app: "Saldo",
      version: 4,
      exportedAt: new Date().toISOString(),
      transactions: transactions.map(({ type, name, amount, date, method, link, note }) => ({ type, name, amount, date, method, link, note })),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `saldo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(`${transactions.length} ${transactions.length === 1 ? "transaction" : "transactions"} exported.`);
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
        throw new Error("This file does not look like a Saldo backup.");
      }
      if (!("app" in parsed) || parsed.app !== "Saldo" || !("version" in parsed) || ![1, 3, 4].includes(Number(parsed.version))) {
        throw new Error("This Saldo backup version isn’t supported.");
      }
      const source = parsed.transactions as unknown[];
      if (!source.length) throw new Error("This backup has no transactions to import.");
      if (!source.every(isImportableTransaction)) throw new Error("Some records are incomplete or invalid. Nothing was imported.");
      const records = source.map((item) => {
        const record = item as Record<string, unknown>;
        const rawLink = typeof record.link === "string" ? record.link : "";
        const type = record.type as "in" | "out";
        const productLink = type === "out"
          ? validateProductUrl(rawLink)
          : { url: null, error: null };
        if (productLink.error) {
          throw new Error(`A product link in this backup is invalid. ${productLink.error}`);
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
      setMessage(`${records.length} ${records.length === 1 ? "transaction" : "transactions"} imported.`);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "We couldn’t read this backup.");
    } finally {
      setWorking("");
    }
  }

  async function signOut() {
    setWorking("signout");
    try { await onSignOut(); } catch (reason) { setMessage(reason instanceof Error ? reason.message : "We couldn’t sign out."); }
    finally { setWorking(""); }
  }

  return (
    <main className="page-content">
      <div className="page-header"><div><p className="greeting">Your space, your way</p><h1 className="page-title">More</h1></div></div>
      <section className="panel settings-list" style={{ marginBottom: 17 }}>
        <div className="setting-row" style={{ cursor: "default" }}>
          <span className="setting-icon"><Sun size={18} /></span>
          <span className="setting-copy"><strong>Appearance</strong><span>Choose the light that feels right</span></span>
        </div>
        <div className="theme-choices">
          {([
            ["light", "Light", Sun],
            ["dark", "Dark", Moon],
            ["system", "System", Laptop],
          ] as const).map(([value, label, Icon]) => <button key={value} type="button" className={`theme-choice ${theme === value ? "active" : ""}`} aria-pressed={theme === value} onClick={() => onThemeChange(value)}>
            <span className="theme-swatch"><i /><i /></span><span>{label}</span><Icon size={14} />
          </button>)}
        </div>
      </section>
      <section className="panel settings-list" style={{ marginBottom: 17 }}>
        <button className="setting-row" type="button" onClick={exportBackup}>
          <span className="setting-icon"><CloudDownload size={18} /></span>
          <span className="setting-copy"><strong>Export backup</strong><span>Save a copy of your transaction details</span></span>
          <span className="setting-end"><ChevronRight size={17} /></span>
        </button>
        <button className="setting-row" type="button" onClick={() => fileInput.current?.click()} disabled={Boolean(working)}>
          <span className="setting-icon"><FileUp size={18} /></span>
          <span className="setting-copy"><strong>{working === "import" ? "Importing backup…" : "Import backup"}</strong><span>Restore transaction details from JSON</span></span>
          <span className="setting-end"><ChevronRight size={17} /></span>
        </button>
        <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={importFile} />
      </section>
      <section className="panel settings-list">
        <button className="setting-row" type="button" onClick={onProfile}>
          <span className="setting-icon"><UserRound size={18} /></span>
          <span className="setting-copy"><strong>Profile</strong><span>Account details and sign out</span></span>
          <span className="setting-end"><ChevronRight size={17} /></span>
        </button>
        <button className="setting-row" type="button" disabled={Boolean(working)} onClick={() => void signOut()}>
          <span className="setting-icon" style={{ color: "var(--coral)", background: "var(--coral-soft)" }}><LogOut size={18} /></span>
          <span className="setting-copy"><strong>{working === "signout" ? "Signing out…" : "Sign out"}</strong><span>Sign out of your Saldo account</span></span>
          <span className="setting-end"><ChevronRight size={17} /></span>
        </button>
      </section>
      {message && <div className="notice" role="status" style={{ marginTop: 16 }}><Archive size={14} style={{ verticalAlign: "middle", marginRight: 7 }} />{message}</div>}
    </main>
  );
}