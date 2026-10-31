/** Deterministic insights & forecasts – amounts always in NOK */
import type { Transaction } from '@/types/transaction';
import { toIsoDate, round2 } from './utils';

export interface MonthForecast {
  freEnoughData: boolean;
  expectedSpending: number | null;
  expectedIncome: number | null;
  expectedNet: number | null;
  daysElapsed: number;
  daysInMonth: number;
  spendingSoFar: number;
  incomeSoFar: number;
}

function spendingTotal(txs: Transaction[]) {
  return txs.reduce((s, t) => s + (t.type === 'out' ? Number(t.amount) || 0 : 0), 0);
}
function incomeTotal(txs: Transaction[]) {
  return txs.reduce((s, t) => s + (t.type === 'in' ? Number(t.amount) || 0 : 0), 0);
}

export function buildMonthForecast(all: Transaction[], now = new Date()): MonthForecast {
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const start = toIsoDate(new Date(year, month, 1));
  const today = toIsoDate(now);

  const soFar = all.filter((t) => t.date >= start && t.date <= today);
  const spendingSoFar = spendingTotal(soFar);
  const incomeSoFar = incomeTotal(soFar);

  if (day < 3 && spendingSoFar === 0 && incomeSoFar === 0) {
    return {
      freEnoughData: false,
      expectedSpending: null,
      expectedIncome: null,
      expectedNet: null,
      daysElapsed: day,
      daysInMonth,
      spendingSoFar,
      incomeSoFar,
    };
  }

  const factor = daysInMonth / Math.max(day, 1);
  const expectedSpending = round2(spendingSoFar * factor);
  const expectedIncome = incomeSoFar > 0 ? round2(incomeSoFar * factor) : null;

  return {
    freEnoughData: true,
    expectedSpending,
    expectedIncome,
    expectedNet: expectedIncome != null ? round2(expectedIncome - expectedSpending) : null,
    daysElapsed: day,
    daysInMonth,
    spendingSoFar,
    incomeSoFar,
  };
}

export function buildSimpleInsights(all: Transaction[]): string[] {
  const insights: string[] = [];
  if (all.length < 3) return insights;

  const now = new Date();
  const start = toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1));
  const today = toIsoDate(now);
  const monthTx = all.filter((t) => t.date >= start && t.date <= today);
  const spend = spendingTotal(monthTx);
  const income = incomeTotal(monthTx);

  if (income > 0 && spend > income * 0.9) {
    insights.push('You have spent most of this month\'s income so far.');
  }
  if (spend === 0 && monthTx.length > 0) {
    insights.push('No expenses recorded this month yet.');
  }
  if freEnough(all)) {
    const forecast = buildMonthForecast(all);
    if (forecast.expectedSpending && forecast.expectedSpending > 0) {
      insights.push(`Projected spending this month: around the current pace.`);
    }
  }
  return insights.slice(0, 4);
}

function freEnough(all: Transaction[]) {
  return all.length >= 5;
}
