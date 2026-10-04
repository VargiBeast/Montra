import { useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  CalendarRange,
  TrendingDown,
  TrendingUp,
  Wallet,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";
import type { Transaction } from "../types/transaction";
import {
  availableCategories,
  biggestExpenses,
  filterTransactions,
  previousRange,
  rangeForPeriod,
  spendingByCategory,
  summarize,
  timeBuckets,
  type AnalyticsPeriod,
  type AnalyticsTypeFilter,
  type DateRange,
} from "../lib/analytics";
import {
  buildMonthForecast,
  buildSavingsProjection,
  collectInsights,
  type InsightItem,
} from "../lib/insights";
import { formatDate, formatMoney } from "../lib/utils";
import { useDisplayCurrency } from "../lib/currency";
import { useLanguage, useTranslation } from "../lib/i18n";

interface AnalyticsPageProps {
  transactions: Transaction[];
}


const ANALYTICS_FALLBACK: Record<string, string> = {
  analytics: "Analytics",
  analyticsGreeting: "Patterns in your money",
  analyticsOverview: "Overview",
  analyticsPeriod: "Period",
  analyticsThisWeek: "This week",
  analyticsThisMonth: "This month",
  analyticsThisYear: "This year",
  analyticsLastMonth: "Last month",
  analyticsLastYear: "Last year",
  analyticsCustom: "Custom",
  analyticsFrom: "From",
  analyticsTo: "To",
  analyticsTypeFilter: "Type filter",
  analyticsCategory: "Category",
  analyticsAllCategories: "All categories",
  analyticsUncategorized: "Uncategorized",
  analyticsTotalIncome: "Total income",
  analyticsTotalSpending: "Total spending",
  analyticsNetChange: "Net change",
  analyticsSavingsRate: "Savings rate",
  analyticsIncomeVsExpenses: "Income vs expenses",
  analyticsSpendingOverTime: "Spending over time",
  analyticsSpendingByCategory: "Spending by category",
  analyticsCategoryHint: "Categories use the payment method on each entry. Change is vs the previous period of the same length.",
  analyticsBiggestExpenses: "Biggest expenses",
  analyticsEmptyTitle: "No data yet",
  analyticsEmptyBody: "Add a few purchases and money-in entries to see patterns here.",
  analyticsNoDataTitle: "Nothing in this period",
  analyticsNoDataBody: "Try another period or clear filters to see your activity.",
  analyticsNoSpending: "No spending in this period.",
  openAnalytics: "Open analytics",
  analyticsHint: "Income, spending and categories",
  insightsTitle: "Insights",
  insightsEmpty: "Not enough activity yet for insights. Add more entries over a few weeks.",
  insightSpendingUp: "Your spending is {percent}% higher than the previous period.",
  insightSpendingDown: "Your spending is {percent}% lower than the previous period.",
  insightCategoryShare: "{category} accounts for {percent}% of your spending in this period.",
  insightCategoryUp: "{category} spending is up {percent}% vs the previous period.",
  insightCategoryDown: "{category} spending is down {percent}% vs the previous period.",
  insightTrendDown: "Your spending has decreased for {weeks} consecutive weeks.",
  insightTrendUp: "Your spending has increased for {weeks} consecutive weeks.",
  insightUnusualExpense: "Unusually large expense: {name}.",
  insightUnusualPeriod: "Spending this month is about {percent}% above your typical month.",
  forecastTitle: "Month forecast",
  forecastInsufficient: "Need a bit more history to estimate this month. Keep logging entries.",
  forecastDisclaimer: "Estimate based on your history and spending so far — not a guarantee.",
  forecastExpectedSpending: "Expected spending",
  forecastExpectedIncome: "Expected income",
  forecastExpectedNet: "Expected net",
  forecastPaceNote: "Based on day {day} of {days} this month, blended with past months when available.",
  projectionTitle: "Savings projection",
  projectionInsufficient: "Projections need at least two months of activity.",
  projectionDisclaimer: "Simple average from your last {months} month(s). Not a savings goal.",
  projectionAvgIncome: "Avg. monthly income",
  projectionAvgSpending: "Avg. monthly spending",
  projectionAvgNet: "Avg. monthly net",
  projectionNext3: "If this continues — 3 months",
  projectionNext6: "If this continues — 6 months",
  projectionNext12: "If this continues — 12 months",
};

const PERIODS: AnalyticsPeriod[] = [
  "this_week",
  "this_month",
  "this_year",
  "last_month",
  "last_year",
  "custom",
];

function IncomeExpenseChart({
  buckets,
  money,
  incomeLabel,
  spendingLabel,
}: {
  buckets: Array<{ key: string; label: string; income: number; spending: number }>;
  money: (n: number) => string;
  incomeLabel: string;
  spendingLabel: string;
}) {
  const max = Math.max(1, ...buckets.flatMap((b) => [b.income, b.spending]));
  const height = 160;
  if (buckets.length === 0) return null;

  return (
    <div className="analytics-chart" role="img" aria-label={`${incomeLabel} / ${spendingLabel}`}>
      <div className="analytics-chart-legend">
        <span className="legend-item income"><i />{incomeLabel}</span>
        <span className="legend-item spending"><i />{spendingLabel}</span>
      </div>
      <div className="analytics-bars">
        {buckets.map((bucket) => {
          const inH = Math.round((bucket.income / max) * height);
          const outH = Math.round((bucket.spending / max) * height);
          return (
            <div key={bucket.key} className="analytics-bar-col" title={`${bucket.label}: ${money(bucket.income)} / ${money(bucket.spending)}`}>
              <div className="analytics-bar-pair" style={{ height }}>
                <span className="bar income" style={{ height: inH }} />
                <span className="bar spending" style={{ height: outH }} />
              </div>
              <span className="analytics-bar-label">{bucket.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SpendingTrendChart({
  buckets,
  money,
  spendingLabel,
}: {
  buckets: Array<{ key: string; label: string; spending: number }>;
  money: (n: number) => string;
  spendingLabel: string;
}) {
  const max = Math.max(1, ...buckets.map((b) => b.spending));
  const height = 120;
  if (buckets.length === 0) return null;
  const points = buckets.map((b, i) => {
    const x = buckets.length === 1 ? 50 : (i / (buckets.length - 1)) * 100;
    const y = 100 - (b.spending / max) * 100;
    return `${x},${y}`;
  });
  const areaPoints = `0,100 ${points.join(" ")} 100,100`;

  return (
    <div className="analytics-chart analytics-trend" role="img" aria-label={spendingLabel}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="analytics-trend-svg">
        <polygon points={areaPoints} className="trend-area" />
        <polyline points={points.join(" ")} className="trend-line" fill="none" />
      </svg>
      <div className="analytics-trend-labels">
        {buckets.map((b) => (
          <span key={b.key} title={money(b.spending)}>{b.label}</span>
        ))}
      </div>
    </div>
  );
}

function CategoryBars({
  rows,
  money,
}: {
  rows: Array<{ key: string; label: string; amount: number; percent: number; changePercent: number | null }>;
  money: (n: number) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.amount));
  return (
    <ul className="analytics-category-list">
      {rows.map((row) => (
        <li key={row.key}>
          <div className="analytics-category-head">
            <strong>{row.label}</strong>
            <span>{money(row.amount)}</span>
          </div>
          <div className="analytics-category-track">
            <span className="analytics-category-fill" style={{ width: `${Math.max(4, (row.amount / max) * 100)}%` }} />
          </div>
          <div className="analytics-category-meta">
            <span>{row.percent.toFixed(0)}%</span>
            {row.changePercent != null && Number.isFinite(row.changePercent) && (
              <span className={row.changePercent > 0 ? "is-up" : row.changePercent < 0 ? "is-down" : ""}>
                {row.changePercent > 0 ? "+" : ""}{row.changePercent.toFixed(0)}%
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function AnalyticsPage({ transactions }: AnalyticsPageProps) {
  const translate = useTranslation();
  const t = (key: string, values?: Record<string, string | number>) => {
    const value = translate(key, values);
    if (value !== "—" ) return value;
    return ANALYTICS_FALLBACK[key] ?? key;
  };
  const { language } = useLanguage();
  const { currency, convertFromBase } = useDisplayCurrency();

  const [period, setPeriod] = useState<AnalyticsPeriod>("this_month");
  const [custom, setCustom] = useState<DateRange>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      start: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-01`,
      end: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
    };
  });
  const [typeFilter, setTypeFilter] = useState<AnalyticsTypeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const uncategorized = t("analyticsUncategorized");

  const range = useMemo(() => rangeForPeriod(period, custom), [period, custom]);
  const prev = useMemo(() => previousRange(range), [range]);

  const inRange = useMemo(
    () => filterTransactions(transactions, range, typeFilter, categoryFilter),
    [transactions, range, typeFilter, categoryFilter],
  );
  const prevInRange = useMemo(
    () => filterTransactions(transactions, prev, typeFilter, categoryFilter),
    [transactions, prev, typeFilter, categoryFilter],
  );

  const summary = useMemo(() => summarize(inRange), [inRange]);
  const buckets = useMemo(() => timeBuckets(inRange, range, language), [inRange, range, language]);
  const categories = useMemo(
    () => spendingByCategory(inRange, uncategorized, prevInRange),
    [inRange, uncategorized, prevInRange],
  );
  const topExpenses = useMemo(() => biggestExpenses(inRange, 8), [inRange]);
  const insights = useMemo(
    () => collectInsights(transactions, range, uncategorized),
    [transactions, range, uncategorized],
  );
  const forecast = useMemo(() => buildMonthForecast(transactions), [transactions]);
  const projection = useMemo(() => buildSavingsProjection(transactions), [transactions]);

  function insightText(item: InsightItem) {
    const raw = t(item.messageKey, item.values);
    return raw === "—" ? item.messageKey : raw;
  }

  const categoryOptions = useMemo(
    () => availableCategories(transactions, uncategorized),
    [transactions, uncategorized],
  );

  const money = (valueInBase: number) =>
    formatMoney(valueInBase, currency, language, convertFromBase(valueInBase, currency));

  const periodLabel = (p: AnalyticsPeriod) => {
    const map: Record<AnalyticsPeriod, string> = {
      this_week: t("analyticsThisWeek"),
      this_month: t("analyticsThisMonth"),
      this_year: t("analyticsThisYear"),
      last_month: t("analyticsLastMonth"),
      last_year: t("analyticsLastYear"),
      custom: t("analyticsCustom"),
    };
    return map[p];
  };

  const empty = transactions.length === 0;
  const noDataInPeriod = !empty && inRange.length === 0;

  return (
    <main className="page-content analytics-page">
      <div className="page-header">
        <div>
          <p className="greeting">{t("analyticsGreeting")}</p>
          <h1 className="page-title">{t("analytics")}</h1>
        </div>
      </div>

      {empty ? (
        <section className="panel section-panel">
          <div className="empty-state">
            <span className="empty-art"><Activity size={22} /></span>
            <h3>{t("analyticsEmptyTitle")}</h3>
            <p>{t("analyticsEmptyBody")}</p>
          </div>
        </section>
      ) : (
        <>
          <section className="panel section-panel analytics-controls">
            <div className="analytics-period-row" role="group" aria-label={t("analyticsPeriod")}>
              {PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`filter-pill ${period === p ? "active" : ""}`}
                  aria-pressed={period === p}
                  onClick={() => setPeriod(p)}
                >
                  {periodLabel(p)}
                </button>
              ))}
            </div>
            {period === "custom" && (
              <div className="analytics-custom-range">
                <label>
                  <span className="visually-hidden">{t("analyticsFrom")}</span>
                  <input
                    type="date"
                    value={custom.start}
                    onChange={(e) => setCustom((c) => ({ ...c, start: e.target.value }))}
                  />
                </label>
                <span className="analytics-range-sep" aria-hidden="true">–</span>
                <label>
                  <span className="visually-hidden">{t("analyticsTo")}</span>
                  <input
                    type="date"
                    value={custom.end}
                    onChange={(e) => setCustom((c) => ({ ...c, end: e.target.value }))}
                  />
                </label>
              </div>
            )}
            <div className="analytics-filter-row">
              <div className="filter-pills" role="group" aria-label={t("analyticsTypeFilter")}>
                {(["all", "in", "out"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`filter-pill ${typeFilter === f ? "active" : ""}`}
                    aria-pressed={typeFilter === f}
                    onClick={() => setTypeFilter(f)}
                  >
                    {f === "all" ? t("all") : f === "in" ? t("moneyIn") : t("moneyOut")}
                  </button>
                ))}
              </div>
              {categoryOptions.length > 0 && (
                <label className="analytics-category-select">
                  <span className="visually-hidden">{t("analyticsCategory")}</span>
                  <select
                    value={categoryFilter ?? ""}
                    onChange={(e) => setCategoryFilter(e.target.value || null)}
                  >
                    <option value="">{t("analyticsAllCategories")}</option>
                    {categoryOptions.map((opt) => (
                      <option key={opt.key} value={opt.key}>{opt.label}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            <p className="analytics-range-note">
              <CalendarRange size={14} aria-hidden="true" />
              <span>
                {formatDate(range.start, language)} – {formatDate(range.end, language)}
              </span>
            </p>
          </section>

          {noDataInPeriod ? (
            <section className="panel section-panel">
              <div className="empty-state">
                <span className="empty-art"><BarChart3 size={22} /></span>
                <h3>{t("analyticsNoDataTitle")}</h3>
                <p>{t("analyticsNoDataBody")}</p>
              </div>
            </section>
          ) : (
            <>
              <section className="analytics-overview" aria-label={t("analyticsOverview")}>
                <article className="panel analytics-stat">
                  <span className="analytics-stat-icon income"><TrendingUp size={16} /></span>
                  <span className="eyebrow">{t("analyticsTotalIncome")}</span>
                  <strong>{money(summary.totalIncome)}</strong>
                </article>
                <article className="panel analytics-stat">
                  <span className="analytics-stat-icon spending"><TrendingDown size={16} /></span>
                  <span className="eyebrow">{t("analyticsTotalSpending")}</span>
                  <strong>{money(summary.totalSpending)}</strong>
                </article>
                <article className="panel analytics-stat">
                  <span className="analytics-stat-icon net"><Wallet size={16} /></span>
                  <span className="eyebrow">{t("analyticsNetChange")}</span>
                  <strong className={summary.netChange >= 0 ? "is-positive" : "is-negative"}>
                    {summary.netChange >= 0 ? "+" : "−"}{money(Math.abs(summary.netChange))}
                  </strong>
                </article>
                {summary.hasEnoughForRate && summary.savingsRate != null && (
                  <article className="panel analytics-stat">
                    <span className="analytics-stat-icon rate"><Activity size={16} /></span>
                    <span className="eyebrow">{t("analyticsSavingsRate")}</span>
                    <strong>{summary.savingsRate.toFixed(0)}%</strong>
                  </article>
                )}
              </section>

              <section className="panel section-panel">
                <div className="section-heading">
                  <h2>{t("analyticsIncomeVsExpenses")}</h2>
                </div>
                <IncomeExpenseChart
                  buckets={buckets}
                  money={money}
                  incomeLabel={t("moneyIn")}
                  spendingLabel={t("moneyOut")}
                />
              </section>

              <section className="panel section-panel">
                <div className="section-heading">
                  <h2>{t("analyticsSpendingOverTime")}</h2>
                </div>
                <SpendingTrendChart
                  buckets={buckets}
                  money={money}
                  spendingLabel={t("analyticsSpendingOverTime")}
                />
              </section>

              <section className="panel section-panel">
                <div className="section-heading">
                  <h2>{t("analyticsSpendingByCategory")}</h2>
                </div>
                {categories.length === 0 ? (
                  <p className="analytics-muted">{t("analyticsNoSpending")}</p>
                ) : (
                  <>
                    <CategoryBars rows={categories} money={money} />
                    <p className="analytics-hint">{t("analyticsCategoryHint")}</p>
                  </>
                )}
              </section>

              <section className="panel section-panel">
                <div className="section-heading">
                  <h2>{t("analyticsBiggestExpenses")}</h2>
                </div>
                {topExpenses.length === 0 ? (
                  <p className="analytics-muted">{t("analyticsNoSpending")}</p>
                ) : (
                  <ul className="analytics-expense-list">
                    {topExpenses.map((tx) => (
                      <li key={tx.id}>
                        <div>
                          <strong>{tx.name}</strong>
                          <span className="analytics-expense-meta">
                            {formatDate(tx.date, language)}
                            {" · "}
                            {tx.method?.trim() || uncategorized}
                          </span>
                        </div>
                        <span className="transaction-value out">{money(Number(tx.amount))}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="panel section-panel">
                <div className="section-heading">
                  <h2>{t("insightsTitle")}</h2>
                </div>
                {insights.length === 0 ? (
                  <p className="analytics-muted">{t("insightsEmpty")}</p>
                ) : (
                  <ul className="insights-list">
                    {insights.map((item) => (
                      <li key={item.id} className={`insights-item is-${item.severity}`}>
                        <span className="insights-item-icon" aria-hidden="true">
                          {item.severity === "warning" ? <AlertTriangle size={16} /> :
                           item.severity === "positive" ? <TrendingUp size={16} /> :
                           <Lightbulb size={16} />}
                        </span>
                        <p>{insightText(item)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="panel section-panel">
                <div className="section-heading">
                  <h2>{t("forecastTitle")}</h2>
                </div>
                {!forecast.hasEnoughData ? (
                  <p className="analytics-muted">{t("forecastInsufficient")}</p>
                ) : (
                  <>
                    <p className="analytics-hint">{t("forecastDisclaimer")}</p>
                    <div className="analytics-overview forecast-overview">
                      {forecast.expectedSpending != null && (
                        <article className="panel analytics-stat">
                          <span className="analytics-stat-icon spending"><TrendingDown size={16} /></span>
                          <span className="eyebrow">{t("forecastExpectedSpending")}</span>
                          <strong>{money(forecast.expectedSpending)}</strong>
                        </article>
                      )}
                      {forecast.expectedIncome != null && (
                        <article className="panel analytics-stat">
                          <span className="analytics-stat-icon income"><TrendingUp size={16} /></span>
                          <span className="eyebrow">{t("forecastExpectedIncome")}</span>
                          <strong>{money(forecast.expectedIncome)}</strong>
                        </article>
                      )}
                      {forecast.expectedNet != null && (
                        <article className="panel analytics-stat">
                          <span className="analytics-stat-icon net"><Wallet size={16} /></span>
                          <span className="eyebrow">{t("forecastExpectedNet")}</span>
                          <strong className={forecast.expectedNet >= 0 ? "is-positive" : "is-negative"}>
                            {forecast.expectedNet >= 0 ? "+" : "−"}{money(Math.abs(forecast.expectedNet))}
                          </strong>
                        </article>
                      )}
                    </div>
                    <p className="analytics-hint">
                      {t("forecastPaceNote", {
                        day: forecast.daysElapsed,
                        days: forecast.daysInMonth,
                      })}
                    </p>
                  </>
                )}
              </section>

              <section className="panel section-panel">
                <div className="section-heading">
                  <h2>{t("projectionTitle")}</h2>
                </div>
                {!projection.hasEnoughData ? (
                  <p className="analytics-muted">{t("projectionInsufficient")}</p>
                ) : (
                  <>
                    <p className="analytics-hint">{t("projectionDisclaimer", { months: projection.monthsUsed })}</p>
                    <div className="analytics-overview forecast-overview">
                      <article className="panel analytics-stat">
                        <span className="analytics-stat-icon income"><TrendingUp size={16} /></span>
                        <span className="eyebrow">{t("projectionAvgIncome")}</span>
                        <strong>{money(projection.avgMonthlyIncome)}</strong>
                      </article>
                      <article className="panel analytics-stat">
                        <span className="analytics-stat-icon spending"><TrendingDown size={16} /></span>
                        <span className="eyebrow">{t("projectionAvgSpending")}</span>
                        <strong>{money(projection.avgMonthlySpending)}</strong>
                      </article>
                      <article className="panel analytics-stat">
                        <span className="analytics-stat-icon net"><Wallet size={16} /></span>
                        <span className="eyebrow">{t("projectionAvgNet")}</span>
                        <strong className={projection.avgMonthlyNet >= 0 ? "is-positive" : "is-negative"}>
                          {projection.avgMonthlyNet >= 0 ? "+" : "−"}{money(Math.abs(projection.avgMonthlyNet))}
                        </strong>
                      </article>
                    </div>
                    <ul className="projection-horizon">
                      <li>
                        <span>{t("projectionNext3")}</span>
                        <strong className={projection.projectedNet3Months >= 0 ? "is-positive" : "is-negative"}>
                          {projection.projectedNet3Months >= 0 ? "+" : "−"}{money(Math.abs(projection.projectedNet3Months))}
                        </strong>
                      </li>
                      <li>
                        <span>{t("projectionNext6")}</span>
                        <strong className={projection.projectedNet6Months >= 0 ? "is-positive" : "is-negative"}>
                          {projection.projectedNet6Months >= 0 ? "+" : "−"}{money(Math.abs(projection.projectedNet6Months))}
                        </strong>
                      </li>
                      <li>
                        <span>{t("projectionNext12")}</span>
                        <strong className={projection.projectedNet12Months >= 0 ? "is-positive" : "is-negative"}>
                          {projection.projectedNet12Months >= 0 ? "+" : "−"}{money(Math.abs(projection.projectedNet12Months))}
                        </strong>
                      </li>
                    </ul>
                  </>
                )}
              </section>
            </>
          )}
        </>
      )}
    </main>
  );
}
