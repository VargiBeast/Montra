import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, CheckCircle2, ChevronRight, Lock, PiggyBank, Plus, Sparkles, Target, Trash2 } from "lucide-react";
import type { SavingsGoal, SavingsGoalInput } from "../types/savingsGoal";
import { goalPlanInsight, goalProgress, goalStage } from "../types/savingsGoal";
import { formatMoney } from "../lib/utils";
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
  onGetPlus?: () => void;
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
  onGetPlus,
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
    return translated !== "\u2014" ? translated : t(fallbackKey);
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
    const input: SavingsGoalInput = {
      name: addingTo.name,
      target_amount: addingTo.target_amount,
      current_amount: Math.round((Number(addingTo.current_amount) + addedBase) * 100) / 100,
      deadline: addingTo.deadline,
    };
    setBusy(true);
    try {
      await onSave(input, addingTo);
      closeForm();
    } catch (reason) {
      setFormError(explain(reason, "savingsGoalsSaveFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function confirmDeleteGoal() {
    if (!confirmDelete) return;
    setBusy(true);
    try {
      await onDelete(confirmDelete);
      setConfirmDelete(null);
    } catch (reason) {
      setFormError(explain(reason, "savingsGoalsDeleteFailed"));
    } finally {
      setBusy(false);
    }
  }

  function renderGoalCard(goal: SavingsGoal) {
    const progress = goalProgress(goal);
    const stage = goalStage(progress.percent, progress.isComplete);
    return (
      <article key={goal.id} className="panel savings-goal-card">
        <div className="savings-goal-card-top">
          <div className="savings-goal-icon" aria-hidden="true">
            <Target size={18} />
          </div>
          <div className="savings-goal-card-heading">
            <h2>{goal.name}</h2>
            <p className="savings-goal-stage">{t(STAGE_KEY[stage])}</p>
          </div>
          <div className="savings-goal-card-actions">
            <button type="button" className="text-button" onClick={() => openEdit(goal)}>
              {t("edit")}
            </button>
            <button type="button" className="text-button danger" onClick={() => setConfirmDelete(goal)}>
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="savings-goal-amounts">
          <strong>{money(Number(goal.current_amount))}</strong>
          <span>/ {money(Number(goal.target_amount))}</span>
        </div>

        <div className="savings-goal-bar" aria-hidden="true">
          <span style={{ width: `${Math.min(100, progress.percent)}%` }} />
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
        {!hasPlus && !progress.isComplete && (
          <button
            type="button"
            className="savings-goal-plus-teaser"
            onClick={() => onGetPlus?.()}
            disabled={!onGetPlus}
          >
            <span className="savings-goal-plus-teaser-icons" aria-hidden="true">
              <Lock size={14} className="icon-lock" strokeWidth={2.25} />
              <Sparkles size={14} className="icon-sparkles" strokeWidth={2.25} />
            </span>
            <span className="savings-goal-plus-teaser-copy">
              <strong>{t("plusFeaturePlan")}</strong>
              <span>{t("plusFeaturePlanBody")}</span>
            </span>
            <ChevronRight size={16} className="icon-chevron" aria-hidden="true" strokeWidth={2.25} />
          </button>
        )}

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
              {t("retry")}
            </button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="loading-block" style={{ height: 180, borderRadius: 24 }} />
      ) : goals.length === 0 && !showForm ? (
        <section className="panel empty-state savings-empty">
          <span className="empty-art"><PiggyBank size={22} /></span>
          <h2>{t("savingsGoalsEmptyTitle")}</h2>
          <p>{t("savingsGoalsEmptyBody")}</p>
          <button type="button" className="primary-button" onClick={openCreate}>
            <Plus size={16} /> {t("savingsGoalsAdd")}
          </button>
        </section>
      ) : (
        <>
          {active.length > 0 && (
            <section className="savings-goal-list" aria-label={t("savingsGoals")}>
              {active.map(renderGoalCard)}
            </section>
          )}
          {completed.length > 0 && (
            <section className="savings-goal-list" aria-label={t("savingsGoalsReached")}>
              <p className="section-label">{t("savingsGoalsReached")}</p>
              {completed.map(renderGoalCard)}
            </section>
          )}
        </>
      )}

      {showForm && createPortal(
        <div className="modal-backdrop" role="presentation" onClick={closeForm}>
          <div className="modal-sheet panel savings-form-sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? t("savingsGoalsEdit") : t("savingsGoalsAdd")}</h2>
            <form className="stack-md" onSubmit={submitForm}>
              <label className="form-field">
                <span>{t("savingsGoalsName")}</span>
                <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus maxLength={120} />
              </label>
              <label className="form-field">
                <span>{t("savingsGoalsTarget")}</span>
                <input inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} required />
              </label>
              <label className="form-field">
                <span>{t("savingsGoalsDeadline")}</span>
                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </label>
              {formError && <p className="form-error">{formError}</p>}
              <div className="form-actions">
                <button type="button" className="secondary-button" onClick={closeForm} disabled={busy}>{t("cancel")}</button>
                <button type="submit" className="primary-button" disabled={busy}>{busy ? t("saving") : t("saveChanges")}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}

      {addingTo && createPortal(
        <div className="modal-backdrop" role="presentation" onClick={closeForm}>
          <div className="modal-sheet panel savings-form-sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>{t("savingsGoalsAddMoney")}</h2>
            <p className="modal-lead">{addingTo.name}</p>
            <form className="stack-md" onSubmit={submitAdd}>
              <label className="form-field">
                <span>{t("amountNok", { currency })}</span>
                <input inputMode="decimal" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} required autoFocus />
              </label>
              {formError && <p className="form-error">{formError}</p>}
              <div className="form-actions">
                <button type="button" className="secondary-button" onClick={closeForm} disabled={busy}>{t("cancel")}</button>
                <button type="submit" className="primary-button" disabled={busy}>{busy ? t("saving") : t("saveChanges")}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}

      {confirmDelete && createPortal(
        <div className="modal-backdrop" role="presentation" onClick={() => setConfirmDelete(null)}>
          <div className="modal-sheet panel savings-form-sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>{t("savingsGoalsDeleteTitle")}</h2>
            <p>{t("savingsGoalsDeleteBody", { name: confirmDelete.name })}</p>
            {formError && <p className="form-error">{formError}</p>}
            <div className="form-actions">
              <button type="button" className="secondary-button" onClick={() => setConfirmDelete(null)} disabled={busy}>{t("cancel")}</button>
              <button type="button" className="danger-button" onClick={() => void confirmDeleteGoal()} disabled={busy}>
                {busy ? t("saving") : t("delete")}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </main>
  );
}
