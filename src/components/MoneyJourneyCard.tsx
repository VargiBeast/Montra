import { useMemo } from "react";
import { Route } from "lucide-react";
import type { Transaction } from "../types/transaction";
import type { SavingsGoal } from "../types/savingsGoal";
import { buildMoneyJourney } from "../lib/moneyJourney";
import { resolveLifeCopy } from "../lib/lifeCopy";
import { formatMoney } from "../lib/utils";
import { useDisplayCurrency } from "../lib/currency";
import { useLanguage } from "../lib/i18n";
import type { GoalStage } from "../types/savingsGoal";

interface MoneyJourneyCardProps {
  transactions: Transaction[];
  goals: SavingsGoal[];
}

function stageKey(stage: GoalStage): Parameters<typeof resolveLifeCopy>[1] {
  switch (stage) {
    case "early":
      return "journeyStageEarly";
    case "building":
      return "journeyStageBuilding";
    case "halfway":
      return "journeyStageHalfway";
    case "almost":
      return "journeyStageAlmost";
    case "reached":
      return "journeyStageReached";
  }
}

export function MoneyJourneyCard({ transactions, goals }: MoneyJourneyCardProps) {
  const { language } = useLanguage();
  const { currency, convertFromBase } = useDisplayCurrency();
  const t = (key: Parameters<typeof resolveLifeCopy>[1]) => resolveLifeCopy(language, key);
  const money = (v: number) => formatMoney(v, currency, language, convertFromBase(v, currency));

  const journey = useMemo(
    () => buildMoneyJourney(transactions, goals, 6),
    [transactions, goals],
  );

  return (
    <section className="void-section life-journey" aria-label={t("journeyTitle")}>
      <div className="void-section-head">
        <h2>
          <Route size={16} aria-hidden="true" /> {t("journeyTitle")}
        </h2>
      </div>
      <p className="life-hint">{t("journeyHint")}</p>

      {!journey.hasHistory ? (
        <p className="life-empty">{t("journeyEmpty")}</p>
      ) : (
        <div className="life-journey-months" role="list">
          {journey.months.map((row) => (
            <div key={row.month} className="life-journey-row" role="listitem">
              <span className="life-journey-month">{row.month}</span>
              <span className="life-journey-stat is-in">
                <em>{t("journeyIncome")}</em> {money(row.income)}
              </span>
              <span className="life-journey-stat is-out">
                <em>{t("journeySpending")}</em> {money(row.spending)}
              </span>
              <span className={`life-journey-stat is-net ${row.net >= 0 ? "pos" : "neg"}`}>
                <em>{t("journeyNet")}</em>{" "}
                {row.net > 0 ? "+" : row.net < 0 ? "\u2212" : ""}
                {money(Math.abs(row.net))}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="life-journey-goals">
        <h3 className="life-subhead">{t("journeyGoals")}</h3>
        {!journey.hasGoals ? (
          <p className="life-empty">{t("journeyNoGoals")}</p>
        ) : (
          <ul className="life-milestone-list">
            {journey.milestones.map((m) => (
              <li key={m.goalId}>
                <strong>{m.goalName}</strong>
                <span>
                  {t(stageKey(m.stage))} · {m.percent}%
                  {!m.isComplete && ` · ${money(m.remaining)}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
