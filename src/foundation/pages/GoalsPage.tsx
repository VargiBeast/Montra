import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useSavingsGoals } from "../../hooks/useSavingsGoals";
import { useDisplayCurrency } from "../../lib/currency";
import { readLanguage } from "../../lib/i18n";
import { formatMoney } from "../../lib/utils";
import type { SavingsGoal, SavingsGoalInput } from "../../types/savingsGoal";
import { PageHeader } from "../ui/PageHeader";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { LoadingState } from "../ui/LoadingState";
import { Button } from "../ui/Button";

function goalProgress(goal: SavingsGoal) {
  const target = Number(goal.target_amount) || 0;
  const current = Number(goal.current_amount) || 0;
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

export function GoalsPage() {
  const auth = useAuth();
  const { goals, isLoading, error, refresh, save, remove } = useSavingsGoals(auth.user?.id);
  const { currency, convertFromBase, convertToBase } = useDisplayCurrency();
  const locale = readLanguage();

  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("0");

  function openCreate() {
    setName("");
    setTarget("");
    setCurrent("0");
    setFormError(null);
    setShowForm(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = Number(target);
    const c = Number(current);
    if (!name.trim()) {
      setFormError("Name is required.");
      return;
    }
    if (!Number.isFinite(t) || t <= 0) {
      setFormError("Enter a valid target amount.");
      return;
    }
    const input: SavingsGoalInput = {
      name: name.trim(),
      target_amount: convertToBase(t, currency),
      current_amount: Number.isFinite(c) && c >= 0 ? convertToBase(c, currency) : 0,
      currency,
      deadline: null,
      note: null,
    };
    setBusy(true);
    try {
      await save(input);
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save goal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="m-anim-in">
      <PageHeader
        title="Goals"
        subtitle="Savings targets"
        action={
          <Button size="sm" onClick={openCreate}>
            + Goal
          </Button>
        }
      />

      {showForm ? (
        <Card padding="lg" className="m-anim-scale" style={{ marginBottom: 16 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 16 }}>New savings goal</h2>
          <form onSubmit={(e) => void submit(e)}>
            <div className="m-field">
              <label className="m-label" htmlFor="goal-name">
                Name
              </label>
              <input id="goal-name" className="m-input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="m-field" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label className="m-label" htmlFor="goal-target">
                  Target ({currency})
                </label>
                <input
                  id="goal-target"
                  className="m-input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="m-label" htmlFor="goal-current">
                  Saved so far
                </label>
                <input
                  id="goal-current"
                  className="m-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                />
              </div>
            </div>
            {formError ? (
              <p role="alert" style={{ color: "var(--m-negative)", fontSize: 13 }}>
                {formError}
              </p>
            ) : null}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)} disabled={busy}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Saving…" : "Save goal"}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {isLoading ? (
        <LoadingState label="Loading goals…" />
      ) : error ? (
        <Card>
          <p role="alert" style={{ color: "var(--m-negative)" }}>
            {error}
          </p>
          <Button variant="secondary" onClick={() => void refresh()} style={{ marginTop: 12 }}>
            Retry
          </Button>
        </Card>
      ) : goals.length === 0 && !showForm ? (
        <Card>
          <EmptyState
            title="No goals yet"
            description="Set a savings target and track progress."
            action={<Button onClick={openCreate}>Create a goal</Button>}
          />
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {goals.map((goal, i) => {
            const pct = goalProgress(goal);
            const cur = convertFromBase(Number(goal.current_amount) || 0, currency);
            const tgt = convertFromBase(Number(goal.target_amount) || 0, currency);
            return (
              <Card key={goal.id} className={`m-anim-in m-anim-delay-${Math.min(i + 1, 4)}`} padding="md">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <strong style={{ fontSize: 15 }}>{goal.name}</strong>
                  <button
                    type="button"
                    aria-label="Delete goal"
                    onClick={() => {
                      if (window.confirm(`Delete “${goal.name}”?`)) void remove(goal);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--m-text-muted)",
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                </div>
                <p style={{ margin: "6px 0 10px", fontSize: 13, color: "var(--m-text-secondary)" }}>
                  {formatMoney(cur, currency, locale, cur)} / {formatMoney(tgt, currency, locale, tgt)}
                </p>
                <div
                  style={{
                    height: 8,
                    borderRadius: 99,
                    background: "rgba(255,255,255,0.06)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      borderRadius: 99,
                      background: "linear-gradient(90deg, #10b981, #e8c547)",
                      transition: "width 0.5s var(--m-ease)",
                    }}
                  />
                </div>
                <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--m-accent)", fontWeight: 600 }}>{pct}%</p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
