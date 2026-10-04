/**
 * Deterministic insights, anomaly detection, and forecasts from transaction data.
 * Amounts are always in base currency (NOK). Display conversion is done in the UI.
 */
import type { Transaction } from "../types/transaction";
import {
  categoryKey,
  categoryLabel,
  filterTransactions,
  previousRange,
  summarize,
  toIsoDate,
  type DateRange,
} from "./analytics.ts";

export type InsightKind =
  | "spending_change"
  | "category_share"
  | "category_change"
  | "trend"
  | "unusual_expense"
  | "unusual_period"
  | "forecast"
  | "projection";

export interface InsightItem {
  id: string;
  kind: InsightKind;
  messageKey: string;
  values: Record<string, string | number>;
  severity: "info" | "positive" | "warning";
}

export interface MonthForecast {
  hasEnoughData: boolean;
  expectedSpending: number | null;
  expectedIncome: number | null;
  expectedNet: number | null;
  daysElapsed: number;
  daysInMonth: number;
  spendingSoFar: number;
  incomeSoFar: number;
  projectedSpendingMonth: number | null;
  projectedIncomeMonth: number | null;
}

export interface SavingsProjection {
  hasEnoughData: boolean;
  monthsUsed: number;
  avgMonthlyIncome: number;
  avgMonthlySpending: number;
  avgMonthlyNet: number;
  projectedNet3Months: number;
  projectedNet6Months: number;
  projectedNet12Months: number;
}

const MIN_TX_FOR_PERIOD_COMPARE = 3;
const MIN_TX_FOR_CATEGORY = 2;
const MIN_MONTHS_FOR_FORECAST = 2;
const MIN_MONTHS_FOR_PROJECTION = 2;
const UNUSUAL_EXPENSE_MULT = 2.5;
const UNUSUAL_PERIOD_MULT = 1.5;
const MIN_HISTORY_EXPENSES = 5;

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function spendingTotal(txs: Transaction[]): number {
  return txs.reduce((sum, tx) => sum + (tx.type === "out" ? Number(tx.amount) || 0 : 0), 0);
}

function incomeTotal(txs: Transaction[]): number {
  return txs.reduce((sum, tx) => sum + (tx.type === "in" ? Number(tx.amount) || 0 : 0), 0);
}

function monthKey(date: string): string {
  return date.slice(0, 7);
}

export function groupByMonth(transactions: Transaction[]): Map<string, Transaction[]> {
  const map = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    const key = monthKey(tx.date);
    const list = map.get(key);
    if (list) list.push(tx);
    else map.set(key, [tx]);
  }
  return map;
}

function sortedMonthKeys(map: Map<string, Transaction[]>): string[] {
  return [...map.keys()].sort();
}

export function buildSpendingInsights(
  allTransactions: Transaction[],
  range: DateRange,
  uncategorized: string,
): InsightItem[] {
  const insights: InsightItem[] = [];
  const current = filterTransactions(allTransactions, range, "all", null);
  const prev = filterTransactions(allTransactions, previousRange(range), "all", null);

  const currentOut = current.filter((t) => t.type === "out");
  const prevOut = prev.filter((t) => t.type === "out");

  const spendNow = spendingTotal(current);
  const spendPrev = spendingTotal(prev);

  if (
    currentOut.length >= MIN_TX_FOR_PERIOD_COMPARE &&
    prevOut.length >= MIN_TX_FOR_PERIOD_COMPARE &&
    spendPrev > 0
  ) {
    const change = ((spendNow - spendPrev) / spendPrev) * 100;
    if (Math.abs(change) >= 5) {
      insights.push({
        id: "spending_change",
        kind: "spending_change",
        messageKey: change > 0 ? "insightSpendingUp" : "insightSpendingDown",
        values: { percent: Math.round(Math.abs(change)) },
        severity: change > 0 ? "warning" : "positive",
      });
    }
  }

  const byCat = new Map<string, { label: string; amount: number }>();
  for (const tx of currentOut) {
    const key = categoryKey(tx);
    const amount = Number(tx.amount) || 0;
    const existing = byCat.get(key);
    if (existing) existing.amount += amount;
    else byCat.set(key, { label: categoryLabel(tx, uncategorized), amount });
  }
  if (spendNow > 0 && currentOut.length >= MIN_TX_FOR_CATEGORY) {
    const top = [...byCat.values()].sort((a, b) => b.amount - a.amount)[0];
    if (top) {
      const share = (top.amount / spendNow) * 100;
      if (share >= 20) {
        insights.push({
          id: "category_share",
          kind: "category_share",
          messageKey: "insightCategoryShare",
          values: { category: top.label, percent: Math.round(share) },
          severity: "info",
        });
      }
    }
  }

  if (prevOut.length >= MIN_TX_FOR_CATEGORY && currentOut.length >= MIN_TX_FOR_CATEGORY) {
    const prevCat = new Map<string, { label: string; amount: number }>();
    for (const tx of prevOut) {
      const key = categoryKey(tx);
      const amount = Number(tx.amount) || 0;
      const existing = prevCat.get(key);
      if (existing) existing.amount += amount;
      else prevCat.set(key, { label: categoryLabel(tx, uncategorized), amount });
    }
    let bestUp: { label: string; change: number } | null = null;
    let bestDown: { label: string; change: number } | null = null;
    for (const [key, now] of byCat) {
      const before = prevCat.get(key)?.amount ?? 0;
      if (before < 1 && now.amount < 50) continue;
      const change = before > 0 ? ((now.amount - before) / before) * 100 : 100;
      if (change >= 25 && (!bestUp || change > bestUp.change)) {
        bestUp = { label: now.label, change };
      }
      if (change <= -25 && before > 0 && (!bestDown || change < bestDown.change)) {
        bestDown = { label: now.label, change };
      }
    }
    if (bestUp) {
      insights.push({
        id: "category_up",
        kind: "category_change",
        messageKey: "insightCategoryUp",
        values: { category: bestUp.label, percent: Math.round(bestUp.change) },
        severity: "warning",
      });
    }
    if (bestDown) {
      insights.push({
        id: "category_down",
        kind: "category_change",
        messageKey: "insightCategoryDown",
        values: { category: bestDown.label, percent: Math.round(Math.abs(bestDown.change)) },
        severity: "positive",
      });
    }
  }

  const weekTrend = consecutiveWeekTrend(allTransactions);
  if (weekTrend === "down") {
    insights.push({
      id: "trend_down",
      kind: "trend",
      messageKey: "insightTrendDown",
      values: { weeks: 3 },
      severity: "positive",
    });
  } else if (weekTrend === "up") {
    insights.push({
      id: "trend_up",
      kind: "trend",
      messageKey: "insightTrendUp",
      values: { weeks: 3 },
      severity: "warning",
    });
  }

  return insights.slice(0, 6);
}

