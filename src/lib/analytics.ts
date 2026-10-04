import type { Transaction } from "../types/transaction";

export type AnalyticsPeriod =
  | "this_week"
  | "this_month"
  | "this_year"
  | "last_month"
  | "last_year"
  | "custom";

export type AnalyticsTypeFilter = "all" | "in" | "out";

export interface DateRange {
  start: string;
  end: string;
}

export interface AnalyticsBucket {
  key: string;
  label: string;
  income: number;
  spending: number;
}

export interface CategoryBreakdown {
  key: string;
  label: string;
  amount: number;
  percent: number;
  previousAmount: number | null;
  changePercent: number | null;
}

export interface AnalyticsSummary {
  totalIncome: number;
  totalSpending: number;
  netChange: number;
  savingsRate: number | null;
  transactionCount: number;
  hasEnoughForRate: boolean;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfWeek(d: Date): Date {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function endOfWeek(d: Date): Date {
  const start = startOfWeek(d);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
}

export function rangeForPeriod(period: AnalyticsPeriod, custom?: DateRange, now = new Date()): DateRange {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (period === "custom" && custom?.start && custom?.end) {
    return custom.start <= custom.end
      ? { start: custom.start, end: custom.end }
      : { start: custom.end, end: custom.start };
  }

  if (period === "this_week") {
    return { start: toIsoDate(startOfWeek(today)), end: toIsoDate(endOfWeek(today)) };
  }

  if (period === "this_month") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { start: toIsoDate(start), end: toIsoDate(end) };
  }

  if (period === "this_year") {
    return {
      start: `${today.getFullYear()}-01-01`,
      end: `${today.getFullYear()}-12-31`,
    };
  }

  if (period === "last_month") {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 0);
    return { start: toIsoDate(start), end: toIsoDate(end) };
  }

  const y = today.getFullYear() - 1;
  return { start: `${y}-01-01`, end: `${y}-12-31` };
}

export function previousRange(range: DateRange): DateRange {
  const start = new Date(`${range.start}T12:00:00`);
  const end = new Date(`${range.end}T12:00:00`);
  const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - (days - 1));
  return { start: toIsoDate(prevStart), end: toIsoDate(prevEnd) };
}

export function categoryKey(transaction: Transaction): string {
  const method = transaction.method?.trim();
  return method ? method.toLowerCase() : "__uncategorized__";
}

export function categoryLabel(transaction: Transaction, uncategorized: string): string {
  const method = transaction.method?.trim();
  return method || uncategorized;
}

export function filterTransactions(
  transactions: Transaction[],
  range: DateRange,
  typeFilter: AnalyticsTypeFilter,
  category: string | null,
): Transaction[] {
  return transactions.filter((tx) => {
    if (tx.date < range.start || tx.date > range.end) return false;
    if (typeFilter === "in" && tx.type !== "in") return false;
    if (typeFilter === "out" && tx.type !== "out") return false;
    if (category && categoryKey(tx) !== category) return false;
    return true;
  });
}

export function summarize(transactions: Transaction[]): AnalyticsSummary {
  let totalIncome = 0;
  let totalSpending = 0;
  for (const tx of transactions) {
    const amount = Number(tx.amount) || 0;
    if (tx.type === "in") totalIncome += amount;
    else totalSpending += amount;
  }
  const netChange = totalIncome - totalSpending;
  const hasEnoughForRate = totalIncome > 0 && transactions.length >= 2;
  const savingsRate = hasEnoughForRate ? (netChange / totalIncome) * 100 : null;
  return {
    totalIncome,
    totalSpending,
    netChange,
    savingsRate,
    transactionCount: transactions.length,
    hasEnoughForRate,
  };
}

function daysBetween(start: string, end: string): number {
  const a = new Date(`${start}T12:00:00`).getTime();
  const b = new Date(`${end}T12:00:00`).getTime();
  return Math.round((b - a) / 86400000) + 1;
}

export type BucketGranularity = "day" | "week" | "month";

export function pickGranularity(range: DateRange): BucketGranularity {
  const days = daysBetween(range.start, range.end);
  if (days <= 14) return "day";
  if (days <= 90) return "week";
  return "month";
}

