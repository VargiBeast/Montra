import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { marketingCopy } from "./marketingCopy";

export type AppLanguage = string;
type CopyLanguage = "en" | "nb" | "sv" | "da" | "de" | "fr" | "es" | "it" | "pt" | "nl" | "fi" | "pl" | "cs" | "tr" | "ar" | "ja" | "ko" | "zh-Hans";

const STORAGE_KEY = "saldo.language";

export const languageOptions = [
  ["en", "English"],
  ["nb", "Norsk"],
  ["sv", "Svenska"],
  ["da", "Dansk"],
  ["de", "Deutsch"],
  ["fr", "Français"],
  ["es", "Español"],
  ["it", "Italiano"],
  ["pt", "Português"],
  ["nl", "Nederlands"],
  ["fi", "Suomi"],
  ["pl", "Polski"],
  ["cs", "Čeština"],
  ["tr", "Türkçe"],
  ["ar", "العربية"],
  ["ja", "日本語"],
  ["ko", "한국어"],
  ["zh-Hans", "简体中文"],
] as const;

export function normalizeLanguage(value: string): AppLanguage | null {
  try {
    return Intl.getCanonicalLocales(value.trim())[0] ?? null;
  } catch {
    return null;
  }
}

const COPY_MAP: Record<string, CopyLanguage> = {
  en: "en", nb: "nb", no: "nb", nn: "nb",
  sv: "sv", da: "da", de: "de", fr: "fr",
  es: "es", it: "it", pt: "pt", nl: "nl",
  fi: "fi", pl: "pl", cs: "cs", tr: "tr",
  ar: "ar", ja: "ja", ko: "ko",
  zh: "zh-Hans", "zh-hans": "zh-Hans", "zh-cn": "zh-Hans", "zh-Hans": "zh-Hans",
};

export function languageForCopy(language: AppLanguage): CopyLanguage {
  const base = language.toLowerCase().split("-")[0];
  return COPY_MAP[base] ?? COPY_MAP[language.toLowerCase()] ?? "en";
}

export function readLanguage(): AppLanguage {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) return normalizeLanguage(saved) ?? "en";
  } catch {
    // Continue with the browser language when storage is blocked.
  }
  const browserLanguages = typeof navigator === "undefined"
    ? []
    : [...(navigator.languages ?? []), navigator.language];
  for (const candidate of browserLanguages) {
    const normalized = normalizeLanguage(candidate);
    if (normalized) return normalized;
  }
  return "en";
}

export function writeLanguage(language: AppLanguage) {
  const normalized = normalizeLanguage(language);
  if (!normalized) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, normalized);
  } catch {
    /* Language still applies for this visit if storage is blocked. */
  }
}

interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  setLanguage: writeLanguage,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(readLanguage);

  const setLanguage = useCallback((next: AppLanguage) => {
    const normalized = normalizeLanguage(next);
    if (!normalized) return;
    writeLanguage(normalized);
    setLanguageState(normalized);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language.startsWith("ar") ? "rtl" : "ltr";
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage]);

  return createElement(LanguageContext.Provider, {
    value,
    children,
  });
}

export function useLanguage() {
  return useContext(LanguageContext);
}

