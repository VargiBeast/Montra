import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  RecurringPayment,
  RecurringPaymentInput,
  RecurringInterval,
} from "../types/recurringPayment";
import { computeNextDueDate, todayYmd } from "../types/recurringPayment";
import { isValidCalendarDate } from "../lib/utils";

const TABLE = "recurring_payments";

function toError(reason: unknown, fallback: string): Error {
  if (reason instanceof Error && reason.message.trim()) return reason;
  return new Error(fallback);
}

function mapRow(row: Record<string, unknown>): RecurringPayment {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    type: row.type === "in" ? "in" : "out",
    name: String(row.name),
    amount: Number(row.amount),
    interval: row.interval as RecurringInterval,
    anchor_date: String(row.anchor_date).slice(0, 10),
    schedule_day: row.schedule_day == null ? null : Number(row.schedule_day),
    next_due_date: String(row.next_due_date).slice(0, 10),
    note: row.note == null ? null : String(row.note),
    active: Boolean(row.active),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function normalizeRecurringInput(input: RecurringPaymentInput): {
  type: "in" | "out";
  name: string;
  amount: number;
  interval: RecurringInterval;
  anchor_date: string;
  schedule_day: number | null;
  next_due_date: string;
  note: string | null;
  active: boolean;
} {
  const name = input.name.trim();
  if (!name) throw new Error("recurringNameRequired");
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("recurringAmountInvalid");
  }
  if (!["weekly", "monthly", "yearly"].includes(input.interval)) {
    throw new Error("recurringIntervalInvalid");
  }
  if (!isValidCalendarDate(input.anchor_date)) {
    throw new Error("recurringDateInvalid");
  }
  const schedule_day =
    input.interval === "weekly" ? null : Number(input.anchor_date.slice(8, 10));
  const next_due_date = computeNextDueDate({
    interval: input.interval,
    anchor_date: input.anchor_date,
    schedule_day,
    fromYmd: todayYmd(),
  });
  return {
    type: input.type === "in" ? "in" : "out",
    name,
    amount: Math.round(input.amount * 100) / 100,
    interval: input.interval,
    anchor_date: input.anchor_date,
    schedule_day,
    next_due_date,
    note: input.note?.trim() || null,
    active: input.active !== false,
  };
}

export async function listRecurringPayments(
  client: SupabaseClient,
  userId: string,
): Promise<RecurringPayment[]> {
  const { data, error } = await client
    .from(TABLE)
    .select(
      "id, user_id, type, name, amount, interval, anchor_date, schedule_day, next_due_date, note, active, created_at, updated_at",
    )
    .eq("user_id", userId)
    .order("next_due_date", { ascending: true });
  if (error) throw toError(error, "Could not load recurring payments.");
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function saveRecurringPayment(
  client: SupabaseClient,
  userId: string,
  input: RecurringPaymentInput,
  existing?: RecurringPayment,
): Promise<void> {
  const n = normalizeRecurringInput(input);
  const now = new Date().toISOString();
  if (existing) {
    const { error } = await client
      .from(TABLE)
      .update({
        type: n.type,
        name: n.name,
        amount: n.amount,
        interval: n.interval,
        anchor_date: n.anchor_date,
        schedule_day: n.schedule_day,
        next_due_date: n.next_due_date,
        note: n.note,
        active: n.active,
        updated_at: now,
      })
      .eq("id", existing.id)
      .eq("user_id", userId);
    if (error) throw toError(error, "Could not save recurring payment.");
    return;
  }
  const { error } = await client.from(TABLE).insert({
    user_id: userId,
    type: n.type,
    name: n.name,
    amount: n.amount,
    interval: n.interval,
    anchor_date: n.anchor_date,
    schedule_day: n.schedule_day,
    next_due_date: n.next_due_date,
    note: n.note,
    active: n.active,
    created_at: now,
    updated_at: now,
  });
  if (error) throw toError(error, "Could not save recurring payment.");
}

export async function setRecurringActive(
  client: SupabaseClient,
  userId: string,
  item: RecurringPayment,
  active: boolean,
): Promise<void> {
  const { error } = await client
    .from(TABLE)
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", item.id)
    .eq("user_id", userId);
  if (error) throw toError(error, "Could not update recurring payment.");
}

export async function deleteRecurringPayment(
  client: SupabaseClient,
  userId: string,
  item: RecurringPayment,
): Promise<void> {
  const { error } = await client
    .from(TABLE)
    .delete()
    .eq("id", item.id)
    .eq("user_id", userId);
  if (error) throw toError(error, "Could not delete recurring payment.");
}
