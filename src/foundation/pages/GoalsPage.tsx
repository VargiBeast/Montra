import { useAuth } from "../../hooks/useAuth";
import { useSavingsGoals } from "../../hooks/useSavingsGoals";
import { useDisplayCurrency } from "../../lib/currency";
import { readLanguage } from "../../lib/i18n";
import { formatMoney, formatDate } from "../../lib/utils";
import { goalProgress, type SavingsGoal } from "../../types/savingsGoal";
import { PageHeader } from "../ui/PageHeader";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { LoadingState } from "../ui/LoadingState";
import { Button } from "../ui/Button";

function GoalCard({
  goal,
  currency,
  convertFromBase,
}: {
  goal: SavingsGoal;
  currency: string;
  convertFromBase: (amountInBase: number, toCurrency?: string) => number;
}) {
  const progress = goalProgress(goal);
  const locale = readLanguage();
  const currentLabel = formatMoney(
    goal.current_amount,
    currency,
    locale,
    convertFromBase(goal.current_amount, currency),
  );
  const targetLabel = formatMoney(
    goal.target_amount,
    currency,
    locale,
    convertFromBase(goal.target_amount, currency),
  );

  return (
    <Card style={{ marginBottom: "var(--m-space-3)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
        <div style={{ minWidth: 0 }}>
          <h3
            style={{
              margin: 0,
              fontSize: "var(--m-text-base)",
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {goal.name}
          </h3>
          {goal.deadline ? (
            <p style={{ margin: "4px 0 0", fontSize: "var(--m-text-xs)", color: "var(--m-text-muted)" }}>
              Target {formatDate(goal.deadline)}
            </p>
          ) : null}
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: "var(--m-text-sm)", color: "var(--m-accent)" }}>
            {progress.percent}%
          </div>
          <div style={{ fontSize: "var(--m-text-xs)", color: "var(--m-text-muted)" }}>
            {progress.isComplete ? "Reached" : `${currentLabel} / ${targetLabel}`}
          </div>
        </div>
      </div>
      <div
        role="progressbar"
        aria-valuenow={progress.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${goal.name} progress`}
        style={{
          height: 8,
          borderRadius: "var(--m-radius-full)",
          background: "var(--m-border)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress.percent}%`,
            borderRadius: "var(--m-radius-full)",
            background: progress.isComplete
              ? "var(--m-positive)"
              : "linear-gradient(90deg, var(--m-accent-strong), var(--m-accent))",
            transition: "width 0.3s var(--m-ease)",
          }}
        />
      </div>
    </Card>
  );
}

/** Real savings goals — RLS-scoped via useSavingsGoals. */
export function GoalsPage() {
  const auth = useAuth();
  const { goals, isLoading, error, refresh } = useSavingsGoals(auth.user?.id);
  const { currency, convertFromBase } = useDisplayCurrency();

  return (
    <div>
      <PageHeader title="Savings goals" subtitle="Track progress toward what matters" />

      {isLoading ? (
        <LoadingState label="Loading your goals…" />
      ) : error ? (
        <Card>
          <div style={{ textAlign: "center", padding: "var(--m-space-6)" }}>
            <p role="alert" style={{ margin: "0 0 16px", color: "var(--m-negative)", fontSize: "var(--m-text-sm)" }}>
              {error}
            </p>
            <Button variant="secondary" onClick={() => void refresh()}>
              Try again
            </Button>
          </div>
        </Card>
      ) : goals.length === 0 ? (
        <Card>
          <EmptyState
            title="No goals yet"
            description="Create a savings goal to start tracking progress. Existing goal data remains in Supabase."
          />
        </Card>
      ) : (
        <div>
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              currency={currency}
              convertFromBase={convertFromBase}
            />
          ))}
        </div>
      )}
    </div>
  );
}
