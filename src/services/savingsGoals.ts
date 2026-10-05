import type { SupabaseClient } from "@supabase/supabase-js";
import type { SavingsGoal, SavingsGoalInput } from "../types/savingsGoal";

const TABLE = "savings_goals";

/** Build a clear Error from Supabase/Postgrest or unknown failures (for UI + console). */
export function toSavingsGoalError(reason: unknown, fallback: string): Error {
  if (reason instanceof Error && reason.message.trim()) {
    const anyErr = reason as Error & { code?: string; details?: string; hint?: string };
    if (import.meta.env.DEV) {
      console.error("[savings_goals]", {
        message: anyErr.message,
        code: anyErr.code,
        details: anyErr.details,
        hint: anyErr.hint,
        name: anyErr.name,
      });
    }
    return reason;
  }

  if (reason && typeof reason === "object") {
    const obj = reason as {
      message?: unknown;
      code?: unknown;
      details?: unknown;
      hint?: unknown;
      error_description?: unknown;
    };
    const message = typeof obj.message === "string" && obj.message.trim()
      ? obj.message
      : typeof obj.error_description === "string" && obj.error_description.trim()
        ? obj.error_description
        : fallback;
    if (import.meta.env.DEV) {
      console.error("[savings_goals]", {
        message,
        code: obj.code,
        details: obj.details,
        hint: obj.hint,
        raw: reason,
      });
    }
    const err = new Error(message);
    if (typeof obj.code === "string") (err as Error & { code?: string }).code = obj.code;
    if (typeof obj.details === "string") (err as Error & { details?: string }).details = obj.details;
    if (typeof obj.hint === "string") (err as Error & { hint?: string }).hint = obj.hint;
    return err;
  }

  if (import.meta.env.DEV) {
    console.error("[savings_goals]", reason);
  }
  return new Error(fallback);
}

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
  if (error) throw toSavingsGoalError(error, "Could not load savings goals.");
  return (data ?? []).map((row) => ({
    ...row,
    target_amount: Number(row.target_amount),
    current_amount: Number(row.current_amount),
    wishlist_item_id: row.wishlist_item_id ?? null,
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
    if (error) throw toSavingsGoalError(error, "Could not save goal.");
    return;
  }

  // Live table columns: id, user_id, name, target_amount, current_amount,
  // deadline, created_at, updated_at — do not send wishlist_item_id.
  const { error } = await client.from(TABLE).insert({
    user_id: userId,
    name: normalized.name,
    target_amount: normalized.target_amount,
    current_amount: normalized.current_amount,
    deadline: normalized.deadline,
    created_at: now,
    updated_at: now,
  });
  if (error) throw toSavingsGoalError(error, "Could not save goal.");
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
  if (error) throw toSavingsGoalError(error, "Could not delete goal.");
}
