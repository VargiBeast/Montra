/** i18n — 18 locales; expand dictionaries over time */
export const SUPPORTED_LOCALES = [
  'en', 'nb', 'sv', 'da', 'de', 'fr', 'es', 'it', 'pt', 'nl',
  'fi', 'pl', 'cs', 'tr', 'ar', 'ja', 'ko', 'zh',
] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  nb: 'Norsk (bokmål)',
  sv: 'Svenska',
  da: 'Dansk',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  it: 'Italiano',
  pt: 'Português',
  nl: 'Nederlands',
  fi: 'Suomi',
  pl: 'Polski',
  cs: 'Čeština',
  tr: 'Türkçe',
  ar: 'العربية',
  ja: '日本語',
  ko: '한국어',
  zh: '中文',
};

const dict: Record<string, Record<string, string>> = {
  en: {
    'nav.home': 'Home',
    'nav.activity': 'Activity',
    'nav.receipts': 'Receipts',
    'nav.more': 'More',
    'home.balance': 'Total Balance',
    'home.income': 'Income',
    'home.expenses': 'Expenses',
    'home.plusTeaser.title': 'See where your money goes',
    'home.plusTeaser.body': 'Unlock spending breakdowns, trends and forecasts with Montra Plus.',
    'home.plusTeaser.cta': 'Explore Plus',
    'more.language': 'Language',
  },
  nb: {
    'nav.home': 'Hjem',
    'nav.activity': 'Aktivitet',
    'nav.receipts': 'Kvitteringer',
    'nav.more': 'Mer',
    'home.balance': 'Total saldo',
    'home.income': 'Inntekter',
    'home.expenses': 'Utgifter',
    'home.plusTeaser.title': 'Se hvor pengene går',
    'home.plusTeaser.body': 'Få forbruksfordeling, trender og prognoser med Montra Plus.',
    'home.plusTeaser.cta': 'Utforsk Plus',
    'more.language': 'Språk',
  },
};

export function setLocale(locale: Locale) {
  try {
    localStorage.setItem('montra_locale', locale);
  } catch { /* */ }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale === 'zh' ? 'zh-Hans' : locale;
  }
}

export function getLocale(): Locale {
  try {
    const stored = localStorage.getItem('montra_locale') as Locale | null;
    if (stored && SUPPORTED_LOCALES.includes(stored)) return stored;
  } catch { /* */ }
  return 'en';
}

export function t(key: string): string {
  const locale = getLocale();
  return dict[locale]?.[key] ?? dict.en[key] ?? key;
}
