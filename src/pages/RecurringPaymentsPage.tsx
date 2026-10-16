import { useMemo, useState } from "react";
import { ArrowLeft, CalendarClock, Pause, Play, Plus, Trash2 } from "lucide-react";
import type {
  RecurringPayment,
  RecurringPaymentInput,
  RecurringInterval,
} from "../types/recurringPayment";
import { todayYmd } from "../types/recurringPayment";
import { resolveRecurringCopy } from "../lib/recurringCopy";
import { formatMoney, formatDate } from "../lib/utils";
import { useDisplayCurrency } from "../lib/currency";
import { useLanguage } from "../lib/i18n";

interface Props {
  items: RecurringPayment[];
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
  onSave: (input: RecurringPaymentInput, existing?: RecurringPayment) => Promise<void>;
  onDelete: (item: RecurringPayment) => Promise<void>;
  onSetActive: (item: RecurringPayment, active: boolean) => Promise<void>;
  onRetry: () => void;
}

const emptyForm = (): RecurringPaymentInput => ({
  type: "out",
  name: "",
  amount: 0,
  interval: "monthly",
  anchor_date: todayYmd(),
  note: null,
  active: true,
});

export function RecurringPaymentsPage({
  items,
  isLoading,
  error,
  onBack,
  onSave,
  onDelete,
  onSetActive,
  onRetry,
}: Props) {
  const { language } = useLanguage();
  const { currency, convertFromBase } = useDisplayCurrency();
  const t = (key: Parameters<typeof resolveRecurringCopy>[1]) =>
    resolveRecurringCopy(language, key);
  const money = (v: number) =>
    formatMoney(v, currency, language, convertFromBase(v, currency));

  const [editing, setEditing] = useState<RecurringPayment | null>(null);
  const [form, setForm] = useState<RecurringPaymentInput>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...items].sort((a, b) => {
        if (a.active !== b.active) return a.active ? -1 : 1;
        return a.next_due_date.localeCompare(b.next_due_date);
      }),
    [items],
  );

  function openNew() {
    setEditing(null);
    setForm(emptyForm());
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(item: RecurringPayment) {
    setEditing(item);
    setForm({
      type: item.type,
      name: item.name,
      amount: item.amount,
      interval: item.interval,
      anchor_date: item.anchor_date,
      note: item.note,
      active: item.active,
    });
    setFormError(null);
    setShowForm(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      await onSave(form, editing ?? undefined);
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page-content void-section" style={{ padding: "16px 16px 96px" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <button type="button" className="text-button" onClick={onBack} aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 20 }}>{t("title")}</h1>
          <p className="life-hint" style={{ margin: "4px 0 0" }}>
            {t("hint")}
          </p>
        </div>
        <button type="button" className="primary-button" onClick={openNew} disabled={busy}>
          <Plus size={16} /> {t("add")}
        </button>
      </header>

      <p className="life-disclaimer" style={{ marginBottom: 16 }}>
        {t("disclaimer")}
      </p>

      {error && (
        <div className="empty-state">
          <p>{error}</p>
          <button type="button" className="primary-button" onClick={onRetry}>
            {t("save")}
          </button>
        </div>
      )}

      {isLoading && !items.length && <p className="life-empty">…</p>}

      {!isLoading && !sorted.length && !showForm && (
        <div className="empty-state">
          <CalendarClock size={28} aria-hidden="true" />
          <p>{t("empty")}</p>
          <button type="button" className="primary-button" onClick={openNew}>
            {t("add")}
          </button>
        </div>
      )}

      {showForm && (
        <form className="void-month" onSubmit={submit} style={{ marginBottom: 20 }}>
          <label className="life-field">
            <span>{t("name")}</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              aria-label={t("name")}
            />
          </label>
          <label className="life-field">
            <span>{t("amount")}</span>
            <input
              required
              type="number"
              min={0.01}
              step="0.01"
              value={form.amount || ""}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              aria-label={t("amount")}
            />
          </label>
          <label className="life-field">
            <span>{t("type")}</span>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as "in" | "out" })}
              aria-label={t("type")}
            >
              <option value="out">{t("typeOut")}</option>
              <option value="in">{t("typeIn")}</option>
            </select>
          </label>
          <label className="life-field">
            <span>{t("interval")}</span>
            <select
              value={form.interval}
              onChange={(e) =>
                setForm({ ...form, interval: e.target.value as RecurringInterval })
              }
              aria-label={t("interval")}
            >
              <option value="weekly">{t("weekly")}</option>
              <option value="monthly">{t("monthly")}</option>
              <option value="yearly">{t("yearly")}</option>
            </select>
          </label>
          <label className="life-field">
            <span>{t("anchor")}</span>
            <input
              required
              type="date"
              value={form.anchor_date}
              onChange={(e) => setForm({ ...form, anchor_date: e.target.value })}
              aria-label={t("anchor")}
            />
          </label>
          <label className="life-field">
            <span>{t("note")}</span>
            <input
              value={form.note ?? ""}
              onChange={(e) => setForm({ ...form, note: e.target.value || null })}
              aria-label={t("note")}
            />
          </label>
          {formError && <p className="life-empty">{formError}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" className="primary-button" disabled={busy}>
              {t("save")}
            </button>
            <button type="button" className="text-button" onClick={() => setShowForm(false)}>
              {t("cancel")}
            </button>
          </div>
        </form>
      )}

      <ul className="life-milestone-list">
        {sorted.map((item) => (
          <li key={item.id}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <strong>
                {item.name}{" "}
                <span className="plus-badge" style={{ fontSize: 10 }}>
                  {t("plannedBadge")}
                </span>
                {!item.active && (
                  <span style={{ marginLeft: 6, fontSize: 11, color: "var(--muted)" }}>
                    {t("paused")}
                  </span>
                )}
              </strong>
              <strong className={item.type === "in" ? "void-balance-in" : "void-balance-out"}>
                {item.type === "in" ? "+" : "\u2212"}
                {money(item.amount)}
              </strong>
            </div>
            <span>
              {t(item.interval)} · {t("nextDue")}: {formatDate(item.next_due_date, language)}
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              <button
                type="button"
                className="text-button"
                onClick={() => openEdit(item)}
                disabled={busy}
              >
                {t("edit")}
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() => void onSetActive(item, !item.active)}
                disabled={busy}
              >
                {item.active ? (
                  <>
                    <Pause size={14} /> {t("pause")}
                  </>
                ) : (
                  <>
                    <Play size={14} /> {t("resume")}
                  </>
                )}
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  if (window.confirm(`${t("delete")}?`)) void onDelete(item);
                }}
                disabled={busy}
              >
                <Trash2 size={14} /> {t("delete")}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
