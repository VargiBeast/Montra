import type { TransactionType } from "./transaction";

export type RecurringInterval = "weekly" | "monthly" | "yearly";

export interface RecurringPayment {
  id: string;
  user_id: string;
  type: TransactionType;
  name: string;
  amount: number;
  interval: RecurringInterval;
  anchor_date: string;
  schedule_day: number | null;
  next_due_date: string;
  note: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecurringPaymentInput {
  type: TransactionType;
  name: string;
  amount: number;
  interval: RecurringInterval;
  anchor_date: string;
  note: string | null;
  active?: boolean;
}

function parseYmd(ymd: string): { y: number; m: number; d: number } {
  const [y, m, d] = ymd.split("-").map(Number);
  return { y, m, d };
}

function toYmd(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function daysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

export function clampDay(y: number, m: number, preferredDay: number): number {
  const max = daysInMonth(y, m);
  return Math.min(Math.max(1, preferredDay), max);
}

function addDays(ymd: string, days: number): string {
  const { y, m, d } = parseYmd(ymd);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return toYmd(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
}

export function computeNextDueDate(opts: {
  interval: RecurringInterval;
  anchor_date: string;
  schedule_day: number | null;
  fromYmd: string;
}): string {
  const from = opts.fromYmd;
  if (opts.interval === "weekly") {
    let cursor = opts.anchor_date;
    let guard = 0;
    while (cursor < from && guard < 5200) {
      cursor = addDays(cursor, 7);
      guard += 1;
    }
    return cursor;
  }

  const preferred = opts.schedule_day ?? parseYmd(opts.anchor_date).d;

  if (opts.interval === "monthly") {
    let { y, m } = parseYmd(opts.anchor_date);
    let guard = 0;
    while (guard < 2400) {
      const day = clampDay(y, m, preferred);
      const candidate = toYmd(y, m, day);
      if (candidate >= from) return candidate;
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
      guard += 1;
    }
    return from;
  }

  let { y } = parseYmd(opts.anchor_date);
  const { m } = parseYmd(opts.anchor_date);
  let guard = 0;
  while (guard < 200) {
    const day = clampDay(y, m, preferred);
    const candidate = toYmd(y, m, day);
    if (candidate >= from) return candidate;
    y += 1;
    guard += 1;
  }
  return from;
}

export function advanceAfterOccurrence(opts: {
  interval: RecurringInterval;
  anchor_date: string;
  schedule_day: number | null;
  occurredOn: string;
}): string {
  const nextDay = addDays(opts.occurredOn, 1);
  return computeNextDueDate({
    interval: opts.interval,
    anchor_date: opts.anchor_date,
    schedule_day: opts.schedule_day,
    fromYmd: nextDay,
  });
}

export function todayYmd(now = new Date()): string {
  return toYmd(now.getFullYear(), now.getMonth() + 1, now.getDate());
}