// Login copy – English + Norwegian as primary; others fall back to English
export const loginCopy = {
  en: {
    languageName: "English", languageLabel: "Language",
    storyTitle: "Your money,\nin a softer focus.",
    storyBody: "A personal journal for the things you spend on and the things that come in. Clear enough to understand, human enough to return to.",
    welcome: "Welcome to Montra", welcomeBody: "Sign in to find your money story right where you left it.",
    notConnected: "Montra isn’t connected yet. Add the Supabase connection settings to continue.",
    tryAgain: "Try again", continueGoogle: "Continue with Google", continueEmail: "Continue with Email",
    or: "or", choose: "Choose how you’d like to sign in:", password: "Password", oneTime: "One-time code",
    email: "Email address", emailPlaceholder: "you@example.com", passwordLabel: "Password", passwordPlaceholder: "Your password",
    continue: "Continue", continuing: "Continuing…", sendCode: "Send code", sending: "Sending…", back: "Back",
    createAccount: "Create account", creating: "Creating account…", haveAccount: "Already have a password?",
    signInInstead: "Sign in", needAccount: "New to Montra?", usePassword: "Use a password", useCode: "Use a one-time code",
    codeSent: "Code sent", codeSentBody: "A one-time code and sign-in link are on their way to",
    codeSentHint: "Open the link in this browser, or enter the code from the email.",
    codeLabel: "One-time code", codePlaceholder: "123456", verify: "Verify code", verifying: "Verifying…", resend: "Send a new code",
    accountCreated: "Account created. Check your email to confirm it, then sign in.",
    signedUpReady: "Account created. You’re signed in.",
    legal: "By continuing, you’re signing in to your personal Montra space.",
    enterEmail: "Please enter your email.", invalidEmail: "Invalid email.", enterPassword: "Please enter your password.",
    shortPassword: "Password must be at least 6 characters.", enterCode: "Please enter the code from your email.",
    couldNotSend: "Something went wrong. Please try again.", couldNotSignIn: "Something went wrong. Please try again.",
    forgotTitle: "Forgot password", forgotBody: "Enter your email and we'll send a link to reset your password.",
    forgotSent: "If an account exists for that email, a reset link is on its way.",
    sendResetLink: "Send reset link",
    resetTitle: "Choose a new password", resetBody: "Enter a new password for your Montra account.",
    resetDone: "Password updated. Taking you to your account…",
    confirmPassword: "Confirm password", passwordMismatch: "Passwords do not match.", savePassword: "Save password",
  },
  nb: {
    languageName: "Norsk", languageLabel: "Språk",
    storyTitle: "Pengene dine,\ni et mykere fokus.",
    storyBody: "En personlig journal for det du bruker penger på, og det som kommer inn. Tydelig nok til å forstå, menneskelig nok til å komme tilbake til.",
    welcome: "Velkommen til Montra", welcomeBody: "Logg inn for å finne pengehistorien din der du forlot den.",
    notConnected: "Montra er ikke koblet til ennå. Legg inn Supabase-innstillingene for å fortsette.",
    tryAgain: "Prøv igjen", continueGoogle: "Fortsett med Google", continueEmail: "Fortsett med e-post",
    or: "eller", choose: "Velg hvordan du vil logge inn:", password: "Passord", oneTime: "Engangskode",
    email: "E-postadresse", emailPlaceholder: "deg@example.com", passwordLabel: "Passord", passwordPlaceholder: "Passordet ditt",
    continue: "Fortsett", continuing: "Fortsetter…", sendCode: "Send kode", sending: "Sender…", back: "Tilbake",
    createAccount: "Opprett konto", creating: "Oppretter konto…", haveAccount: "Har du allerede passord?",
    signInInstead: "Logg inn", needAccount: "Ny hos Montra?", usePassword: "Bruk passord", useCode: "Bruk engangskode",
    codeSent: "Kode sendt", codeSentBody: "En engangskode og innloggingslenke er på vei til",
    codeSentHint: "Åpne lenken i denne nettleseren, eller skriv inn koden fra e-posten.",
    codeLabel: "Engangskode", codePlaceholder: "123456", verify: "Bekreft kode", verifying: "Bekrefter…", resend: "Send ny kode",
    accountCreated: "Konto opprettet. Sjekk e-posten for å bekrefte, deretter logg inn.",
    signedUpReady: "Konto opprettet. Du er logget inn.",
    legal: "Ved å fortsette logger du inn i ditt personlige Montra-rom.",
    enterEmail: "Skriv inn e-postadressen din.", invalidEmail: "Ugyldig e-post.", enterPassword: "Skriv inn passordet ditt.",
    shortPassword: "Passordet må være minst 6 tegn.", enterCode: "Skriv inn koden fra e-posten.",
    couldNotSend: "Noe gikk galt. Prøv igjen.", couldNotSignIn: "Noe gikk galt. Prøv igjen.",
  },
} as const;

export function getLoginCopy(language: AppLanguage) {
  const copyLang = languageForCopy(language);
  if (copyLang === "nb") return loginCopy.nb;
  return loginCopy.en;
}

