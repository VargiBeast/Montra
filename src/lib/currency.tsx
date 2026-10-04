import { createContext, createElement, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { normalizeDisplayCurrency, type DisplayCurrency } from "./preferences";

interface CurrencyContextValue {
  currency: DisplayCurrency;
  setCurrency: (currency: DisplayCurrency) => void;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "NOK",
  setCurrency: () => undefined,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<DisplayCurrency>("NOK");

  const setCurrency = useCallback((next: DisplayCurrency) => {
    setCurrencyState(normalizeDisplayCurrency(next));
  }, []);
  const value = useMemo(() => ({ currency, setCurrency }), [currency, setCurrency]);

  return createElement(CurrencyContext.Provider, {
    value,
    children,
  });
}

export function useDisplayCurrency() {
  return useContext(CurrencyContext);
}
