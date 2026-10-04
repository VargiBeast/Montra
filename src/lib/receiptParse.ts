export interface ParsedReceipt {
  merchant: string;
  totalAmount: number | null;
  currency: string;
  receiptDate: string;
}

const TOTAL_LABEL =
  /\b(total|totalt|sum|bel[øo]p|å\s*betale|a\s*betale|to\s*pay|amount\s*due|grand\s*total|netto)\b/i;
const SKIP_LINE =
  /\b(org\.?\s*nr|mva|vat|subtotal|kontant|visa|mastercard|kort|kvittering|receipt|takk|orgnr)\b/i;
const AMOUNT = /(?:^|[^\d])(\d{1,6}(?:[ .]\d{3})*[.,]\d{2})(?!\d)/;
const CURRENCY = /\b(NOK|SEK|DKK|EUR|USD|GBP|CHF|PLN|CZK|TRY|CAD|AUD|JPY|CNY|INR|KRW)\b|kr\b|€|£|\$/i;

function normalizeAmount(raw: string): number | null {
  const compact = raw.replace(/\s/g, "").replace(/\.(?=\d{3}\b)/g, "");
  const normalized = compact.includes(",") ? compact.replace(/\./g, "").replace(",", ".") : compact;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0 || value > 1_000_000) return null;
  return Math.round(value * 100) / 100;
}

function currencyFrom(text: string, fallback: string): string {
  const match = text.match(CURRENCY);
  if (!match) return fallback;
  const token = match[0].toUpperCase();
  if (token === "KR") return fallback === "SEK" || fallback === "DKK" ? fallback : "NOK";
  if (token === "€") return "EUR";
  if (token === "£") return "GBP";
  if (token === "$") return "USD";
  return token;
}

function toIsoDate(year: number, month: number, day: number): string {
  if (month < 1 || month > 12 || day < 1 || day > 31) return "";
  const iso = `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
  const date = new Date(`${iso}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso) return "";
  const now = new Date();
  if (date.getTime() > now.getTime() + 24 * 60 * 60 * 1000) return "";
  if (year < 2000 || year > now.getUTCFullYear() + 1) return "";
  return iso;
}

function findDate(text: string): string {
  const patterns = [
    /\b(\d{2})[.\/-](\d{2})[.\/-](\d{4})\b/g,
    /\b(\d{4})-(\d{2})-(\d{2})\b/g,
    /\b(\d{2})[.\/-](\d{2})[.\/-](\d{2})\b/g,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      if (match[1].length === 4) {
        const iso = toIsoDate(Number(match[1]), Number(match[2]), Number(match[3]));
        if (iso) return iso;
      } else if (match[3].length === 2) {
        const year = 2000 + Number(match[3]);
        const iso = toIsoDate(year, Number(match[2]), Number(match[1]));
        if (iso) return iso;
      } else {
        const iso = toIsoDate(Number(match[3]), Number(match[2]), Number(match[1]));
        if (iso) return iso;
      }
    }
  }
  return "";
}

function findTotal(lines: string[]): number | null {
  const labeled = lines.filter((line) => TOTAL_LABEL.test(line));
  for (const line of [...labeled].reverse()) {
    const amounts = [...line.matchAll(new RegExp(AMOUNT, "g"))]
      .map((match) => normalizeAmount(match[1]))
      .filter((value): value is number => value != null);
    if (amounts.length) return amounts[amounts.length - 1];
  }
  return null;
}

function findMerchant(lines: string[]): string {
  for (const line of lines.slice(0, 6)) {
    const cleaned = line.replace(/[|*#_]+/g, " ").replace(/\s+/g, " ").trim();
    if (cleaned.length < 2 || cleaned.length > 42) continue;
    if (TOTAL_LABEL.test(cleaned) || SKIP_LINE.test(cleaned)) continue;
    if (/^\d/.test(cleaned) || AMOUNT.test(cleaned)) continue;
    if (!/[A-Za-zÆØÅæøå]{2}/.test(cleaned)) continue;
    return cleaned;
  }
  return "";
}

export function parseReceiptText(text: string, fallbackCurrency = "NOK"): ParsedReceipt {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const currency = currencyFrom(text, fallbackCurrency);
  return {
    merchant: findMerchant(lines),
    totalAmount: findTotal(lines),
    currency: findTotal(lines) == null && !CURRENCY.test(text) ? fallbackCurrency : currency,
    receiptDate: findDate(text),
  };
}
