/** NOK base currency + Frankfurter exchange rates */
const CACHE_KEY = 'montra_rates';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6h

interface RatesCache {
  base: string;
  rates: Record<string, number>;
  fetchedAt: number;
}

let memoryCache: RatesCache | null = null;

export async function fetchRates(): Promise<RatesCache> {
  if (memoryCache && Date.now() - memoryCache.fetchedAt < CACHE_TTL) {
    return memoryCache;
  }
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as RatesCache;
      if (Date.now() - parsed.fetchedAt < CACHE_TTL) {
        memoryCache = parsed;
        return parsed;
      }
    }
  } catch { /* ignore */ }

  const res = await fetch('https://api.frankfurter.app/latest?from=NOK');
  if (!res.ok) throw new Error('Exchange rates unavailable');
  const data = await res.json();
  const cache: RatesCache = {
    base: 'NOK',
    rates: { NOK: 1, ...data.rates },
    fetchedAt: Date.now(),
  };
  memoryCache = cache;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch { /* ignore */ }
  return cache;
}

export function convertFromNok(amountNok: number, target: string, rates: Record<string, number>): number {
  if (target === 'NOK') return amountNok;
  const rate = rates[target];
  if (!rate) return amountNok;
  return Math.round(amountNok * rate * 100) / 100;
}

export const SUPPORTED_CURRENCIES = [
  'NOK', 'EUR', 'USD', 'SEK', 'DKK', 'GBP', 'CHF', 'JPY', 'CNY', 'PLN', 'CZK', 'TRY',
] as const;

export type DisplayCurrency = (typeof SUPPORTED_CURRENCIES)[number];
