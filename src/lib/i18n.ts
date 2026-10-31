/** Minimal i18n scaffold – 18 locales reserved. Expand with full dictionaries. */
export const SUPPORTED_LOCALES = [
  'en', 'nb', 'sv', 'da', 'de', 'fr', 'es', 'it', 'pt', 'nl',
  'fi', 'pl', 'cs', 'tr', 'ar', 'ja', 'ko', 'zh',
] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

const dict: Record<string, Record<string, string>> = {
  en: {
    'nav.home': 'Home',
    'nav.activity': 'Activity',
    'nav.receipts': 'Receipts',
    'nav.more': 'More',
    'home.balance': 'Total Balance',
    'home.income': 'Income',
    'home.expenses': 'Expenses',
    'tx.save': 'Save transaction',
    'tx.expense': 'Expense',
    'tx.income': 'Income',
  },
  nb: {
    'nav.home': 'Hjem',
    'nav.activity': 'Aktivitet',
    'nav.receipts': 'Kvitteringer',
    'nav.more': 'Mer',
    'home.balance': 'Total saldo',
    'home.income': 'Inntekter',
    'home.expenses': 'Utgifter',
    'tx.save': 'Lagre transaksjon',
    'tx.expense': 'Utgift',
    'tx.income': 'Inntekt',
  },
};

let current: Locale = 'en';

export function setLocale(locale: Locale) {
  current = locale;
  try { localStorage.setItem('montra_locale', locale); } catch { /* */ }
}

export function getLocale(): Locale {
  try {
    const stored = localStorage.getItem('montra_locale') as Locale | null;
    if (stored && SUPPORTED_LOCALES.includes(stored)) return stored;
  } catch { /* */ }
  return current;
}

export function t(key: string): string {
  const locale = getLocale();
  return dict[locale]?.[key] ?? dict.en[key] ?? key;
}
