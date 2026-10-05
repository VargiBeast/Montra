/* Emergency restore: minimal i18n with planning + critical keys until full tables restored from commit 7e12eda. */
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
    // storage blocked
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
    /* session still works */
  }
}

import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

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

const PLANNING: Record<CopyLanguage, string> = {
  en: "Planning",
  nb: "Planlegging",
  sv: "Planering",
  da: "Planlægning",
  de: "Planung",
  fr: "Planification",
  es: "Planificación",
  it: "Pianificazione",
  pt: "Planeamento",
  nl: "Planning",
  fi: "Suunnittelu",
  pl: "Planowanie",
  cs: "Plánování",
  tr: "Planlama",
  ar: "التخطيط",
  ja: "計画",
  ko: "계획",
  "zh-Hans": "规划",
};

const enUi: Record<string, string> = {
  planning: "Planning",
  savingsGoals: "Savings goals",
  savingsGoalsHint: "Track progress toward a target",
  wishlist: "Wishlist",
  wishlistHint: "Save products you want",
  home: "Home",
  activity: "Activity",
  more: "More",
  receipts: "Receipts",
  currentBalance: "Current balance",
  moneyIn: "Money in",
  moneyOut: "Money out",
  recentActivity: "Recent activity",
  viewAll: "View all",
  hello: "Hello",
  homeTitle: "Home",
  loadingAccount: "Loading your Montra account",
  loadingTransactions: "Loading your transactions…",
  mainNavigation: "Main navigation",
  addTransaction: "Add transaction",
};

const tables: Record<CopyLanguage, Record<string, string>> = {
  en: enUi,
  nb: { ...enUi, planning: "Planlegging", savingsGoals: "Sparemål", savingsGoalsHint: "Følg fremgang mot et mål", wishlist: "Ønskeliste", home: "Hjem", activity: "Aktivitet", more: "Mer", receipts: "Kvitteringer", currentBalance: "Saldo nå", moneyIn: "Penger inn", moneyOut: "Penger ut", recentActivity: "Siste aktivitet", viewAll: "Vis alle", hello: "Hei", homeTitle: "Hjem" },
  sv: { ...enUi, planning: PLANNING.sv },
  da: { ...enUi, planning: PLANNING.da },
  de: { ...enUi, planning: PLANNING.de },
  fr: { ...enUi, planning: PLANNING.fr },
  es: { ...enUi, planning: PLANNING.es },
  it: { ...enUi, planning: PLANNING.it },
  pt: { ...enUi, planning: PLANNING.pt },
  nl: { ...enUi, planning: PLANNING.nl },
  fi: { ...enUi, planning: PLANNING.fi },
  pl: { ...enUi, planning: PLANNING.pl },
  cs: { ...enUi, planning: PLANNING.cs },
  tr: { ...enUi, planning: PLANNING.tr },
  ar: { ...enUi, planning: PLANNING.ar },
  ja: { ...enUi, planning: PLANNING.ja },
  ko: { ...enUi, planning: PLANNING.ko },
  "zh-Hans": { ...enUi, planning: PLANNING["zh-Hans"] },
};

function translate(key: string, language: AppLanguage, values?: Record<string, string | number>): string {
  const lang = languageForCopy(language);
  let text = tables[lang]?.[key] ?? tables.en[key] ?? "\u2014";
  if (values) {
    for (const [k, v] of Object.entries(values)) {
      text = text.replaceAll(`{${k}}`, String(v));
    }
  }
  return text;
}

export function useTranslation() {
  const { language } = useLanguage();
  return useCallback(
    (key: string, values?: Record<string, string | number>) => translate(key, language, values),
    [language],
  );
}