function consecutiveWeekTrend(transactions: Transaction[]): "up" | "down" | null {
  const outs = transactions.filter((t) => t.type === "out");
  if (outs.length < 9) return null;

  const now = new Date();
  const weeks: number[] = [];
  for (let i = 0; i < 3; i++) {
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    const s = toIsoDate(start);
    const e = toIsoDate(end);
    const total = outs
      .filter((t) => t.date >= s && t.date <= e)
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    weeks.push(total);
  }
  if (weeks.every((w) => w > 0) && weeks[0] < weeks[1] && weeks[1] < weeks[2]) return "down";
  if (weeks.every((w) => w > 0) && weeks[0] > weeks[1] && weeks[1] > weeks[2]) return "up";
  return null;
}

export function buildUnusualInsights(
  allTransactions: Transaction[],
  range: DateRange,
): InsightItem[] {
  const insights: InsightItem[] = [];
  const historyOut = allTransactions.filter((t) => t.type === "out");
  if (historyOut.length < MIN_HISTORY_EXPENSES) return insights;

  const amounts = historyOut.map((t) => Number(t.amount) || 0).filter((n) => n > 0);
  if (amounts.length < MIN_HISTORY_EXPENSES) return insights;

  const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const sorted = amounts.slice().sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] || avg;
  const threshold = Math.max(avg, median) * UNUSUAL_EXPENSE_MULT;

  const inRange = filterTransactions(allTransactions, range, "out", null);
  const unusual = inRange
    .filter((t) => (Number(t.amount) || 0) >= threshold && (Number(t.amount) || 0) > 0)
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, 2);

  for (const tx of unusual) {
    insights.push({
      id: `unusual_expense_${tx.id}`,
      kind: "unusual_expense",
      messageKey: "insightUnusualExpense",
      values: {
        name: tx.name,
        amount: round2(Number(tx.amount) || 0),
      },
      severity: "warning",
    });
  }

  const spendNow = spendingTotal(inRange);
  const months = groupByMonth(allTransactions);
  const keys = sortedMonthKeys(months);
  if (keys.length >= MIN_MONTHS_FOR_FORECAST && spendNow > 0) {
    const monthlySpends = keys.map((k) => spendingTotal(months.get(k) ?? []));
    const histAvg = monthlySpends.reduce((a, b) => a + b, 0) / monthlySpends.length;
    const days =
      Math.round(
        (new Date(`${range.end}T12:00:00`).getTime() - new Date(`${range.start}T12:00:00`).getTime()) /
          86400000,
      ) + 1;
    if (days >= 25 && days <= 35 && histAvg > 0 && spendNow > histAvg * UNUSUAL_PERIOD_MULT) {
      insights.push({
        id: "unusual_period",
        kind: "unusual_period",
        messageKey: "insightUnusualPeriod",
        values: { percent: Math.round(((spendNow - histAvg) / histAvg) * 100) },
        severity: "warning",
      });
    }
  }

  return insights;
}

