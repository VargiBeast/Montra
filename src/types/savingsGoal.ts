export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  /** Target amount in base currency (NOK). */
  target_amount: number;
  /** Current progress amount in base currency (NOK). */
  current_amount: number;
  /** Optional deadline YYYY-MM-DD. */
  deadline: string | null;
  /** Optional; not present on all deployments. */
  wishlist_item_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavingsGoalInput {
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
}

export function goalProgress(goal: Pick<SavingsGoal, "current_amount" | "target_amount">): {
  percent: number;
  remaining: number;
  isComplete: boolean;
  isOverTarget: boolean;
} {
  const target = Number(goal.target_amount) || 0;
  const current = Math.max(0, Number(goal.current_amount) || 0);
  if (target <= 0) {
    return { percent: 0, remaining: 0, isComplete: false, isOverTarget: false };
  }
  const remaining = Math.max(0, target - current);
  const raw = (current / target) * 100;
  const percent = Math.min(100, Math.max(0, Math.round(raw)));
  return {
    percent,
    remaining,
    isComplete: current >= target,
    isOverTarget: current > target,
  };
}

/** Real progress bands. Labels only — never fake urgency. */
export type GoalStage = "early" | "building" | "halfway" | "almost" | "reached";

export function goalStage(percent: number, isComplete: boolean): GoalStage {
  if (isComplete || percent >= 100) return "reached";
  if (percent >= 75) return "almost";
  if (percent >= 45 && percent <= 55) return "halfway";
  if (percent >= 25) return "building";
  return "early";
}

