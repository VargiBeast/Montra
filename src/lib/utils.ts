import type { Transaction } from "../types/transaction";
import { readLanguage } from "./i18n.ts";

/** Format a monetary value that is stored in base currency (NOK). */
export function formatMoney(
  valueInBase: number,
  currency = "NOK",
  locale = readLanguage(),
  convertedValue?: number,
): string {
  const displayValue = convertedValue !== undefined ? convertedValue : valueInBase;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(displayValue);
}

export function formatDate(value: string, locale = readLanguage()): string {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function isValidCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const year = Number(value.slice(0, 4));
  const date = new Date(`${value}T00:00:00.000Z`);
  return year > 0 && !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function getBalanceSummary(transactions: Transaction[]) {
  const totalIn = transactions.reduce(
    (sum, transaction) =>
      transaction.type === "in" ? sum + Number(transaction.amount) : sum,
    0,
  );
  const totalOut = transactions.reduce(
    (sum, transaction) =>
      transaction.type === "out" ? sum + Number(transaction.amount) : sum,
    0,
  );

  return { totalIn, totalOut, balance: totalIn - totalOut };
}

export interface ProductUrlValidation {
  url: string | null;
  error: string | null;
}

export function validateProductUrl(value: string): ProductUrlValidation {
  if (!value.trim()) return { url: null, error: null };
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return { url: null, error: "invalidProductLink" };
    }
    if (url.username || url.password) {
      return { url: null, error: "productLinkNoCredentials" };
    }
    return { url: url.toString(), error: null };
  } catch {
    return { url: null, error: "invalidProductLink" };
  }
}

export function validateImage(file: File): string | null {
  const supportedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!supportedTypes.includes(file.type)) {
    return "invalidImageType";
  }
  if (file.size > 5 * 1024 * 1024) {
    return "imageTooLarge";
  }
  return null;
}

export function isImportableTransaction(
  value: unknown,
): value is Pick<Transaction, "type" | "name" | "amount" | "date"> &
  Partial<Pick<Transaction, "method" | "link" | "note">> {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  if (!(record.type === "in" || record.type === "out")) return false;
  if (typeof record.name !== "string") return false;
  const name = record.name.trim();
  // Reject empty or pathologically long names (untrusted backup input).
  if (name.length < 1 || name.length > 200) return false;
  const amount = Number(record.amount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) return false;
  if (typeof record.date !== "string" || !isValidCalendarDate(record.date)) return false;
  if (record.method != null && (typeof record.method !== "string" || record.method.length > 80)) {
    return false;
  }
  if (record.note != null && (typeof record.note !== "string" || record.note.length > 2000)) {
    return false;
  }
  // link validated separately via validateProductUrl at import time
  return true;
}

/** Safe http(s) href for user-controlled links; null if unsafe. */
export function safeExternalHref(value: string | null | undefined): string | null {
  if (!value) return null;
  return validateProductUrl(value).url;
}
