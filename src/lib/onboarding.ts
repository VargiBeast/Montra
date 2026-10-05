import type { Transaction, TransactionInput } from "../types/transaction";

const COMPLETE_KEY = "montra.onboarding.complete";
const PROMPT_DISMISSED_KEY = "montra.onboarding.accountPromptDismissed";
const GUEST_TX_KEY = "montra.guest.transactions";

export type OnboardingStep = "welcome" | "language" | "currency" | "firstTransaction";

export function isOnboardingComplete(): boolean {
  try {
    return window.localStorage.getItem(COMPLETE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markOnboardingComplete(): void {
  try {
    window.localStorage.setItem(COMPLETE_KEY, "1");
  } catch {
    /* session still works */
  }
}

export function isAccountPromptDismissed(): boolean {
  try {
    return window.localStorage.getItem(PROMPT_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissAccountPrompt(): void {
  try {
    window.localStorage.setItem(PROMPT_DISMISSED_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function readGuestTransactions(): Transaction[] {
  try {
    const raw = window.localStorage.getItem(GUEST_TX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isGuestTransaction);
  } catch {
    return [];
  }
}

function isGuestTransaction(value: unknown): value is Transaction {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    (row.type === "in" || row.type === "out") &&
    typeof row.name === "string" &&
    typeof row.amount === "number" &&
    typeof row.date === "string"
  );
}

export function saveGuestTransaction(input: TransactionInput): Transaction {
  const now = new Date().toISOString();
  const transaction: Transaction = {
    id: `guest-${crypto.randomUUID()}`,
    user_id: "guest",
    type: input.type,
    name: input.name.trim(),
    amount: Math.round(input.amount * 100) / 100,
    date: input.date,
    method: input.method,
    link: input.link,
    note: input.note,
    image_url: null,
    created_at: now,
  };
  const next = [transaction, ...readGuestTransactions()];
  try {
    window.localStorage.setItem(GUEST_TX_KEY, JSON.stringify(next));
  } catch {
    /* in-memory only for this session if storage is blocked */
  }
  markOnboardingComplete();
  return transaction;
}

export function clearGuestTransactions(): void {
  try {
    window.localStorage.removeItem(GUEST_TX_KEY);
  } catch {
    /* ignore */
  }
}

/** Progress steps after welcome: language, currency, first transaction */
export function onboardingProgress(step: OnboardingStep): { current: number; total: number } {
  const order: OnboardingStep[] = ["language", "currency", "firstTransaction"];
  const idx = order.indexOf(step);
  if (idx < 0) return { current: 0, total: order.length };
  return { current: idx + 1, total: order.length };
}
