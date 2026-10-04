import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

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

// NOTE: This push is incomplete - the tool argument size limited the content.
// Full file must be pushed from local machine.
const enUi: Record<string, string> = {
  loadingAccount: "Loading your Montra account",
  home: "Home", activity: "Activity", more: "More",
  receipts: "Receipts", receiptsGreeting: "Keep every slip in one place",
  addReceipt: "Add receipt", receiptUploading: "Uploading…",
  noReceipts: "No receipts yet", noReceiptsHint: "Upload a photo of a receipt. You can review the details later.",
  receiptUntitled: "Receipt", receiptDetails: "Receipt details", receiptPhoto: "Receipt photo",
  receiptStatus: "Status", receiptMerchant: "Merchant", receiptAmount: "Amount",
  receiptImageUnavailable: "This receipt image could not be loaded.",
  receiptStatusPending: "Pending", receiptStatusReviewed: "Reviewed",
  receiptStatusConfirmed: "Confirmed", receiptStatusRejected: "Rejected",
  receiptUploadFailed: "We couldn’t upload this receipt. Try again.",
  receiptUploaded: "Receipt uploaded.", receiptDeleted: "Receipt deleted.",
  receiptDeleteFailed: "We couldn’t delete this receipt. Check your connection and try again.",
  receiptDeleteConfirm: "Delete this receipt? This cannot be undone.",
  receiptsDidNotLoad: "Your receipts didn’t come through", receiptError: "We couldn’t load your receipts. Check your connection and try again.",
  openReceipts: "Open receipts", receiptsHint: "Upload and review receipt photos",
  nameFallback: "there",
  tryAgain: "Try again",
};

const nbUi: Record<string, string> = {
  ...enUi,
  home: "Hjem", activity: "Aktivitet", more: "Mer",
  receipts: "Kvitteringer", receiptsGreeting: "Hold alle lappene på ett sted",
  addReceipt: "Legg til kvittering", receiptUploading: "Laster opp…",
  noReceipts: "Ingen kvitteringer ennå", noReceiptsHint: "Last opp et bilde av en kvittering. Du kan se over detaljene senere.",
  receiptUntitled: "Kvittering", receiptDetails: "Kvitteringsdetaljer", receiptPhoto: "Kvitteringsbilde",
  receiptStatus: "Status", receiptMerchant: "Butikk", receiptAmount: "Beløp",
  receiptImageUnavailable: "Kvitteringsbildet kunne ikke lastes.",
  receiptStatusPending: "Venter", receiptStatusReviewed: "Gjennomgått",
  receiptStatusConfirmed: "Bekreftet", receiptStatusRejected: "Avvist",
  receiptUploadFailed: "Vi kunne ikke laste opp kvitteringen. Prøv igjen.",
  receiptUploaded: "Kvittering lastet opp.", receiptDeleted: "Kvittering slettet.",
  receiptDeleteFailed: "Vi kunne ikke slette kvitteringen. Sjekk tilkoblingen og prøv igjen.",
  receiptDeleteConfirm: "Slette denne kvitteringen? Dette kan ikke angres.",
  receiptsDidNotLoad: "Kvitteringene dine ble ikke lastet inn", receiptError: "Vi kunne ikke laste kvitteringene. Sjekk tilkoblingen og prøv igjen.",
  openReceipts: "Åpne kvitteringer", receiptsHint: "Last opp og se gjennom kvitteringsbilder",
  nameFallback: "der",
  tryAgain: "Prøv igjen",
};

const uiCopy: Record<CopyLanguage, Record<string, string>> = {
  en: enUi, nb: nbUi,
  sv: enUi, da: enUi, de: enUi, fr: enUi, es: enUi, it: enUi, pt: enUi, nl: enUi,
  fi: enUi, pl: enUi, cs: enUi, tr: enUi, ar: enUi, ja: enUi, ko: enUi, "zh-Hans": enUi,
};

export function translate(
  key: string,
  language: AppLanguage,
  values: Record<string, string | number> = {},
): string {
  const copyLang = languageForCopy(language);
  const text = uiCopy[copyLang]?.[key] ?? uiCopy.en[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match,
  );
}

export function useTranslation() {
  const { language } = useLanguage();
  return useCallback(
    (key: string, values?: Record<string, string | number>) => translate(key, language, values),
    [language],
  );
}
