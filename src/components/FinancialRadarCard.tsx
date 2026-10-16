import { useMemo } from "react";
import {
  BarChart3,
  Lightbulb,
  PiggyBank,
  Radar,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import type { Transaction } from "../types/transaction";
import type { SavingsGoal } from "../types/savingsGoal";
import { goalProgress } from "../types/savingsGoal";
import {
  buildMonthForecast,
  collectInsights,
  type InsightItem,
} from "../lib/insights";
import { rangeForPeriod } from "../lib/analytics";
import { formatMoney } from "../lib/utils";
import { useDisplayCurrency } from "../lib/currency";
import { useLanguage, useTranslation } from "../lib/i18n";
import { fillMissingCopy } from "../lib/missingCopy";

const RADAR_FALLBACK: Record<string, string> = {
  financialRadar: "Financial Radar",
  radarPlusBadge: "Plus",
  radarEmptyTitle: "Not enough data yet",
  radarEmptyBody: "Add a few purchases and money-in entries to see a month-end estimate here.",
  radarInsufficient: "Need a bit more history to estimate this month. Keep logging entries.",
  radarForecastLabel: "Month-end estimate",
  radarExpectedNet: "Expected net",
  radarExpectedSpending: "Expected spending",
  radarExpectedIncome: "Expected income",
  radarSoFar: "So far this month",
  forecastDisclaimer: "Estimate based on your history and spending so far — not a guarantee.",
  forecastPaceNote: "Based on day {day} of {days} this month, blended with past months when available.",
  insightsTitle: "Insights",
  insightsEmpty: "Not enough activity yet for insights. Add more entries over a few weeks.",
  openAnalytics: "Open analytics",
  homeGoalOf: "{current} / {target}",
  homeGoalRemaining: "{amount} remaining",
  homeGoalComplete: "Goal reached",
  analyticsUncategorized: "Uncategorized",
  insightSpendingUp: "Your spending is {percent}% higher than the previous period.",
  insightSpendingDown: "Your spending is {percent}% lower than the previous period.",
  insightCategoryShare: "{category} accounts for {percent}% of your spending in this period.",
  insightCategoryUp: "{category} spending is up {percent}% vs the previous period.",
  insightCategoryDown: "{category} spending is down {percent}% vs the previous period.",
  insightTrendDown: "Your spending has decreased for {weeks} consecutive weeks.",
  insightTrendUp: "Your spending has increased for {weeks} consecutive weeks.",
  insightUnusualExpense: "Unusually large expense: {name}.",
  insightUnusualPeriod: "Spending this month is about {percent}% above your typical month.",
};

interface FinancialRadarCardProps {
  transactions: Transaction[];
  savingsGoals?: SavingsGoal[];
  onOpenAnalytics?: () => void;
  onOpenSavingsGoals?: () => void;
}

function insightIcon(item: InsightItem) {
  if (item.severity === "positive") return <TrendingDown size={14} aria-hidden="true" />;
  if (item.severity === "warning") return <AlertTriangle size={14} aria-hidden="true" />;
  return <Lightbulb size={14} aria-hidden="true" />;
}

export function FinancialRadarCard({
  transactions,
  savingsGoals = [],
  onOpenAnalytics,
  onOpenSavingsGoals,
}: FinancialRadarCardProps) {
  const translate = useTranslation();
  const { language } = useLanguage();
  const t = (key: string, values?: Record<string, string | number>) => {
    let value = fillMissingCopy(key, translate(key, values), language);
    if (value === "\u2014") value = RADAR_FALLBACK[key] ?? key;
    if (values) {
      value = value.replace(/\{(\w+)\}/g, (m, n) =>
        Object.hasOwn(values, n) ? String(values[n]) : m,
      );
    }
    return value;
  };

  const { currency, convertFromBase } = useDisplayCurrency();
  const money = (valueInBase: number) =>
    formatMoney(valueInBase, currency, language, convertFromBase(valueInBase, currency));

  const uncategorized = t("analyticsUncategorized");
  const thisMonthRange = useMemo(() => rangeForPeriod("this_month"), []);

  const forecast = useMemo(() => buildMonthForecast(transactions), [transactions]);
  const insights = useMemo(
    () => collectInsights(transactions, thisMonthRange, uncategorized).slice(0, 3),
    [transactions, thisMonthRange, uncategorized],
  );

  const featuredGoal = useMemo(() => {
    if (!savingsGoals.length) return null;
    const active = savingsGoals
      .map((g) => ({ goal: g, progress: goalProgress(g) }))
      .filter((x) => !x.progress.isComplete)
      .sort((a, b) => b.progress.percent - a.progress.percent);
    if (active.length > 0) return active[0];
    const g = savingsGoals[0];
    return { goal: g, progress: goalProgress(g) };
  }, [savingsGoals]);

  function insightText(item: InsightItem) {
    const raw = t(item.messageKey, item.values);
    return raw === "\u2014" ? item.messageKey : raw;
  }

  const empty = transactions.length === 0;
  const showForecast = forecast.hasEnoughData && (
    forecast.expectedNet != null ||
    forecast.expectedSpending != null ||
    forecast.expectedIncome != null
  );

  return (
    <section
      className="panel section-panel financial-radar-card"
      aria-label={t("financialRadar")}
    >
      <div className="section-heading financial-radar-heading">
        <div className="financial-radar-title-row">
          <span className="financial-radar-icon" aria-hidden="true">
            <Radar size={18} />
          </span>
          <h2>{t("financialRadar")}</h2>
          <span className="plus-badge financial-radar-plus">{t("radarPlusBadge")}</span>
        </div>
      </div>

      {empty ? (
        <div className="empty-state financial-radar-empty">
          <h3>{t("radarEmptyTitle")}</h3>
          <p>{t("radarEmptyBody")}</p>
        </div>
      ) : (
        <>
          <div className="financial-radar-forecast">
            <p className="financial-radar-forecast-label">{t("radarForecastLabel")}</p>
            {showForecast ? (
              <>
                <div className="financial-radar-metrics">
                  {forecast.expectedNet != null && (
                    <div className="financial-radar-metric">
                      <span className="financial-radar-metric-label">{t("radarExpectedNet")}</span>
                      <strong
                        className={
                          forecast.expectedNet >= 0
                            ? "is-positive"
                            : "is-negative"
                        }
                      >
                        {money(forecast.expectedNet)}
                      </strong>
                    </div>
                  )}
                  {forecast.expectedSpending != null && (
                    <div className="financial-radar-metric">
                      <span className="financial-radar-metric-label">
                        {t("radarExpectedSpending")}
                      </span>
                      <strong>{money(forecast.expectedSpending)}</strong>
                    </div>
                  )}
                  {forecast.expectedIncome != null && (
                    <div className="financial-radar-metric">
                      <span className="financial-radar-metric-label">
                        {t("radarExpectedIncome")}
                      </span>
                      <strong className="is-positive">{money(forecast.expectedIncome)}</strong>
                    </div>
                  )}
                </div>
                <p className="financial-radar-pace">
                  {t("forecastPaceNote", {
                    day: forecast.daysElapsed,
                    days: forecast.daysInMonth,
                  })}
                </p>
                <p className="financial-radar-disclaimer">{t("forecastDisclaimer")}</p>
                {(forecast.spendingSoFar > 0 || forecast.incomeSoFar > 0) && (
                  <p className="financial-radar-so-far">
                    {t("radarSoFar")}: −{money(forecast.spendingSoFar)}
                    {forecast.incomeSoFar > 0 ? ` / +${money(forecast.incomeSoFar)}` : ""}
                  </p>
                )}
              </>
            ) : (
              <p className="financial-radar-insufficient">{t("radarInsufficient")}</p>
            )}
          </div>

          {insights.length > 0 && (
            <div className="financial-radar-insights">
              <h3 className="financial-radar-insights-title">{t("insightsTitle")}</h3>
              <ul className="financial-radar-insight-list">
                {insights.map((item) => (
                  <li
                    key={item.id}
                    className={`financial-radar-insight is-${item.severity}`}
                  >
                    <span className="financial-radar-insight-icon" aria-hidden="true">
                      {insightIcon(item)}
                    </span>
                    <span>{insightText(item)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {featuredGoal && (
            <button
              type="button"
              className="financial-radar-goal"
              onClick={() => onOpenSavingsGoals?.()}
              aria-label={featuredGoal.goal.name}
            >
              <span className="financial-radar-goal-icon" aria-hidden="true">
                <PiggyBank size={16} />
              </span>
              <div className="financial-radar-goal-copy">
                <strong>{featuredGoal.goal.name}</strong>
                <span>
                  {featuredGoal.progress.isComplete
                    ? t("homeGoalComplete")
                    : t("homeGoalRemaining", {
                        amount: money(featuredGoal.progress.remaining),
                      })}
                </span>
              </div>
              <span className="financial-radar-goal-pct" aria-hidden="true">
                {featuredGoal.progress.percent}%
              </span>
              <div className="financial-radar-goal-track" aria-hidden="true">
                <span
                  className={`financial-radar-goal-fill ${
                    featuredGoal.progress.isComplete ? "is-complete" : ""
                  }`}
                  style={{ width: `${featuredGoal.progress.percent}%` }}
                />
              </div>
            </button>
          )}
        </>
      )}

      {onOpenAnalytics && (
        <button
          type="button"
          className="text-button financial-radar-action"
          onClick={onOpenAnalytics}
        >
          <BarChart3 size={16} aria-hidden="true" />
          {t("openAnalytics")}
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      )}
    </section>
  );
}
