import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, CheckCircle2, PiggyBank, Plus, Target, Trash2 } from "lucide-react";
import type { SavingsGoal, SavingsGoalInput } from "../types/savingsGoal";
import { goalProgress } from "../types/savingsGoal";
import { formatDate, formatMoney } from "../lib/utils";
import { useDisplayCurrency } from "../lib/currency";
import { useLanguage, useTranslation } from "../lib/i18n";

interface SavingsGoalsPageProps {
  goals: SavingsGoal[];
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
  onSave: (input: SavingsGoalInput, existing?: SavingsGoal) => Promise<void>;
  onDelete: (goal: SavingsGoal) => Promise<void>;
}

const FALLBACK: Record<string, string> = {
  savingsGoals: "Savings goals",
  savingsGoalsGreeting: "Save toward something real",
  savingsGoalsEmptyTitle: "No savings goals yet",
  savingsGoalsEmptyBody: "Create a goal, set a target, and track progress over time.",
  savingsGoalsAdd: "Add goal",
  savingsGoalsEdit: "Edit goal",
  savingsGoalsDelete: "Delete goal",
  savingsGoalsDeleteConfirm: "Delete this savings goal? This cannot be undone.",
  savingsGoalsName: "Goal name",
  savingsGoalsTarget: "Target amount",
  savingsGoalsCurrent: "Current amount",
  savingsGoalsDeadline: "Deadline (optional)",
  savingsGoalsRemaining: "Remaining",
  savingsGoalsProgress: "Progress",
  savingsGoalsCompleted: "Completed",
  savingsGoalsOverTarget: "Above target",
  savingsGoalsActive: "Active goals",
  savingsGoalsDoneSection: "Completed goals",
  savingsGoalsSave: "Save goal",
  savingsGoalsCancel: "Cancel",
  savingsGoalsNamePlaceholder: "e.g. New MacBook",
  savingsGoalsLoadError: "Could not load goals.",
  savingsGoalsHint: "Track progress toward a target",
  back: "Back",
  loading: "Loading\u2026",
};

