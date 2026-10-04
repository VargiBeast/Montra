import type { Transaction } from "../types/transaction";
import { readLanguage } from "./i18n";

/** Format a monetary value that is stored in base currency (NOK). */
export function formatMoney(
  valueInBase: number,
  currency = "NOK",
  locale = readLanguage(),
  convertFn?: (amount: number, to?: string) => number,
): string {
  const displayValue = convertFn ? convertFn(valueInBase, currency) : valueInBase;
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
      return { url: null, error: "Enter a product link that starts with http:// or https://." };
    }
    if (url.username || url.password) {
      return { url: null, error: "Remove sign-in details from the product link." };
    }
    return { url: url.toString(), error: null };
  } catch {
    return { url: null, error: "Enter a valid product link that starts with http:// or https://." };
  }
}

export function validateImage(file: File): string | null {
  const supportedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!supportedTypes.includes(file.type)) {
    return "Choose a JPEG, PNG, WebP, or GIF image.";
  }
  if (file.size > 5 * 1024 * 1024) {
    return "Images must be 5 MB or smaller.";
  }
  return null;
}

export function isImportableTransaction(
  value: unknown,
): value is Pick<Transaction, "type" | "name" | "amount" | "date"> &
  Partial<Pick<Transaction, "method" | "link" | "note">> {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    (record.type === "in" || record.type === "out") &&
    typeof record.name === "string" &&
    record.name.trim().length > 0 &&
    Number.isFinite(Number(record.amount)) &&
    Number(record.amount) > 0 &&
    typeof record.date === "string" &&
    isValidCalendarDate(record.date)
  );
}
