import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import type { SavingsGoal } from "../types/savingsGoal";
import { projectWhatIf } from "../lib/whatIf";
import { resolveLifeCopy } from "../lib/lifeCopy";
import { formatMoney } from "../lib/utils";
import { useDisplayCurrency } from "../lib/currency";
import { useLanguage } from "../lib/i18n";

interface WhatIfCardProps {
  goals: SavingsGoal[];
}

export function WhatIfCard({ goals }: WhatIfCardProps) {
  const { language } = useLanguage();
  const { currency, convertFromBase } = useDisplayCurrency();
  const t = (key: Parameters<typeof resolveLifeCopy>[1], values?: Record<string, string | number>) => {
    let v = resolveLifeCopy(language, key);
    if (values) v = v.replace(/\{(\w+)\}/g, (m, n) => (Object.hasOwn(values, n) ? String(values[n]) : m));
    return v;
  };
  const money = (v: number) => formatMoney(v, currency, language, convertFromBase(v, currency));

  const activeGoals = useMemo(
    () => goals.filter((g) => Number(g.target_amount) > 0),
    [goals],
  );
  const [goalId, setGoalId] = useState<string>("");
  const selectedId = goalId && activeGoals.some((g) => g.id === goalId) ? goalId : activeGoals[0]?.id ?? "";
  const selected = activeGoals.find((g) => g.id === selectedId) ?? null;

  const [monthly, setMonthly] = useState<string>("300");
  const monthlyNum = Math.max(0, Number(monthly.replace(",", ".")) || 0);

  const result = useMemo(
    () => (selected ? projectWhatIf(selected, { monthlySave: monthlyNum }) : null),
    [selected, monthlyNum],
  );

  return (
    <section className="void-section life-whatif" aria-label={t("whatIfTitle")}>
      <div className="void-section-head">
        <h2>
          <Sparkles size={16} aria-hidden="true" /> {t("whatIfTitle")}
        </h2>
      </div>
      <p className="life-hint">{t("whatIfHint")}</p>

      {activeGoals.length === 0 ? (
        <p className="life-empty">{t("whatIfNoGoals")}</p>
      ) : (
        <>
          <label className="life-field">
            <span>{t("whatIfSelectGoal")}</span>
            <select
              value={selectedId}
              onChange={(e) => setGoalId(e.target.value)}
              aria-label={t("whatIfSelectGoal")}
            >
              {activeGoals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>

          <label className="life-field">
            <span>{t("whatIfMonthly")}</span>
            <input
              type="number"
              min={0}
              step="10"
              inputMode="decimal"
              value={monthly}
              onChange={(e) => setMonthly(e.target.value)}
              aria-label={t("whatIfMonthly")}
            />
          </label>

          {result && (
            <div className="life-whatif-result">
              {result.isComplete ? (
                <p className="life-result-line">{t("whatIfComplete")}</p>
              ) : result.monthsToGoal == null ? (
                <p className="life-result-line">{t("whatIfNeedRate")}</p>
              ) : (
                <>
                  <div className="life-result-grid">
                    <div>
                      <span>{t("whatIfRemaining")}</span>
                      <strong>{money(result.remaining)}</strong>
                    </div>
                    <div>
                      <span>{t("whatIfMonths")}</span>
                      <strong>{t("whatIfMonthsValue", { count: result.monthsToGoal })}</strong>
                    </div>
                    <div>
                      <span>{t("whatIfReach")}</span>
                      <strong>{result.estimatedMonth}</strong>
                    </div>
                  </div>
                  {result.hasDeadline && result.planMonthlyNeeded != null && (
                    <p className="life-result-meta">
                      {t("whatIfVsPlan", { amount: money(result.planMonthlyNeeded) })}
                      {result.beatsDeadline === true && ` · ${t("whatIfBeats")}`}
                      {result.beatsDeadline === false && ` · ${t("whatIfBehind")}`}
                    </p>
                  )}
                </>
              )}
              <p className="life-disclaimer">{t("whatIfEstimate")}</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