const enUi: Record<string, string> = {
  loadingAccount: "Loading your Montra account",
  loadingTransactions: "Loading your transactions…",
  home: "Home",
  activity: "Activity",
  more: "More",
  addTransaction: "Add transaction",
  openAppearance: "Open appearance settings",
  openProfile: "Open profile",
  mainNavigation: "Main navigation",
  entriesDidNotLoad: "Your entries didn’t load",
  tryAgain: "Try again",
  transactionError: "We couldn’t load your transactions. Check your connection and try again.",
  greetingHome: "Get a clearer picture of everyday money",
  goodToSeeYou: "Good to see you, {name}",
  balanceSummary: "Balance summary",
  yourBalance: "Your balance",
  moneyIn: "Money in",
  moneyOut: "Money out",
  recentTransactions: "Recent transactions",
  viewAll: "View all",
  moneyStoryStarts: "Your money story starts here",
  firstEntryHint: "Add your first purchase or income. Montra keeps the details so patterns are easier to see later.",
  addEntry: "Add entry",
  intentionalSpending: "Spend a little more intentionally.",
  littleAtATime: "A little at a time",
  keepWhatWhenWhy: "Keep what, when and why for each purchase in one personal place.",
  transactionPageGreeting: "All the details in place",
  otherDates: "Other dates",
  searchHistory: "Search history",
  searchTransactions: "Search transactions",
  filterTransactions: "Filter transactions",
  all: "All",
  purchases: "Purchases",
  nothingMatches: "Nothing matches",
  noTransactions: "No transactions yet",
  tryDifferentSearch: "Try a different name, note or payment method.",
  firstEntryWillAppear: "When you add an entry, it will show up here.",
  yourSpace: "Your space, your way",
  language: "Language",
  chooseLanguage: "Choose language",
  languageFallback: "Dates and numbers follow the language you choose.",
  currency: "Currency",
  originalCurrency: "Display currency",
  nameFallback: "there",
  transactionUpdated: "Transaction updated",
  transactionSaved: "Transaction saved",
  deleteConfirm: "Delete this transaction?",
  deleteFailed: "Couldn’t delete that transaction.",
  receiptDeleteConfirm: "Delete this receipt?",
  receiptDeleted: "Receipt deleted",
  receiptDeleteFailed: "Couldn’t delete that receipt.",
  signOutFailed: "Couldn’t sign out. Try again.",
  systemTheme: "System",
  darkTheme: "Dark",
  lightTheme: "Light",
  appearanceSelected: "Appearance set to {appearance}",
  onboardingSignIn: "Sign in",
  onboardingAccountTitle: "Save your progress",
  onboardingAccountBody: "Create an account so your entries stay with you across devices.",
  onboardingAccountCta: "Create account",
  onboardingAccountLater: "Not now",
  receipts: "Receipts",
  receiptsDidNotLoad: "Receipts didn’t load",
  receiptError: "We couldn’t load your receipts. Check your connection and try again.",
  plusTitle: "Montra Plus",
  plusSubtitle: "Deeper insight from the money story you already track.",
  plusValueTitle: "What Plus adds",
  plusFeatureUnderstand: "Understand where money goes",
  plusFeatureUnderstandBody: "Category insights and trends built from your real activity.",
  plusFeaturePlan: "Plan with clearer goals",
  plusFeaturePlanBody: "Richer savings planning and progress projections.",
  plusFeatureForecast: "Look ahead",
  plusFeatureForecastBody: "Month forecast and savings outlook based on recent history.",
  plusFeaturePersonal: "Stays personal",
  plusFeaturePersonalBody: "Theme, language and display currency already adapt to you. Plus keeps expanding personal tools that fit the existing Montra design.",
  plusPricingTitle: "Pricing",
  plusPricingBody: "Start with 7 days free. Then choose monthly or yearly — prices stay clear, no hidden fees.",
  plusTrialBadge: "7 days free",
  plusTrialThen: "Then",
  plusPriceMonthly: "39 NOK",
  plusPriceMonthlyLabel: "per month",
  plusPriceYearly: "329 NOK",
  plusPriceYearlyLabel: "per year",
  plusPriceYearlyNote: "About 30% off",
  plusIncluded: "Included with Plus",
  plusIncluded1: "Advanced analytics & category insights",
  plusIncluded2: "Goal planning & progress projections",
  plusIncluded3: "Month forecast & savings outlook",
  plusIncluded4: "Priority access to new Plus tools",
  plusCtaActive: "You're on Montra Plus",
  plusCtaLocked: "Start 7-day free trial",
  plusCtaNote: "Payments are not enabled yet. When billing ships, this is where the trial and subscription start. Test accounts already unlock Plus features.",
  plusCompareTitle: "Free vs Plus",
  plusCompareFree: "Free",
  plusComparePlus: "Plus",
  plusOpenAnalytics: "Open analytics",
  plusOpenGoals: "Open savings goals",
  plusBack: "Back",
  plusFreeTitle: "What you already have for free",
  plusFree1: "Track income & spending",
  plusFree2: "Receipts with capture",
  plusFree3: "Savings goals & wishlist",
  plusFree4: "Multi-language & display currency",
  ...marketingCopy,
};

const uiCopy: Record<CopyLanguage, Record<string, string>> = {
  en: enUi,
  nb: enUi,
  sv: enUi,
  da: enUi,
  de: enUi,
  fr: enUi,
  es: enUi,
  it: enUi,
  pt: enUi,
  nl: enUi,
  fi: enUi,
  pl: enUi,
  cs: enUi,
  tr: enUi,
  ar: enUi,
  ja: enUi,
  ko: enUi,
  "zh-Hans": enUi,
};

export function translate(
  key: string,
  language: AppLanguage,
  values: Record<string, string | number> = {},
): string {
  const copyLang = languageForCopy(language);
  const localized = uiCopy[copyLang]?.[key];
  const english = uiCopy.en[key];
  const text = (localized && localized !== key ? localized : undefined)
    ?? (english && english !== key ? english : undefined)
    ?? "\u2014";
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.hasOwn(values, name) ? String(values[name]) : match,
  );
}

export function useTranslation() {
  const { language } = useLanguage();
  return useCallback(
    (key: string, values?: Record<string, string | number>) => translate(key, language, values),
    [language],
  );
}