function bucketKeyForDate(date: string, granularity: BucketGranularity): string {
  if (granularity === "day") return date;
  const d = new Date(`${date}T12:00:00`);
  if (granularity === "week") return toIsoDate(startOfWeek(d));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

function formatBucketLabel(key: string, granularity: BucketGranularity, locale: string): string {
  if (granularity === "month") {
    const [y, m] = key.split("-").map(Number);
    const d = new Date(y, m - 1, 1);
    return new Intl.DateTimeFormat(locale, { month: "short", year: "2-digit" }).format(d);
  }
  const d = new Date(`${key}T12:00:00`);
  if (granularity === "week") {
    return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(d);
  }
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(d);
}

export function timeBuckets(
  transactions: Transaction[],
  range: DateRange,
  locale: string,
): AnalyticsBucket[] {
  const granularity = pickGranularity(range);
  const map = new Map<string, AnalyticsBucket>();

  const cursor = new Date(`${range.start}T12:00:00`);
  const end = new Date(`${range.end}T12:00:00`);
  while (cursor <= end) {
    const iso = toIsoDate(cursor);
    const key = bucketKeyForDate(iso, granularity);
    if (!map.has(key)) {
      map.set(key, {
        key,
        label: formatBucketLabel(key, granularity, locale),
        income: 0,
        spending: 0,
      });
    }
    if (granularity === "day") cursor.setDate(cursor.getDate() + 1);
    else if (granularity === "week") cursor.setDate(cursor.getDate() + 7);
    else cursor.setMonth(cursor.getMonth() + 1);
  }

  for (const tx of transactions) {
    const key = bucketKeyForDate(tx.date, granularity);
    let bucket = map.get(key);
    if (!bucket) {
      bucket = {
        key,
        label: formatBucketLabel(key, granularity, locale),
        income: 0,
        spending: 0,
      };
      map.set(key, bucket);
    }
    const amount = Number(tx.amount) || 0;
    if (tx.type === "in") bucket.income += amount;
    else bucket.spending += amount;
  }

  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export function spendingByCategory(
  transactions: Transaction[],
  uncategorized: string,
  previous?: Transaction[],
): CategoryBreakdown[] {
  const totals = new Map<string, { label: string; amount: number }>();
  let total = 0;
  for (const tx of transactions) {
    if (tx.type !== "out") continue;
    const amount = Number(tx.amount) || 0;
    total += amount;
    const key = categoryKey(tx);
    const existing = totals.get(key);
    if (existing) existing.amount += amount;
    else totals.set(key, { label: categoryLabel(tx, uncategorized), amount });
  }

  const prevTotals = new Map<string, number>();
  if (previous) {
    for (const tx of previous) {
      if (tx.type !== "out") continue;
      const key = categoryKey(tx);
      prevTotals.set(key, (prevTotals.get(key) ?? 0) + (Number(tx.amount) || 0));
    }
  }

  const rows: CategoryBreakdown[] = [...totals.entries()].map(([key, value]) => {
    const previousAmount = previous ? (prevTotals.get(key) ?? 0) : null;
    let changePercent: number | null = null;
    if (previousAmount != null && previousAmount > 0) {
      changePercent = ((value.amount - previousAmount) / previousAmount) * 100;
    } else if (previousAmount === 0 && value.amount > 0) {
      changePercent = 100;
    }
    return {
      key,
      label: value.label,
      amount: value.amount,
      percent: total > 0 ? (value.amount / total) * 100 : 0,
      previousAmount,
      changePercent,
    };
  });

  return rows.sort((a, b) => b.amount - a.amount);
}

export function biggestExpenses(transactions: Transaction[], limit = 8): Transaction[] {
  return transactions
    .filter((tx) => tx.type === "out")
    .slice()
    .sort((a, b) => Number(b.amount) - Number(a.amount) || b.date.localeCompare(a.date))
    .slice(0, limit);
}

export function availableCategories(
  transactions: Transaction[],
  uncategorized: string,
): Array<{ key: string; label: string }> {
  const map = new Map<string, string>();
  for (const tx of transactions) {
    const key = categoryKey(tx);
    if (!map.has(key)) map.set(key, categoryLabel(tx, uncategorized));
  }
  return [...map.entries()]
    .map(([key, label]) => ({ key, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
