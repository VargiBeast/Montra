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



/** Planning helpers for Plus — honest math from target, current and optional deadline. */
export interface GoalPlanInsight {
  remaining: number;
  monthsRemaining: number | null;
  monthlyNeeded: number | null;
  estimatedCompletion: string | null;
  hasDeadline: boolean;
  isComplete: boolean;
  onTrack: boolean | null;
}

export function goalPlanInsight(
  goal: Pick<SavingsGoal, "current_amount" | "target_amount" | "deadline">,
  now = new Date(),
): GoalPlanInsight {
  const progress = goalProgress(goal);
  const remaining = progress.remaining;
  const isComplete = progress.isComplete;
  if (isComplete || remaining <= 0) {
    return { remaining: 0, monthsRemaining: null, monthlyNeeded: null, estimatedCompletion: null, hasDeadline: Boolean(goal.deadline), isComplete: true, onTrack: true };
  }
  const deadline = goal.deadline && /^\d{4}-\d{2}-\d{2}$/.test(goal.deadline) ? goal.deadline : null;
  if (!deadline) {
    return { remaining, monthsRemaining: null, monthlyNeeded: null, estimatedCompletion: null, hasDeadline: false, isComplete: false, onTrack: null };
  }
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(`${deadline}T12:00:00`);
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysLeft = Math.max(0, Math.ceil((end.getTime() - today.getTime()) / msPerDay));
  const monthsRemaining = Math.max(1 / 30, daysLeft / 30.4375);
  const monthlyNeeded = Math.round((remaining / monthsRemaining) * 100) / 100;
  return { remaining, monthsRemaining: Math.round(monthsRemaining * 10) / 10, monthlyNeeded, estimatedCompletion: deadline, hasDeadline: true, isComplete: false, onTrack: daysLeft > 0 ? true : null };
}
