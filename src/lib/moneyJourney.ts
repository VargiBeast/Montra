/**
 * Money Journey — progress from real transactions and goals only.
 * Never invents streaks, achievements, or historical amounts.
 */
import type { Transaction } from "../types/transaction.ts";
import type { SavingsGoal } from "../types/savingsGoal.ts";
import { goalProgress, goalStage, type GoalStage } from "../types/savingsGoal.ts";
import { groupByMonth } from "./insights.ts";
import { summarize } from "./analytics.ts";

export interface MonthHistoryRow {
  month: string;
  income: number;
  spending: number;
  net: number;
  transactionCount: number;
}

export interface GoalMilestone {
  goalId: string;
  goalName: string;
  stage: GoalStage;
  percent: number;
  remaining: number;
  isComplete: boolean;
}

export interface MoneyJourneySummary {
  months: MonthHistoryRow[];
  milestones: GoalMilestone[];
  hasHistory: boolean;
  hasGoals: boolean;
}

export function buildMonthHistory(
  transactions: Transaction[],
  limit = 6,
): MonthHistoryRow[] {
  const map = groupByMonth(transactions);
  const keys = [...map.keys()].sort();
  const rows: MonthHistoryRow[] = [];
  for (const key of keys) {
    const txs = map.get(key) ?? [];
    if (txs.length === 0) continue;
    const s = summarize(txs);
    rows.push({
      month: key,
      income: s.totalIncome,
      spending: s.totalSpending,
      net: s.netChange,
      transactionCount: s.transactionCount,
    });
  }
  return rows.slice(-limit);
}

export function buildGoalMilestones(goals: SavingsGoal[]): GoalMilestone[] {
  return goals.map((g) => {
    const p = goalProgress(g);
    return {
      goalId: g.id,
      goalName: g.name,
      stage: goalStage(p.percent, p.isComplete),
      percent: p.percent,
      remaining: p.remaining,
      isComplete: p.isComplete,
    };
  });
}

export function buildMoneyJourney(
  transactions: Transaction[],
  goals: SavingsGoal[],
  monthLimit = 6,
): MoneyJourneySummary {
  const months = buildMonthHistory(transactions, monthLimit);
  const milestones = buildGoalMilestones(goals);
  return {
    months,
    milestones,
    hasHistory: months.length > 0,
    hasGoals: goals.length > 0,
  };
}