export const loginCopy = {
  en: {
    languageName: "English", languageLabel: "Language",
    storyTitle: "Your money,\nin a softer focus.",
    storyBody: "A personal journal for the things you spend on and the things that come in.",
    welcome: "Welcome to Montra", welcomeBody: "Sign in to find your money story right where you left it.",
    notConnected: "Montra is not connected yet.",
    tryAgain: "Try again", continueGoogle: "Continue with Google", continueEmail: "Continue with Email",
    or: "or", choose: "Choose how you would like to sign in:", password: "Password", oneTime: "One-time code",
    email: "Email address", emailPlaceholder: "you@example.com", passwordLabel: "Password", passwordPlaceholder: "Your password",
    continue: "Continue", continuing: "Continuing…", sendCode: "Send code", sending: "Sending…", back: "Back",
    createAccount: "Create account", creating: "Creating account…", haveAccount: "Already have a password?",
    signInInstead: "Sign in", needAccount: "New to Montra?", usePassword: "Use a password", useCode: "Use a one-time code",
    codeSent: "Code sent", codeSentBody: "A one-time code and sign-in link are on their way to",
    codeSentHint: "Open the link in this browser, or enter the code from the email.",
    codeLabel: "One-time code", codePlaceholder: "123456", verify: "Verify code", verifying: "Verifying…", resend: "Send a new code",
    accountCreated: "Account created. Check your email to confirm it, then sign in.",
    signedUpReady: "Account created. You are signed in.",
    legal: "By continuing, you are signing in to your personal Montra space.",
    enterEmail: "Please enter your email.", invalidEmail: "Invalid email.", enterPassword: "Please enter your password.",
    shortPassword: "Password must be at least 6 characters.", enterCode: "Please enter the code from your email.",
    couldNotSend: "Something went wrong. Please try again.", couldNotSignIn: "Something went wrong. Please try again.",
  },
  nb: {
    languageName: "Norsk", languageLabel: "Språk",
    storyTitle: "Pengene dine,\ni et mykere fokus.",
    storyBody: "En personlig journal for det du bruker penger på, og det som kommer inn.",
    welcome: "Velkommen til Montra", welcomeBody: "Logg inn for å finne pengehistorien din der du forlot den.",
    notConnected: "Montra er ikke koblet til ennå.",
    tryAgain: "Prøv igjen", continueGoogle: "Fortsett med Google", continueEmail: "Fortsett med e-post",
    or: "eller", choose: "Velg hvordan du vil logge inn:", password: "Passord", oneTime: "Engangskode",
    email: "E-postadresse", emailPlaceholder: "deg@example.com", passwordLabel: "Passord", passwordPlaceholder: "Passordet ditt",
    continue: "Fortsett", continuing: "Fortsetter…", sendCode: "Send kode", sending: "Sender…", back: "Tilbake",
    createAccount: "Opprett konto", creating: "Oppretter konto…", haveAccount: "Har du allerede passord?",
    signInInstead: "Logg inn", needAccount: "Ny i Montra?", usePassword: "Bruk passord", useCode: "Bruk engangskode",
    codeSent: "Kode sendt", codeSentBody: "En engangskode og innloggingslenke er på vei til",
    codeSentHint: "Åpne lenken i denne nettleseren, eller skriv inn koden fra e-posten.",
    codeLabel: "Engangskode", codePlaceholder: "123456", verify: "Bekreft kode", verifying: "Bekrefter…", resend: "Send ny kode",
    accountCreated: "Konto opprettet. Sjekk e-posten for å bekrefte den, og logg deretter inn.",
    signedUpReady: "Konto opprettet. Du er logget inn.",
    legal: "Ved å fortsette logger du inn i ditt personlige Montra-område.",
    enterEmail: "Skriv inn e-postadressen din.", invalidEmail: "Ugyldig e-post.", enterPassword: "Skriv inn passordet ditt.",
    shortPassword: "Passordet må ha minst 6 tegn.", enterCode: "Skriv inn koden fra e-posten.",
    couldNotSend: "Noe gikk galt. Prøv igjen.", couldNotSignIn: "Noe gikk galt. Prøv igjen.",
  },
} as const;

export function getLoginCopy(language: AppLanguage) {
  const key = languageForCopy(language);
  return loginCopy[key === "nb" ? "nb" : "en"];
}
