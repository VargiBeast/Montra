import { useCallback, useEffect, useState } from 'react';
import { fetchRates, convertFromNok, type DisplayCurrency } from '@/lib/currency';
import { formatMoney } from '@/lib/utils';

const PREF_KEY = 'montra_display_currency';

export function useDisplayCurrency() {
  const [currency, setCurrencyState] = useState<DisplayCurrency>(() => {
    try {
      return (localStorage.getItem(PREF_KEY) as DisplayCurrency) || 'NOK';
    } catch {
      return 'NOK';
    }
  });
  const [rates, setRates] = useState<Record<string, number>>({ NOK: 1 });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetchRates()
      .then((c) => {
        setRates(c.rates);
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);

  const setCurrency = useCallback((c: DisplayCurrency) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(PREF_KEY, c);
    } catch { /* ignore */ }
  }, []);

  const format = useCallback(
    (amountNok: number) => {
      const converted = convertFromNok(amountNok, currency, rates);
      return formatMoney(converted, currency);
    },
    [currency, rates],
  );

  return { currency, setCurrency, format, rates, ready };
}
