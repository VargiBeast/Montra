import type { Transaction } from '@/types/transaction';
import { toIsoDate } from '@/lib/utils';

export type MonthBucket = {
  key: string; // YYYY-MM
  label: string;
  income: number;
  expenses: number;
  net: number;
};

export type MethodSlice = {
  name: string;
  amount: number;
  share: number; // 0–1 of expenses in period
};

export type AnalyticsSnapshot = {
  /** Current calendar month */
  periodLabel: string;
  incomeMonth: number;
  expensesMonth: number;
  netMonth: number;
  /** All-time from loaded txs */
  balance: number;
  txCount: number;
  expenseCountMonth: number;
  avgExpenseMonth: number;
  methods: MethodSlice[];
  months: MonthBucket[]; // oldest → newest, up to 6
  /** Simple forecast: avg of last 3 months expenses */
  forecastExpenseNext: number | null;
  forecastIncomeNext: number | null;
  forecastNetNext: number | null;
  /** MoM expense change vs previous full month */
  expenseMomPct: number | null;
  topExpenseName: string | null;
  topExpenseAmount: number;
  savingsRateMonth: number | null; // income>0 ? net/income : null
};

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleString('en', { month: 'short' });
}

export function buildAnalytics(transactions: Transaction[], now = new Date()): AnalyticsSnapshot {
  const startOfMonth = toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1));
  const today = toIsoDate(now);
  const periodLabel = now.toLocaleString('en', { month: 'long', year: 'numeric' });

  const monthKeys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthKeys.push(monthKey(d));
  }

  const buckets: Record<string, MonthBucket> = {};
  for (const key of monthKeys) {
    buckets[key] = { key, label: monthLabel(key), income: 0, expenses: 0, net: 0 };
  }

  let balance = 0;
  let incomeMonth = 0;
  let expensesMonth = 0;
  let expenseCountMonth = 0;
  const methodTotals: Record<string, number> = {};
  let topExpenseName: string | null = null;
  let topExpenseAmount = 0;

  for (const tx of transactions) {
    const amount = Number(tx.amount) || 0;
    const mk = tx.date.slice(0, 7);

    if (tx.type === 'in') {
      balance += amount;
      if (tx.date >= startOfMonth && tx.date <= today) incomeMonth += amount;
      if (mk in buckets) buckets[mk].income += amount;
    } else {
      balance -= amount;
      if (tx.date >= startOfMonth && tx.date <= today) {
        expensesMonth += amount;
        expenseCountMonth += 1;
        const method = (tx.method && tx.method.trim()) || 'Other';
        methodTotals[method] = (methodTotals[method] ?? 0) + amount;
        if (amount > topExpenseAmount) {
          topExpenseAmount = amount;
          topExpenseName = tx.name;
        }
      }
      if (mk in buckets) buckets[mk].expenses += amount;
    }
  }

  for (const key of monthKeys) {
    const b = buckets[key];
    b.net = b.income - b.expenses;
  }

  const months = monthKeys.map((k) => buckets[k]);
  const methods: MethodSlice[] = Object.entries(methodTotals)
    .map(([name, amount]) => ({
      name,
      amount,
      share: expensesMonth > 0 ? amount / expensesMonth : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  // Forecast from last up-to-3 completed/current months with any activity
  const activeMonths = months.filter((m) => m.income > 0 || m.expenses > 0).slice(-3);
  let forecastExpenseNext: number | null = null;
  let forecastIncomeNext: number | null = null;
  let forecastNetNext: number | null = null;
  if (activeMonths.length > 0) {
    const n = activeMonths.length;
    forecastExpenseNext = activeMonths.reduce((s, m) => s + m.expenses, 0) / n;
    forecastIncomeNext = activeMonths.reduce((s, m) => s + m.income, 0) / n;
    forecastNetNext = forecastIncomeNext - forecastExpenseNext;
  }

  // MoM: current month expenses vs previous month bucket
  let expenseMomPct: number | null = null;
  if (months.length >= 2) {
    const prev = months[months.length - 2];
    const curr = months[months.length - 1];
    if (prev.expenses > 0) {
      expenseMomPct = ((curr.expenses - prev.expenses) / prev.expenses) * 100;
    }
  }

  const netMonth = incomeMonth - expensesMonth;
  const savingsRateMonth = incomeMonth > 0 ? netMonth / incomeMonth : null;
  const avgExpenseMonth = expenseCountMonth > 0 ? expensesMonth / expenseCountMonth : 0;

  return {
    periodLabel,
    incomeMonth,
    expensesMonth,
    netMonth,
    balance,
    txCount: transactions.length,
    expenseCountMonth,
    avgExpenseMonth,
    methods,
    months,
    forecastExpenseNext,
    forecastIncomeNext,
    forecastNetNext,
    expenseMomPct,
    topExpenseName,
    topExpenseAmount,
    savingsRateMonth,
  };
}
