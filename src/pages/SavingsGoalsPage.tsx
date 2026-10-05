import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, CheckCircle2, PiggyBank, Plus, Target, Trash2 } from "lucide-react";
import type { SavingsGoal, SavingsGoalInput } from "../types/savingsGoal";
import { goalPlanInsight, goalProgress, goalStage } from "../types/savingsGoal";
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
  onRetry?: () => void;
  hasPlus?: boolean;
}

const STAGE_KEY = {
  early: "savingsGoalsStageEarly",
  building: "savingsGoalsStageBuilding",
  halfway: "savingsGoalsStageHalfway",
  almost: "savingsGoalsStageAlmost",
  reached: "savingsGoalsReached",
} as const;

export function SavingsGoalsPage({
  goals,
  isLoading,
  error,
  onBack,
  onSave,
  onDelete,
  onRetry,
  hasPlus = false,
}: SavingsGoalsPageProps) {
  const translate = useTranslation();
  const t = (key: string, values?: Record<string, string | number>) => translate(key, values);
  const { language } = useLanguage();
  const { currency, convertFromBase, convertToBase } = useDisplayCurrency();

  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [creating, setCreating] = useState(false);
  const [addingTo, setAddingTo] = useState<SavingsGoal | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SavingsGoal | null>(null);

  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [addAmount, setAddAmount] = useState("");

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

  function explain(reason: unknown, fallbackKey: string) {
    const raw =
      reason instanceof Error && reason.message.trim()
        ? reason.message
        : reason && typeof reason === "object" && "message" in reason && typeof (reason as { message: unknown }).message === "string"
          ? (reason as { message: string }).message
          : fallbackKey;
    const translated = t(raw);
    return translated !== "—" ? translated : t(fallbackKey);
  }

  function openCreate() {
    setEditing(null);
    setAddingTo(null);
    setCreating(true);
    setName("");
    setTarget("");
    setDeadline("");
    setFormError(null);
  }

  function openEdit(goal: SavingsGoal) {
    setCreating(false);
    setAddingTo(null);
    setEditing(goal);
    setName(goal.name);
    const targetDisplay = convertFromBase(Number(goal.target_amount), currency);
    setTarget(String(Math.round(targetDisplay * 100) / 100));
    setDeadline(goal.deadline ?? "");
    setFormError(null);
  }

  function openAdd(goal: SavingsGoal) {
    setCreating(false);
    setEditing(null);
    setAddingTo(goal);
    setAddAmount("");
    setFormError(null);
  }

  function closeForm() {
    setCreating(false);
    setEditing(null);
    setAddingTo(null);
    setFormError(null);
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError(t("savingsGoalsNameRequired"));
      return;
    }
    const targetDisplay = Number(target);
    if (!Number.isFinite(targetDisplay) || targetDisplay <= 0) {
      setFormError(t("savingsGoalsTargetInvalid"));
      return;
    }
    if (deadline && !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
      setFormError(t("savingsGoalsDeadlineInvalid"));
      return;
    }
    const input: SavingsGoalInput = {
      name,
      target_amount: Math.round(convertToBase(targetDisplay, currency) * 100) / 100,
      current_amount: editing ? editing.current_amount : 0,
      deadline: deadline || null,
    };
    setBusy(true);
    try {
      await onSave(input, editing ?? undefined);
      closeForm();
    } catch (reason) {
      setFormError(explain(reason, "savingsGoalsSaveFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addingTo) return;
    setFormError(null);
    const display = Number(addAmount);
    if (!Number.isFinite(display) || display <= 0) {
      setFormError(t("savingsGoalsAddInvalid"));
      return;
    }
    const addedBase = Math.round(convertToBase(display, currency) * 100) / 100;
    const next = Math.round((Number(addingTo.current_amount) + addedBase) * 100) / 100;
    if (next < 0) {
      setFormError(t("savingsGoalsCurrentInvalid"));
      return;
    }
    setBusy(true);
    try {
      await onSave(
        {
          name: addingTo.name,
          target_amount: addingTo.target_amount,
          current_amount: next,
          deadline: addingTo.deadline,
        },
        addingTo,
      );
      closeForm();
    } catch (reason) {
      setFormError(explain(reason, "savingsGoalsSaveFailed"));
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
      setFormError(explain(reason, "savingsGoalsDeleteFailed"));
      setConfirmDelete(null);
    } finally {
      setBusy(false);
    }
  }

  function GoalCard({ goal }: { goal: SavingsGoal }) {
    const progress = goalProgress(goal);
    const stage = goalStage(progress.percent, progress.isComplete);
    return (
      <article className={`panel savings-goal-card stage-${stage}`}>
        <div className="savings-goal-head">
          <div className="savings-goal-title-row">
            <span className="savings-goal-icon" aria-hidden="true">
              {progress.isComplete ? <CheckCircle2 size={18} /> : <Target size={18} />}
            </span>
            <div className="savings-goal-copy">
              <strong className="savings-goal-name">{goal.name}</strong>
              <span className="savings-goal-stage">
                {progress.isComplete
                  ? progress.isOverTarget
                    ? t("savingsGoalsOverTarget")
                    : t("savingsGoalsReached")
                  : t(STAGE_KEY[stage])}
              </span>
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

        <p className="savings-goal-amounts">
          <strong>{money(goal.current_amount)}</strong>
          <span> / {money(goal.target_amount)}</span>
        </p>

        <div
          className="savings-goal-progress-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress.percent}
          aria-label={t("savingsGoalsProgress")}
        >
          <span
            className={`savings-goal-progress-fill stage-${stage}`}
            style={{ width: `${progress.percent}%` }}
          />
        </div>

        <div className="savings-goal-meta">
          <span>
            {t("savingsGoalsProgress")} <strong>{progress.percent}%</strong>
          </span>
          {goal.deadline ? (
            <span className="savings-goal-deadline">{formatDate(goal.deadline, language)}</span>
          ) : null}
        </div>

        {progress.isComplete ? (
          <p className="savings-goal-remaining is-reached">
            <CheckCircle2 size={15} aria-hidden="true" />
            {t("savingsGoalsReached")}
          </p>
        ) : (
          <p className={`savings-goal-remaining ${stage === "almost" ? "is-close" : ""}`}>
            {t("savingsGoalsLeft", { amount: money(progress.remaining) })}
          </p>
        )}


        {hasPlus && !progress.isComplete && (() => {
          const plan = goalPlanInsight(goal);
          if (!plan.hasDeadline || plan.monthlyNeeded == null) {
            return (<p className="savings-goal-plan-hint">{t("savingsGoalsPlanAddDeadline")}</p>);
          }
          return (
            <div className="savings-goal-plan" aria-label={t("savingsGoalsPlanTitle")}>
              <p className="eyebrow">{t("savingsGoalsPlanTitle")}</p>
              <div className="savings-goal-plan-stats">
                <div><span>{t("savingsGoalsPlanMonthly")}</span><strong>{money(plan.monthlyNeeded)}</strong></div>
                {plan.monthsRemaining != null && (
                  <div><span>{t("savingsGoalsPlanMonths")}</span><strong>{plan.monthsRemaining}</strong></div>
                )}
              </div>
              <p className="savings-goal-plan-note">{t("savingsGoalsPlanNote")}</p>
            </div>
          );
        })()}

        <button type="button" className="secondary-button savings-goal-add-money" onClick={() => openAdd(goal)}>
          <Plus size={15} />
          {t("savingsGoalsAddMoney")}
        </button>
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
        <div className="savings-goals-heading">
          <p className="greeting">{t("savingsGoalsGreeting")}</p>
          <h1 className="page-title">{t("savingsGoals")}</h1>
        </div>
        <button type="button" className="primary-button savings-goals-add" onClick={openCreate}>
          <Plus size={16} />
          {t("savingsGoalsAdd")}
        </button>
      </div>

      {error && (
        <div className="panel stack-notice savings-inline-error">
          <p className="form-error">{error}</p>
          {onRetry && (
            <button type="button" className="secondary-button" onClick={onRetry}>
              {t("savingsGoalsRetry")}
            </button>
          )}
        </div>
      )}
      {formError && !showForm && !addingTo && <p className="form-error stack-notice">{formError}</p>}

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
              {editing ? t("savingsGoalsEdit") : t("savingsGoalsCreate")}
            </h2>
            <form className="stack-md" onSubmit={(e) => void submitForm(e)}>
              <label className="form-field">
                <span>{t("savingsGoalsWhatFor")}</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("savingsGoalsNamePlaceholder")}
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
                />
              </label>
              <label className="form-field">
                <span>{t("savingsGoalsDeadline")}</span>
                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </label>
              {editing && (
                <p className="analytics-hint">
                  {t("savingsGoalsSavedNow")}: {money(editing.current_amount)}
                </p>
              )}
              {formError && <p className="form-error">{formError}</p>}
              <div className="form-actions">
                <button type="button" className="secondary-button" onClick={closeForm} disabled={busy}>
                  {t("savingsGoalsCancel")}
                </button>
                <button type="submit" className="primary-button" disabled={busy}>
                  {editing ? t("savingsGoalsSave") : t("savingsGoalsCreate")}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}

      {addingTo && createPortal(
        <div className="modal-backdrop" role="presentation" onClick={closeForm}>
          <div
            className="modal-sheet panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="savings-add-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="savings-add-title">{t("savingsGoalsAddMoneyTitle")}</h2>
            <p className="analytics-hint">{addingTo.name}</p>
            <p className="savings-goal-amounts">
              <strong>{money(addingTo.current_amount)}</strong>
              <span> / {money(addingTo.target_amount)}</span>
            </p>
            <form className="stack-md" onSubmit={(e) => void submitAdd(e)}>
              <label className="form-field">
                <span>{t("savingsGoalsAddAmount")} ({currency})</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  autoFocus
                />
              </label>
              {formError && <p className="form-error">{formError}</p>}
              <div className="form-actions">
                <button type="button" className="secondary-button" onClick={closeForm} disabled={busy}>
                  {t("savingsGoalsCancel")}
                </button>
                <button type="submit" className="primary-button" disabled={busy}>
                  {t("savingsGoalsAddMoney")}
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
            <p className="analytics-hint">{t("savingsGoalsDeleteLinked")}</p>
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
