import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useRecurringPayments } from "../../hooks/useRecurringPayments";
import { useDisplayCurrency } from "../../lib/currency";
import { readLanguage } from "../../lib/i18n";
import { formatDate, formatMoney } from "../../lib/utils";
import type { RecurringInterval, RecurringPaymentInput } from "../../types/recurringPayment";
import type { TransactionType } from "../../types/transaction";
import { PageHeader } from "../ui/PageHeader";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { LoadingState } from "../ui/LoadingState";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function RecurringPage() {
  const auth = useAuth();
  const { items, isLoading, error, refresh, save, remove, setActive } = useRecurringPayments(auth.user?.id);
  const { currency, convertFromBase, convertToBase } = useDisplayCurrency();
  const locale = readLanguage();

  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [type, setType] = useState<TransactionType>("out");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [interval, setInterval] = useState<RecurringInterval>("monthly");
  const [anchor, setAnchor] = useState(todayISO());

  function openCreate() {
    setType("out");
    setName("");
    setAmount("");
    setInterval("monthly");
    setAnchor(todayISO());
    setFormError(null);
    setShowForm(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const num = Number(amount);
    if (!name.trim()) {
      setFormError("Name is required.");
      return;
    }
    if (!Number.isFinite(num) || num <= 0) {
      setFormError("Enter a valid amount.");
      return;
    }
    const input: RecurringPaymentInput = {
      type,
      name: name.trim(),
      amount: convertToBase(num, currency),
      interval,
      anchor_date: anchor,
      note: null,
      active: true,
    };
    setBusy(true);
    try {
      await save(input);
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="m-anim-in">
      <PageHeader
        title="Recurring"
        subtitle="Definitions only — never auto-posted"
        action={
          <Button size="sm" onClick={openCreate}>
            + Add
          </Button>
        }
      />

      {showForm ? (
        <Card padding="lg" className="m-anim-scale" style={{ marginBottom: 16 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 16 }}>New recurring item</h2>
          <form onSubmit={(e) => void submit(e)}>
            <div className="m-field" style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => setType("out")} style={{ flex: 1, padding: 10, borderRadius: 10, border: type === "out" ? "1px solid var(--m-border-strong)" : "1px solid var(--m-border)", background: type === "out" ? "rgba(255,255,255,0.06)" : "transparent", cursor: "pointer", fontWeight: 600 }}>
                Expense
              </button>
              <button type="button" onClick={() => setType("in")} style={{ flex: 1, padding: 10, borderRadius: 10, border: type === "in" ? "1px solid var(--m-accent)" : "1px solid var(--m-border)", background: type === "in" ? "var(--m-accent-soft)" : "transparent", cursor: "pointer", fontWeight: 600 }}>
                Income
              </button>
            </div>
            <div className="m-field">
              <label className="m-label">Name</label>
              <input className="m-input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="m-field" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label className="m-label">Amount ({currency})</label>
                <input className="m-input" type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>
              <div>
                <label className="m-label">Interval</label>
                <select className="m-input" value={interval} onChange={(e) => setInterval(e.target.value as RecurringInterval)}>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
            <div className="m-field">
              <label className="m-label">Anchor date</label>
              <input className="m-input" type="date" value={anchor} onChange={(e) => setAnchor(e.target.value)} required />
            </div>
            {formError ? <p role="alert" style={{ color: "var(--m-negative)", fontSize: 13 }}>{formError}</p> : null}
            <div style={{ display: "flex", gap: 8 }}>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)} disabled={busy}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {isLoading ? (
        <LoadingState label="Loading…" />
      ) : error ? (
        <Card>
          <p role="alert" style={{ color: "var(--m-negative)" }}>{error}</p>
          <Button variant="secondary" onClick={() => void refresh()} style={{ marginTop: 12 }}>Retry</Button>
        </Card>
      ) : items.length === 0 && !showForm ? (
        <Card>
          <EmptyState title="No recurring items" description="Track subscriptions and bills here. Nothing posts automatically." actionLabel="Add item" onAction={openCreate} />
        </Card>
      ) : (
        <Card padding="md">
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 0",
                borderBottom: "1px solid var(--m-border)",
                opacity: item.active ? 1 : 0.55,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {item.name}
                  {!item.active ? <span style={{ marginLeft: 8, fontSize: 11, color: "var(--m-text-muted)" }}>Paused</span> : null}
                </div>
                <div style={{ fontSize: 12, color: "var(--m-text-muted)", marginTop: 2 }}>
                  {item.interval} · next {formatDate(item.next_due_date)}
                </div>
              </div>
              <strong style={{ fontSize: 14 }}>
                {formatMoney(item.amount, currency, locale, convertFromBase(Number(item.amount), currency))}
              </strong>
              <Button size="sm" variant="ghost" onClick={() => void setActive(item, !item.active)}>
                {item.active ? "Pause" : "Resume"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (window.confirm(`Delete “${item.name}”?`)) void remove(item);
                }}
              >
                ×
              </Button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
