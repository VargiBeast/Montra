export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavingsGoalInput {
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
}
