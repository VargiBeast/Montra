import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTransactions } from "../../hooks/useTransactions";
import { useDisplayCurrency } from "../../lib/currency";
import { readLanguage, useTranslation } from "../../lib/i18n";
import { formatDate, formatMoney } from "../../lib/utils";
import type { Transaction, TransactionInput, TransactionType } from "../../types/transaction";
import { PageHeader } from "../ui/PageHeader";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { LoadingState } from "../ui/LoadingState";
import { Button } from "../ui/Button";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function TransactionRow({
  tx,
  currency,
  convertFromBase,
  onEdit,
  onDelete,
  t,
}: {
  tx: Transaction;
  currency: string;
  convertFromBase: (amountInBase: number, toCurrency?: string) => number;
  onEdit: () => void;
  onDelete: () => void;
  t: (k: string, f: string) => string;
}) {
  const isIn = tx.type === "in";
  const locale = readLanguage();
  const displayAmount = convertFromBase(Number(tx.amount), currency);
  const amountLabel = formatMoney(Number(tx.amount), currency, locale, displayAmount);

  return (
    <div
      className="m-anim-in"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 0",
        borderBottom: "1px solid var(--m-border)",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: isIn ? "rgba(52, 211, 153, 0.15)" : "rgba(255,255,255,0.06)",
          color: isIn ? "var(--m-positive)" : "var(--m-text-secondary)",
          display: "grid",
          placeItems: "center",
          fontWeight: 700,
          flexShrink: 0,
        }}
        aria-hidden
      >
        {isIn ? "↓" : "↑"}
      </div>
      <button
        type="button"
        onClick={onEdit}
        style={{
          flex: 1,
          minWidth: 0,
          textAlign: "left",
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          color: "inherit",
        }}
      >
        <div style={{ fontWeight: 600, fontSize: "var(--m-text-sm)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {tx.name}
        </div>
        <div style={{ fontSize: "var(--m-text-xs)", color: "var(--m-text-muted)", marginTop: 2 }}>
          {formatDate(tx.date)}
          {tx.method ? ` · ${tx.method}` : ""}
          {" · "}
          {isIn ? t("txReceive", "Receive") : t("txSend", "Send")}
        </div>
      </button>
      <div
        style={{
          fontWeight: 600,
          fontSize: "var(--m-text-sm)",
          color: isIn ? "var(--m-positive)" : "var(--m-text)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {isIn ? "+" : "−"}
        {amountLabel.replace(/^[^\d-]*/, "")}
      </div>
      <button
        type="button"
        aria-label={t("delete", "Delete")}
        onClick={onDelete}
        style={{ background: "none", border: "none", color: "var(--m-text-muted)", cursor: "pointer", padding: 4, fontSize: 16 }}
      >
        ×
      </button>
    </div>
  );
}

export function ActivityPage() {
  const auth = useAuth();
  const location = useLocation();
  const translate = useTranslation();
  const t = (key: string, fallback: string) => {
    const v = translate(key);
    return v && v !== "—" && v !== key ? v : fallback;
  };
  const { transactions, isLoading, error, refresh, save, remove } = useTransactions(auth.user?.id);
  const { currency, convertFromBase, convertToBase, ratesReady } = useDisplayCurrency();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [type, setType] = useState<TransactionType>("out");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [method, setMethod] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    const st = location.state as { openCreate?: boolean } | null;
    if (st?.openCreate) openCreate();
  }, [location.state]);

  function openCreate() {
    setEditing(null);
    setType("out");
    setName("");
    setAmount("");
    setDate(todayISO());
    setMethod("");
    setNote("");
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(tx: Transaction) {
    setEditing(tx);
    setType(tx.type);
    setName(tx.name);
    setAmount(String(convertFromBase(Number(tx.amount), currency)));
    setDate(tx.date.slice(0, 10));
    setMethod(tx.method ?? "");
    setNote(tx.note ?? "");
    setFormError(null);
    setShowForm(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const num = Number(amount);
    if (!name.trim()) {
      setFormError(t("validationNameRequired", "Name is required."));
      return;
    }
    if (!Number.isFinite(num) || num <= 0) {
      setFormError(t("validationAmount", "Enter a valid amount greater than zero."));
      return;
    }
    const amountInBase = convertToBase(num, currency);
    const input: TransactionInput = {
      type,
      name: name.trim(),
      amount: amountInBase,
      date,
      method: method.trim() || null,
      link: editing?.link ?? null,
      note: note.trim() || null,
      image: null,
    };
    setBusy(true);
    try {
      await save(input, editing ?? undefined);
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t("saveFailed", "Could not save."));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(tx: Transaction) {
    if (!window.confirm(t("confirmDeleteTx", `Delete “${tx.name}”?`).replace("{name}", tx.name))) return;
    setBusy(true);
    try {
      await remove(tx);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t("deleteFailed", "Could not delete."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="m-anim-in">
      <PageHeader
        title={t("navActivity", "Activity")}
        subtitle={t("activitySubtitle", "Your transactions")}
        action={
          <Button size="sm" onClick={openCreate}>
            + {t("add", "Add")}
          </Button>
        }
      />

      {showForm ? (
        <Card padding="lg" className="m-anim-scale" style={{ marginBottom: 16 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 16 }}>
            {editing ? t("editTransaction", "Edit transaction") : t("newTransaction", "New transaction")}
          </h2>
          <form onSubmit={(e) => void submit(e)}>
            <div className="m-field" style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => setType("in")} style={{ flex: 1, padding: 12, borderRadius: 12, border: type === "in" ? "1px solid var(--m-accent)" : "1px solid var(--m-border)", background: type === "in" ? "var(--m-accent-soft)" : "transparent", color: type === "in" ? "var(--m-positive)" : "var(--m-text-muted)", fontWeight: 600, cursor: "pointer" }}>
                {t("income", "Income")}
              </button>
              <button type="button" onClick={() => setType("out")} style={{ flex: 1, padding: 12, borderRadius: 12, border: type === "out" ? "1px solid var(--m-border-strong)" : "1px solid var(--m-border)", background: type === "out" ? "rgba(255,255,255,0.06)" : "transparent", color: "var(--m-text)", fontWeight: 600, cursor: "pointer" }}>
                {t("expense", "Expense")}
              </button>
            </div>
            <div className="m-field">
              <label className="m-label" htmlFor="tx-name">{t("fieldName", "Name")}</label>
              <input id="tx-name" className="m-input" value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} />
            </div>
            <div className="m-field" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label className="m-label" htmlFor="tx-amount">{t("fieldAmount", "Amount")} ({currency})</label>
                <input id="tx-amount" className="m-input" type="number" inputMode="decimal" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>
              <div>
                <label className="m-label" htmlFor="tx-date">{t("fieldDate", "Date")}</label>
                <input id="tx-date" className="m-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
            </div>
            <div className="m-field">
              <label className="m-label" htmlFor="tx-method">{t("fieldMethod", "Method (optional)")}</label>
              <input id="tx-method" className="m-input" value={method} onChange={(e) => setMethod(e.target.value)} />
            </div>
            <div className="m-field">
              <label className="m-label" htmlFor="tx-note">{t("fieldNote", "Note (optional)")}</label>
              <input id="tx-note" className="m-input" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            {formError ? <p role="alert" style={{ color: "var(--m-negative)", fontSize: 13, margin: "0 0 12px" }}>{formError}</p> : null}
            <div style={{ display: "flex", gap: 8 }}>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)} disabled={busy}>{t("cancel", "Cancel")}</Button>
              <Button type="submit" disabled={busy}>{busy ? t("saving", "Saving…") : t("save", "Save")}</Button>
            </div>
          </form>
        </Card>
      ) : null}

      {isLoading ? (
        <LoadingState label={t("loadingTransactions", "Loading your transactions…")} />
      ) : error ? (
        <Card>
          <div style={{ textAlign: "center", padding: "var(--m-space-6)" }}>
            <p role="alert" style={{ margin: "0 0 16px", color: "var(--m-negative)", fontSize: "var(--m-text-sm)" }}>{error}</p>
            <Button variant="secondary" onClick={() => void refresh()}>{t("tryAgain", "Try again")}</Button>
          </div>
        </Card>
      ) : transactions.length === 0 && !showForm ? (
        <Card>
          <EmptyState
            title={t("emptyTransactions", "No transactions yet")}
            description={t("emptyTransactionsBody", "Add income or expenses. Nothing is created automatically.")}
            actionLabel={t("addFirstTransaction", "Add first transaction")}
            onAction={openCreate}
          />
        </Card>
      ) : (
        <Card padding="md" className="m-anim-in m-anim-delay-1">
          {!ratesReady ? (
            <p style={{ margin: "0 0 8px", fontSize: "var(--m-text-xs)", color: "var(--m-text-muted)" }}>
              {t("fallbackRates", "Using fallback rates until live rates load.")}
            </p>
          ) : null}
          <div role="list" aria-label={t("navActivity", "Transactions")}>
            {transactions.map((tx) => (
              <div key={tx.id} role="listitem">
                <TransactionRow
                  tx={tx}
                  currency={currency}
                  convertFromBase={convertFromBase}
                  onEdit={() => openEdit(tx)}
                  onDelete={() => void handleDelete(tx)}
                  t={t}
                />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
