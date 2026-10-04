import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { normalizeDisplayCurrency, type DisplayCurrency } from "./preferences";

const RATES_STORAGE_KEY = "montra.exchangeRates";
const CURRENCY_STORAGE_KEY = "montra.displayCurrency";
const RATES_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const BASE_CURRENCY = "NOK";

// Fallback rates relative to 1 NOK (approximate, updated when API succeeds)
const FALLBACK_RATES: Record<string, number> = {
  NOK: 1,
  USD: 0.1036,
  EUR: 0.0923,
  GBP: 0.0785,
  SEK: 1.0423,
  DKK: 0.69,
  CHF: 0.0857,
  JPY: 16.34,
  CNY: 0.6948,
  PLN: 0.4042,
  CZK: 2.259,
  TRY: 5.093,
  CAD: 0.142,
  AUD: 0.156,
  INR: 8.65,
  KRW: 139.73,
};

interface RatesCache {
  rates: Record<string, number>;
  fetchedAt: number;
  base: string;
}

interface CurrencyContextValue {
  currency: DisplayCurrency;
  setCurrency: (currency: DisplayCurrency) => void;
  rates: Record<string, number>;
  ratesReady: boolean;
  /** Convert an amount stored in NOK to the given display currency. */
  convertFromBase: (amountInBase: number, toCurrency?: string) => number;
  /** Convert an amount in the given currency back to NOK for storage. */
  convertToBase: (amount: number, fromCurrency: string) => number;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "NOK",
  setCurrency: () => undefined,
  rates: FALLBACK_RATES,
  ratesReady: false,
  convertFromBase: (amount) => amount,
  convertToBase: (amount) => amount,
});

function loadCachedRates(): RatesCache | null {
  try {
    const raw = window.localStorage.getItem(RATES_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RatesCache;
    if (!parsed?.rates || typeof parsed.fetchedAt !== "number") return null;
    if (Date.now() - parsed.fetchedAt > RATES_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveCachedRates(cache: RatesCache) {
  try {
    window.localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify(cache));
  } catch {
    /* ignore */
  }
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<DisplayCurrency>(() => {
    try {
      const saved = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
      if (saved) return normalizeDisplayCurrency(saved);
    } catch { /* ignore */ }
    return "NOK";
  });
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);
  const [ratesReady, setRatesReady] = useState(false);

  useEffect(() => {
    const cached = loadCachedRates();
    if (cached) {
      setRates({ ...FALLBACK_RATES, ...cached.rates, NOK: 1 });
      setRatesReady(true);
    }

    let cancelled = false;
    async function fetchRates() {
      try {
        const res = await fetch("https://api.frankfurter.app/latest?from=NOK");
        if (!res.ok) throw new Error("rates fetch failed");
        const data = (await res.json()) as { rates?: Record<string, number> };
        if (cancelled || !data.rates) return;
        const next = { ...FALLBACK_RATES, ...data.rates, NOK: 1 };
        setRates(next);
        setRatesReady(true);
        saveCachedRates({ rates: next, fetchedAt: Date.now(), base: BASE_CURRENCY });
      } catch (err) {
        console.warn("Montra could not refresh exchange rates.", err);
        if (!cached) setRatesReady(true); // use fallback
      }
    }
    void fetchRates();
    return () => {
      cancelled = true;
    };
  }, []);

  const setCurrency = useCallback((next: DisplayCurrency) => {
    const normalized = normalizeDisplayCurrency(next);
    setCurrencyState(normalized);
    try {
      window.localStorage.setItem(CURRENCY_STORAGE_KEY, normalized);
    } catch { /* still applies for this session */ }
  }, []);

  const convertFromBase = useCallback(
    (amountInBase: number, toCurrency: string = currency) => {
      if (!Number.isFinite(amountInBase)) return 0;
      const rate = rates[toCurrency] ?? FALLBACK_RATES[toCurrency] ?? 1;
      return amountInBase * rate;
    },
    [currency, rates],
  );

  const convertToBase = useCallback(
    (amount: number, fromCurrency: string) => {
      if (!Number.isFinite(amount)) return 0;
      const rate = rates[fromCurrency] ?? FALLBACK_RATES[fromCurrency] ?? 1;
      if (rate === 0) return amount;
      return amount / rate;
    },
    [rates],
  );

  const value = useMemo(
    () => ({ currency, setCurrency, rates, ratesReady, convertFromBase, convertToBase }),
    [currency, setCurrency, rates, ratesReady, convertFromBase, convertToBase],
  );

  return createElement(CurrencyContext.Provider, {
    value,
    children,
  });
}

export function useDisplayCurrency() {
  return useContext(CurrencyContext);
}
