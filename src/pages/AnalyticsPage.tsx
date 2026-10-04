import { useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  CalendarRange,
  TrendingDown,
  TrendingUp,
  Wallet,
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
import { formatDate, formatMoney } from "../lib/utils";
import { useDisplayCurrency } from "../lib/currency";
import { useLanguage, useTranslation } from "../lib/i18n";

interface AnalyticsPageProps {
  transactions: Transaction[];
}

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
  const t = useTranslation();
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
            </>
          )}
        </>
      )}
    </main>
  );
}