export function buildMonthForecast(
  allTransactions: Transaction[],
  now = new Date(),
): MonthForecast {
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const start = toIsoDate(new Date(year, month, 1));
  const today = toIsoDate(now);
  const soFar = filterTransactions(allTransactions, { start, end: today }, "all", null);
  const spendingSoFar = spendingTotal(soFar);
  const incomeSoFar = incomeTotal(soFar);

  const months = groupByMonth(allTransactions);
  const keys = sortedMonthKeys(months).filter((k) => k < `${year}-${String(month + 1).padStart(2, "0")}`);
  const hasEnoughData = keys.length >= MIN_MONTHS_FOR_FORECAST;

  if (!hasEnoughData) {
    if (day >= 3 && (spendingSoFar > 0 || incomeSoFar > 0)) {
      const factor = daysInMonth / day;
      return {
        hasEnoughData: true,
        expectedSpending: round2(spendingSoFar * factor),
        expectedIncome: incomeSoFar > 0 ? round2(incomeSoFar * factor) : null,
        expectedNet:
          incomeSoFar > 0
            ? round2(incomeSoFar * factor - spendingSoFar * factor)
            : null,
        daysElapsed: day,
        daysInMonth,
        spendingSoFar,
        incomeSoFar,
        projectedSpendingMonth: round2(spendingSoFar * factor),
        projectedIncomeMonth: incomeSoFar > 0 ? round2(incomeSoFar * factor) : null,
      };
    }
    return {
      hasEnoughData: false,
      expectedSpending: null,
      expectedIncome: null,
      expectedNet: null,
      daysElapsed: day,
      daysInMonth,
      spendingSoFar,
      incomeSoFar,
      projectedSpendingMonth: null,
      projectedIncomeMonth: null,
    };
  }

  const histSpend = keys.map((k) => spendingTotal(months.get(k) ?? []));
  const histIncome = keys.map((k) => incomeTotal(months.get(k) ?? []));
  const avgSpend = histSpend.reduce((a, b) => a + b, 0) / histSpend.length;
  const avgIncome = histIncome.reduce((a, b) => a + b, 0) / histIncome.length;

  const paceSpend = day >= 1 ? (spendingSoFar / day) * daysInMonth : avgSpend;
  const paceIncome = day >= 1 ? (incomeSoFar / day) * daysInMonth : avgIncome;
  const weight = Math.min(0.7, day / daysInMonth);
  const expectedSpending = round2(avgSpend * (1 - weight) + paceSpend * weight);
  const expectedIncome =
    avgIncome > 0 || incomeSoFar > 0
      ? round2(avgIncome * (1 - weight) + paceIncome * weight)
      : null;
  const expectedNet =
    expectedIncome != null ? round2(expectedIncome - expectedSpending) : null;

  return {
    hasEnoughData: true,
    expectedSpending,
    expectedIncome,
    expectedNet,
    daysElapsed: day,
    daysInMonth,
    spendingSoFar,
    incomeSoFar,
    projectedSpendingMonth: expectedSpending,
    projectedIncomeMonth: expectedIncome,
  };
}

export function buildSavingsProjection(allTransactions: Transaction[]): SavingsProjection {
  const months = groupByMonth(allTransactions);
  const keys = sortedMonthKeys(months);
  if (keys.length < MIN_MONTHS_FOR_PROJECTION) {
    return {
      hasEnoughData: false,
      monthsUsed: keys.length,
      avgMonthlyIncome: 0,
      avgMonthlySpending: 0,
      avgMonthlyNet: 0,
      projectedNet3Months: 0,
      projectedNet6Months: 0,
      projectedNet12Months: 0,
    };
  }

  const use = keys.slice(-12);
  let income = 0;
  let spending = 0;
  for (const k of use) {
    const list = months.get(k) ?? [];
    income += incomeTotal(list);
    spending += spendingTotal(list);
  }
  const n = use.length;
  const avgMonthlyIncome = round2(income / n);
  const avgMonthlySpending = round2(spending / n);
  const avgMonthlyNet = round2(avgMonthlyIncome - avgMonthlySpending);

  return {
    hasEnoughData: true,
    monthsUsed: n,
    avgMonthlyIncome,
    avgMonthlySpending,
    avgMonthlyNet,
    projectedNet3Months: round2(avgMonthlyNet * 3),
    projectedNet6Months: round2(avgMonthlyNet * 6),
    projectedNet12Months: round2(avgMonthlyNet * 12),
  };
}

export function collectInsights(
  allTransactions: Transaction[],
  range: DateRange,
  uncategorized: string,
): InsightItem[] {
  const a = buildSpendingInsights(allTransactions, range, uncategorized);
  const b = buildUnusualInsights(allTransactions, range);
  return [...a, ...b].slice(0, 8);
}

export { summarize };