export function SavingsGoalsPage({
  goals,
  isLoading,
  error,
  onBack,
  onSave,
  onDelete,
}: SavingsGoalsPageProps) {
  const translate = useTranslation();
  const t = (key: string, values?: Record<string, string | number>) => {
    const value = translate(key, values);
    if (value !== "\u2014") return value;
    let text = FALLBACK[key] ?? key;
    if (values) {
      text = text.replace(/\{(\w+)\}/g, (m, n) =>
        Object.hasOwn(values, n) ? String(values[n]) : m,
      );
    }
    return text;
  };
  const { language } = useLanguage();
  const { currency, convertFromBase, convertToBase } = useDisplayCurrency();

  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SavingsGoal | null>(null);

  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [deadline, setDeadline] = useState("");

  const money = (base: number) =>
    formatMoney(base, currency, language, convertFromBase(base, currency));

  const { active, completed } = useMemo(() => {
    const a: SavingsGoal[] = [];
    const c: SavingsGoal[] = [];
    for (const g of goals) {
      if (goalProgress(g).isComplete) c.push(g);
      else a.push(g);
    }
    return { active: a, completed: c };
  }, [goals]);

  function openCreate() {
    setEditing(null);
    setCreating(true);
    setName("");
    setTarget("");
    setCurrent("0");
    setDeadline("");
    setFormError(null);
  }

  function openEdit(goal: SavingsGoal) {
    setCreating(false);
    setEditing(goal);
    setName(goal.name);
    const targetDisplay = convertFromBase(Number(goal.target_amount), currency);
    const currentDisplay = convertFromBase(Number(goal.current_amount), currency);
    setTarget(String(Math.round(targetDisplay * 100) / 100));
    setCurrent(String(Math.round(currentDisplay * 100) / 100));
    setDeadline(goal.deadline ?? "");
    setFormError(null);
  }

  function closeForm() {
    setCreating(false);
    setEditing(null);
    setFormError(null);
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const targetDisplay = Number(target);
    const currentDisplay = Number(current || 0);
    const input: SavingsGoalInput = {
      name,
      target_amount: Math.round(convertToBase(targetDisplay, currency) * 100) / 100,
      current_amount: Math.round(convertToBase(currentDisplay, currency) * 100) / 100,
      deadline: deadline || null,
    };
    setBusy(true);
    try {
      await onSave(input, editing ?? undefined);
      closeForm();
    } catch (reason) {
      const message =
        reason instanceof Error && reason.message.trim()
          ? reason.message
          : reason && typeof reason === "object" && "message" in reason && typeof (reason as { message: unknown }).message === "string"
            ? (reason as { message: string }).message
            : "Could not save goal.";
      if (import.meta.env.DEV) {
        console.error("[SavingsGoalsPage] save failed", reason);
      }
      setFormError(message);
    } finally {
      setBusy(false);
    }
  }

  async function doDelete(goal: SavingsGoal) {
    setBusy(true);
    try {
      await onDelete(goal);
      setConfirmDelete(null);
    } catch (reason) {
      const message =
        reason instanceof Error && reason.message.trim()
          ? reason.message
          : reason && typeof reason === "object" && "message" in reason && typeof (reason as { message: unknown }).message === "string"
            ? (reason as { message: string }).message
            : "Could not delete goal.";
      if (import.meta.env.DEV) {
        console.error("[SavingsGoalsPage] delete failed", reason);
      }
      setFormError(message);
    } finally {
      setBusy(false);
    }
  }

  function GoalCard({ goal }: { goal: SavingsGoal }) {
    const progress = goalProgress(goal);
    return (
      <article className="panel savings-goal-card">
        <div className="savings-goal-head">
          <div className="savings-goal-title-row">
            <span className="savings-goal-icon" aria-hidden="true">
              {progress.isComplete ? <CheckCircle2 size={18} /> : <Target size={18} />}
            </span>
            <div>
              <strong className="savings-goal-name">{goal.name}</strong>
              {goal.deadline && (
                <span className="savings-goal-deadline">
                  {formatDate(goal.deadline, language)}
                </span>
              )}
            </div>
          </div>
          <div className="savings-goal-actions">
            <button type="button" className="text-button" onClick={() => openEdit(goal)}>
              {t("savingsGoalsEdit")}
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label={t("savingsGoalsDelete")}
              onClick={() => setConfirmDelete(goal)}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="savings-goal-progress-track" aria-hidden="true">
          <span
            className={`savings-goal-progress-fill ${progress.isComplete ? "is-complete" : ""} ${progress.isOverTarget ? "is-over" : ""}`}
            style={{ width: `${Math.min(100, progress.percent)}%` }}
          />
        </div>

        <div className="savings-goal-meta">
          <span>
            {t("savingsGoalsProgress")}: <strong>{progress.percent}%</strong>
            {progress.isComplete && (
              <span className="savings-goal-badge">
                {progress.isOverTarget ? t("savingsGoalsOverTarget") : t("savingsGoalsCompleted")}
              </span>
            )}
          </span>
          <span>
            {money(goal.current_amount)} / {money(goal.target_amount)}
          </span>
        </div>
        {!progress.isComplete && (
          <p className="savings-goal-remaining">
            {t("savingsGoalsRemaining")}: <strong>{money(progress.remaining)}</strong>
          </p>
        )}
      </article>
    );
  }

  const showForm = creating || Boolean(editing);

  return (
    <main className="page-content savings-goals-page">
      <div className="page-header savings-goals-header">
        <button type="button" className="icon-button" aria-label={t("back")} onClick={onBack}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="greeting">{t("savingsGoalsGreeting")}</p>
          <h1 className="page-title">{t("savingsGoals")}</h1>
        </div>
        <button type="button" className="primary-button savings-goals-add" onClick={openCreate}>
          <Plus size={16} />
          {t("savingsGoalsAdd")}
        </button>
      </div>

      {error && <p className="form-error stack-notice">{error || t("savingsGoalsLoadError")}</p>}
      {formError && !showForm && <p className="form-error stack-notice">{formError}</p>}

      {isLoading ? (
        <div className="loading-block panel">{t("loading")}</div>
      ) : goals.length === 0 && !showForm ? (
        <section className="panel section-panel">
          <div className="empty-state">
            <span className="empty-art">
              <PiggyBank size={22} />
            </span>
            <h3>{t("savingsGoalsEmptyTitle")}</h3>
            <p>{t("savingsGoalsEmptyBody")}</p>
            <button type="button" className="primary-button" onClick={openCreate}>
              {t("savingsGoalsAdd")}
            </button>
          </div>
        </section>
      ) : (
        <>
          {active.length > 0 && (
            <section className="stack-panel">
              <p className="section-label">{t("savingsGoalsActive")}</p>
              <div className="savings-goals-list">
                {active.map((g) => (
                  <GoalCard key={g.id} goal={g} />
                ))}
              </div>
            </section>
          )}
          {completed.length > 0 && (
            <section className="stack-panel">
              <p className="section-label">{t("savingsGoalsDoneSection")}</p>
              <div className="savings-goals-list">
                {completed.map((g) => (
                  <GoalCard key={g.id} goal={g} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {showForm && createPortal(
        <div className="modal-backdrop" role="presentation" onClick={closeForm}>
          <div
            className="modal-sheet panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="savings-goal-form-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="savings-goal-form-title">
              {editing ? t("savingsGoalsEdit") : t("savingsGoalsAdd")}
            </h2>
            <form className="stack-md" onSubmit={(e) => void submitForm(e)}>
              <label className="form-field">
                <span>{t("savingsGoalsName")}</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("savingsGoalsNamePlaceholder")}
                  required
                  maxLength={80}
                  autoFocus
                />
              </label>
              <label className="form-field">
                <span>{t("savingsGoalsTarget")} ({currency})</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  required
                />
              </label>
              <label className="form-field">
                <span>{t("savingsGoalsCurrent")} ({currency})</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                />
              </label>
              <label className="form-field">
                <span>{t("savingsGoalsDeadline")}</span>
                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </label>
              {formError && <p className="form-error">{formError}</p>}
              <div className="form-actions">
                <button type="button" className="secondary-button" onClick={closeForm} disabled={busy}>
                  {t("savingsGoalsCancel")}
                </button>
                <button type="submit" className="primary-button" disabled={busy}>
                  {t("savingsGoalsSave")}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}

      {confirmDelete && createPortal(
        <div className="modal-backdrop" role="presentation" onClick={() => setConfirmDelete(null)}>
          <div
            className="modal-sheet panel"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{t("savingsGoalsDelete")}</h2>
            <p>{t("savingsGoalsDeleteConfirm")}</p>
            <p>
              <strong>{confirmDelete.name}</strong>
            </p>
            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setConfirmDelete(null)}
                disabled={busy}
              >
                {t("savingsGoalsCancel")}
              </button>
              <button
                type="button"
                className="danger-button"
                disabled={busy}
                onClick={() => void doDelete(confirmDelete)}
              >
                {t("savingsGoalsDelete")}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </main>
  );
}
