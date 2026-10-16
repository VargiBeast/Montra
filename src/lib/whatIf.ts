/**
 * What If? — pure scenario math. Never mutates goals or transactions.
 * Amounts are in base currency (NOK). Display conversion stays in the UI.
 */
import type { SavingsGoal } from "../types/savingsGoal.ts";
import { goalPlanInsight, goalProgress } from "../types/savingsGoal.ts";

export interface WhatIfInput {
  /** Hypothetical extra monthly contribution (base currency). Must be >= 0. */
  monthlySave: number;
}

export interface WhatIfResult {
  remaining: number;
  isComplete: boolean;
  monthlySave: number;
  /** Months needed at the hypothetical rate; null if monthlySave <= 0 or already complete. */
  monthsToGoal: number | null;
  /** Approximate YYYY-MM completion; null when monthsToGoal is null. */
  estimatedMonth: string | null;
  /** Existing plan from deadline, if any. */
  planMonthlyNeeded: number | null;
  planMonthsRemaining: number | null;
  hasDeadline: boolean;
  /** True when hypothetical rate meets or beats deadline plan. */
  beatsDeadline: boolean | null;
  disclaimer: "estimate";
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function addMonths(from: Date, months: number): Date {
  const d = new Date(from.getFullYear(), from.getMonth(), 1);
  d.setMonth(d.getMonth() + months);
  return d;
}

function toYearMonth(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Estimate months and date for a savings goal under a hypothetical monthly save rate. */
export function projectWhatIf(
  goal: Pick<SavingsGoal, "current_amount" | "target_amount" | "deadline">,
  input: WhatIfInput,
  now = new Date(),
): WhatIfResult {
  const progress = goalProgress(goal);
  const plan = goalPlanInsight(goal, now);
  const monthlySave = Math.max(0, Number(input.monthlySave) || 0);

  if (progress.isComplete || progress.remaining <= 0) {
    return {
      remaining: 0,
      isComplete: true,
      monthlySave,
      monthsToGoal: 0,
      estimatedMonth: toYearMonth(now),
      planMonthlyNeeded: plan.monthlyNeeded,
      planMonthsRemaining: plan.monthsRemaining,
      hasDeadline: plan.hasDeadline,
      beatsDeadline: true,
      disclaimer: "estimate",
    };
  }

  if (monthlySave <= 0) {
    return {
      remaining: progress.remaining,
      isComplete: false,
      monthlySave: 0,
      monthsToGoal: null,
      estimatedMonth: null,
      planMonthlyNeeded: plan.monthlyNeeded,
      planMonthsRemaining: plan.monthsRemaining,
      hasDeadline: plan.hasDeadline,
      beatsDeadline: null,
      disclaimer: "estimate",
    };
  }

  const monthsToGoal = Math.ceil(progress.remaining / monthlySave);
  const estimated = addMonths(now, monthsToGoal);
  let beatsDeadline: boolean | null = null;
  if (plan.hasDeadline && plan.monthsRemaining != null) {
    beatsDeadline = monthsToGoal <= plan.monthsRemaining;
  }

  return {
    remaining: progress.remaining,
    isComplete: false,
    monthlySave: round2(monthlySave),
    monthsToGoal,
    estimatedMonth: toYearMonth(estimated),
    planMonthlyNeeded: plan.monthlyNeeded,
    planMonthsRemaining: plan.monthsRemaining,
    hasDeadline: plan.hasDeadline,
    beatsDeadline,
    disclaimer: "estimate",
  };
}
