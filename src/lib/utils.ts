export function isValidCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function validateImage(file: File): string | null {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.type)) return 'Unsupported image format.';
  if (file.size > 8 * 1024 * 1024) return 'Image must be under 8 MB.';
  return null;
}

export function validateProductUrl(url: string): { url: string | null; error: string | null } {
  const trimmed = url.trim();
  if (!trimmed) return { url: null, error: null };
  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { url: null, error: 'Link must start with http or https.' };
    }
    return { url: parsed.toString(), error: null };
  } catch {
    return { url: null, error: 'Enter a valid URL.' };
  }
}

export function formatMoney(amount: number, currency = 'NOK', locale = 'nb-NO'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
