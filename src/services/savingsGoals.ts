import type { SupabaseClient } from "@supabase/supabase-js";
import type { SavingsGoal, SavingsGoalInput } from "../types/savingsGoal";

const TABLE = "savings_goals";

function normalizeInput(input: SavingsGoalInput): SavingsGoalInput {
  const name = input.name.trim();
  if (!name) throw new Error("Add a name for this goal.");
  if (!Number.isFinite(input.target_amount) || input.target_amount <= 0) {
    throw new Error("Enter a target amount greater than zero.");
  }
  if (!Number.isFinite(input.current_amount) || input.current_amount < 0) {
    throw new Error("Current amount cannot be negative.");
  }
  let deadline: string | null = null;
  if (input.deadline && input.deadline.trim()) {
    const d = input.deadline.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      throw new Error("Choose a valid deadline date.");
    }
    deadline = d;
  }
  return {
    name,
    target_amount: Math.round(input.target_amount * 100) / 100,
    current_amount: Math.round(input.current_amount * 100) / 100,
    deadline,
  };
}

export async function listSavingsGoals(
  client: SupabaseClient,
  userId: string,
): Promise<SavingsGoal[]> {
  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...row,
    target_amount: Number(row.target_amount),
    current_amount: Number(row.current_amount),
  })) as SavingsGoal[];
}

export async function saveSavingsGoal(
  client: SupabaseClient,
  userId: string,
  input: SavingsGoalInput,
  existing?: SavingsGoal,
): Promise<void> {
  const normalized = normalizeInput(input);
  const now = new Date().toISOString();

  if (existing) {
    const { error } = await client
      .from(TABLE)
      .update({
        name: normalized.name,
        target_amount: normalized.target_amount,
        current_amount: normalized.current_amount,
        deadline: normalized.deadline,
        updated_at: now,
      })
      .eq("id", existing.id)
      .eq("user_id", userId);
    if (error) throw error;
    return;
  }

  const { error } = await client.from(TABLE).insert({
    user_id: userId,
    name: normalized.name,
    target_amount: normalized.target_amount,
    current_amount: normalized.current_amount,
    deadline: normalized.deadline,
    wishlist_item_id: null,
    created_at: now,
    updated_at: now,
  });
  if (error) throw error;
}

export async function deleteSavingsGoal(
  client: SupabaseClient,
  userId: string,
  goal: SavingsGoal,
): Promise<void> {
  const { error } = await client
    .from(TABLE)
    .delete()
    .eq("id", goal.id)
    .eq("user_id", userId);
  if (error) throw error;
}
