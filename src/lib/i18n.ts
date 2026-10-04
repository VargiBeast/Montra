import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type AppLanguage = string;
type CopyLanguage = "en" | "nb" | "sv" | "da" | "de" | "fr" | "es" | "it" | "pt" | "nl";

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

const enUi: Record<string, string> = {
  loadingAccount: "Loading your Montra account",
  loadingTransactions: "Loading your transactions…",
  home: "Home", activity: "Activity", more: "More",
  addTransaction: "Add transaction", openAppearance: "Open appearance settings", openProfile: "Open profile",
  mainNavigation: "Main navigation",
  entriesDidNotLoad: "Your entries didn’t come through", tryAgain: "Try again",
  transactionError: "We couldn’t load your transactions. Check your connection and try again.",
  greetingHome: "A clearer view of your everyday", goodToSeeYou: "Good to see you, {name}",
  balanceSummary: "Balance summary", yourBalance: "Your balance", moneyIn: "Money in", moneyOut: "Money out",
  recentTransactions: "Recent transactions", viewAll: "View all",
  moneyStoryStarts: "Your money story starts here",
  firstEntryHint: "Add your first purchase or money-in entry. Montra will keep the details together, so patterns are easier to see later.",
  addEntry: "Add an entry", intentionalSpending: "Make spending feel more intentional.",
  littleAtATime: "A little at a time", keepWhatWhenWhy: "Keep the what, when, and why of each purchase in one personal place.",
  transactionPageGreeting: "Every detail, in its place", otherDates: "Other dates",
  searchHistory: "Search your history", searchTransactions: "Search transactions", filterTransactions: "Filter transactions",
  all: "All", purchases: "Purchases", nothingMatches: "Nothing matches that search", noTransactions: "No transactions yet",
  tryDifferentSearch: "Try a different name, note, or payment method.", firstEntryWillAppear: "When you add an entry, it will find a home here.",
  yourSpace: "Your space, your way", language: "Language", chooseLanguage: "Choose your language",
  languageFallback: "Dates and numbers follow the language you choose.",
  currency: "Currency", originalCurrency: "Display currency",
  currencySafety: "Amounts are stored in NOK and converted using live exchange rates when you switch currency.",
  appearance: "Appearance", appearanceHint: "Choose the light that feels right",
  light: "Light", dark: "Dark", system: "System",
  exportBackup: "Export backup", saveCopy: "Save a copy of your transaction details",
  importBackup: "Import backup", restoreCopy: "Restore transaction details from JSON", importingBackup: "Importing backup…",
  profile: "Profile", accountDetails: "Account details and sign out",
  signOut: "Sign out", signingOut: "Signing out…", signOutMontra: "Sign out of your Montra account",
  localeCode: "Language or locale code", yourPersonalAccount: "Your personal account", back: "Back",
  yourMontraAccount: "Your Montra account", emailUnavailable: "Email unavailable", signInMethod: "Sign-in method",
  accountCreated: "Account created", accountPersonal: "Your account is personal to you.",
  backupExported: "Exported {count} transaction(s).", backupImported: "Imported {count} transaction(s).",
  backupNotRecognized: "This file does not look like a Montra backup.", backupUnsupported: "This Montra backup version isn’t supported.",
  backupEmpty: "This backup has no transactions to import.", backupInvalid: "Some records are incomplete or invalid. Nothing was imported.",
  backupBadLink: "A product link in this backup is invalid.", backupReadFailed: "We couldn’t read this backup.",
  transactionNameRequired: "Add a name for this transaction.", amountRequired: "Enter an amount greater than zero.",
  transactionSaveFailed: "We couldn’t save this transaction. Please try again.",
  type: "Type", purchase: "Purchase", name: "Name",
  whatDidYouBuy: "What did you buy?", whereFrom: "Where did it come from?", amountNok: "Amount ({currency})",
  date: "Date", paymentMethod: "Payment method", paymentMethodHint: "Card, payment app, salary…",
  productLink: "Product link", note: "Note", notePlaceholder: "A detail worth remembering…",
  photo: "Photo", addPhoto: "Add a photo (up to 5 MB)", currentPhotoStays: "Your current photo will stay unless you choose a new one.",
  addTransactionTitle: "Add transaction", editTransactionTitle: "Edit transaction",
  close: "Close", cancel: "Cancel", saving: "Saving…", saveChanges: "Save changes", saveTransaction: "Save transaction",
  transactionDetails: "Transaction details", closeDetails: "Close details", notAdded: "Not added",
  edit: "Edit", removing: "Removing…", delete: "Delete", photoFor: "Photo for {name}",
  deleteConfirm: "Delete “{name}”? This cannot be undone.",
  transactionUpdated: "Transaction updated.", transactionSaved: "Transaction saved.", transactionDeleted: "Transaction deleted.",
  deleteFailed: "We couldn’t delete that transaction. Check your connection and try again.",
  signOutFailed: "We couldn’t sign out. Check your connection and try again.",
  preferencesSaved: "Saved.", preferencesSaveFailed: "We couldn’t save that setting. Check your connection and try again.",
  preferencesLoadFailed: "We couldn’t load your saved settings.",
  appearanceSelected: "{appearance} appearance selected.", lightTheme: "Light", darkTheme: "Dark", systemTheme: "System",
};

const nbUi: Record<string, string> = {
  ...enUi,
  loadingAccount: "Laster Montra-kontoen din", loadingTransactions: "Laster transaksjonene dine…",
  home: "Hjem", activity: "Aktivitet", more: "Mer", addTransaction: "Legg til transaksjon",
  openAppearance: "Åpne utseendeinnstillinger", openProfile: "Åpne profil", mainNavigation: "Hovednavigasjon",
  entriesDidNotLoad: "Transaksjonene dine ble ikke lastet inn", tryAgain: "Prøv igjen",
  transactionError: "Vi kunne ikke laste transaksjonene. Sjekk tilkoblingen og prøv igjen.",
  greetingHome: "Få bedre oversikt over hverdagen", goodToSeeYou: "Hyggelig å se deg, {name}",
  balanceSummary: "Saldooversikt", yourBalance: "Saldoen din", moneyIn: "Penger inn", moneyOut: "Penger ut",
  recentTransactions: "Nylige transaksjoner", viewAll: "Vis alle",
  moneyStoryStarts: "Pengeoversikten starter her",
  firstEntryHint: "Legg til ditt første kjøp eller en inntekt. Montra samler detaljene slik at du lettere kan se mønstre senere.",
  addEntry: "Legg til post", intentionalSpending: "Bruk penger med større omtanke.",
  littleAtATime: "Litt om gangen", keepWhatWhenWhy: "Ha hva, når og hvorfor for hvert kjøp på ett personlig sted.",
  transactionPageGreeting: "Alle detaljer på plass", otherDates: "Andre datoer",
  searchHistory: "Søk i historikken", searchTransactions: "Søk i transaksjoner", filterTransactions: "Filtrer transaksjoner",
  all: "Alle", purchases: "Kjøp", nothingMatches: "Ingen treff", noTransactions: "Ingen transaksjoner ennå",
  tryDifferentSearch: "Prøv et annet navn, notat eller en annen betalingsmåte.", firstEntryWillAppear: "Når du legger til en post, vises den her.",
  yourSpace: "Ditt rom, på din måte", language: "Språk", chooseLanguage: "Velg språk",
  languageFallback: "Datoer og tall følger språket du velger.",
  currency: "Valuta", originalCurrency: "Visningsvaluta",
  currencySafety: "Beløp lagres i NOK og konverteres med live valutakurser når du bytter valuta.",
  appearance: "Utseende", appearanceHint: "Velg lyset som passer deg",
  light: "Lyst", dark: "Mørkt", system: "System",
  exportBackup: "Eksporter sikkerhetskopi", saveCopy: "Lagre en kopi av transaksjonsdetaljene",
  importBackup: "Importer sikkerhetskopi", restoreCopy: "Gjenopprett transaksjonsdetaljer fra JSON", importingBackup: "Importerer sikkerhetskopi…",
  profile: "Profil", accountDetails: "Kontodetaljer og utlogging",
  signOut: "Logg ut", signingOut: "Logger ut…", signOutMontra: "Logg ut av Montra-kontoen din",
  back: "Tilbake", yourMontraAccount: "Montra-kontoen din", emailUnavailable: "E-post er ikke tilgjengelig",
  signInMethod: "Innloggingsmetode", accountCreated: "Konto opprettet", accountPersonal: "Kontoen din er personlig.",
  backupExported: "Eksporterte {count} transaksjon(er).", backupImported: "Importerte {count} transaksjon(er).",
  backupNotRecognized: "Filen ser ikke ut som en Montra-sikkerhetskopi.", backupUnsupported: "Denne versjonen av Montra-sikkerhetskopien støttes ikke.",
  backupEmpty: "Sikkerhetskopien har ingen transaksjoner å importere.", backupInvalid: "Noen poster er ufullstendige eller ugyldige. Ingenting ble importert.",
  backupBadLink: "En produktlenke i sikkerhetskopien er ugyldig.", backupReadFailed: "Vi kunne ikke lese sikkerhetskopien.",
  transactionNameRequired: "Legg til et navn på transaksjonen.", amountRequired: "Skriv inn et beløp som er større enn null.",
  transactionSaveFailed: "Vi kunne ikke lagre transaksjonen. Prøv igjen.",
  type: "Type", purchase: "Kjøp", name: "Navn",
  whatDidYouBuy: "Hva kjøpte du?", whereFrom: "Hvor kom det fra?", amountNok: "Beløp ({currency})",
  date: "Dato", paymentMethod: "Betalingsmåte", paymentMethodHint: "Kort, betalingsapp, lønn…",
  productLink: "Produktlenke", note: "Notat", notePlaceholder: "En detalj det er verdt å huske…",
  photo: "Bilde", addPhoto: "Legg til bilde (opptil 5 MB)", currentPhotoStays: "Det nåværende bildet beholdes til du velger et nytt.",
  addTransactionTitle: "Legg til transaksjon", editTransactionTitle: "Rediger transaksjon",
  close: "Lukk", cancel: "Avbryt", saving: "Lagrer…", saveChanges: "Lagre endringer", saveTransaction: "Lagre transaksjon",
  transactionDetails: "Transaksjonsdetaljer", closeDetails: "Lukk detaljer", notAdded: "Ikke lagt til",
  edit: "Rediger", removing: "Fjerner…", delete: "Slett", photoFor: "Bilde for {name}",
  deleteConfirm: "Slette «{name}»? Dette kan ikke angres.",
  transactionUpdated: "Transaksjonen er oppdatert.", transactionSaved: "Transaksjonen er lagret.", transactionDeleted: "Transaksjonen er slettet.",
  deleteFailed: "Vi kunne ikke slette transaksjonen. Sjekk tilkoblingen og prøv igjen.",
  signOutFailed: "Vi kunne ikke logge deg ut. Sjekk tilkoblingen og prøv igjen.",
  preferencesSaved: "Lagret.", preferencesSaveFailed: "Vi kunne ikke lagre innstillingen. Sjekk tilkoblingen og prøv igjen.",
  preferencesLoadFailed: "Vi kunne ikke laste de lagrede innstillingene.",
  appearanceSelected: "Valgte {appearance} utseende.", lightTheme: "Lyst", darkTheme: "Mørkt", systemTheme: "System",
};

const svUi: Record<string, string> = {
  ...enUi,
  home: "Hem", activity: "Aktivitet", more: "Mer", addTransaction: "Lägg till transaktion",
  moneyIn: "Pengar in", moneyOut: "Pengar ut", yourBalance: "Ditt saldo", recentTransactions: "Senaste transaktioner",
  viewAll: "Visa alla", language: "Språk", currency: "Valuta", appearance: "Utseende",
  light: "Ljust", dark: "Mörkt", system: "System", signOut: "Logga ut", profile: "Profil",
  purchase: "Köp", all: "Alla", purchases: "Köp", noTransactions: "Inga transaktioner än",
  tryAgain: "Försök igen", cancel: "Avbryt", saveChanges: "Spara ändringar", delete: "Ta bort",
  currencySafety: "Belopp lagras i NOK och konverteras med aktuella valutakurser när du byter valuta.",
  littleAtATime: "Lite i taget", keepWhatWhenWhy: "Ha vad, när och varför för varje köp på ett personligt ställe.",
};

const daUi: Record<string, string> = {
  ...enUi,
  home: "Hjem", activity: "Aktivitet", more: "Mere", addTransaction: "Tilføj transaktion",
  moneyIn: "Penge ind", moneyOut: "Penge ud", yourBalance: "Din saldo", recentTransactions: "Seneste transaktioner",
  viewAll: "Se alle", language: "Sprog", currency: "Valuta", appearance: "Udseende",
  light: "Lyst", dark: "Mørkt", system: "System", signOut: "Log ud", profile: "Profil",
  purchase: "Køb", all: "Alle", purchases: "Køb", noTransactions: "Ingen transaktioner endnu",
  tryAgain: "Prøv igen", cancel: "Annuller", saveChanges: "Gem ændringer", delete: "Slet",
  currencySafety: "Beløb gemmes i NOK og konverteres med aktuelle valutakurser, når du skifter valuta.",
  littleAtATime: "Lidt ad gangen", keepWhatWhenWhy: "Hold hvad, hvornår og hvorfor for hvert køb ét personligt sted.",
};

const deUi: Record<string, string> = {
  ...enUi,
  home: "Start", activity: "Aktivität", more: "Mehr", addTransaction: "Transaktion hinzufügen",
  moneyIn: "Einnahmen", moneyOut: "Ausgaben", yourBalance: "Dein Kontostand", recentTransactions: "Letzte Transaktionen",
  viewAll: "Alle anzeigen", language: "Sprache", currency: "Währung", appearance: "Erscheinungsbild",
  light: "Hell", dark: "Dunkel", system: "System", signOut: "Abmelden", profile: "Profil",
  purchase: "Einkauf", all: "Alle", purchases: "Einkäufe", noTransactions: "Noch keine Transaktionen",
  tryAgain: "Erneut versuchen", cancel: "Abbrechen", saveChanges: "Änderungen speichern", delete: "Löschen",
  currencySafety: "Beträge werden in NOK gespeichert und mit aktuellen Wechselkursen umgerechnet, wenn du die Währung wechselst.",
  littleAtATime: "Stück für Stück", keepWhatWhenWhy: "Behalte was, wann und warum jedes Kaufs an einem persönlichen Ort.",
};

const frUi: Record<string, string> = {
  ...enUi,
  home: "Accueil", activity: "Activité", more: "Plus", addTransaction: "Ajouter une transaction",
  moneyIn: "Entrées", moneyOut: "Sorties", yourBalance: "Votre solde", recentTransactions: "Transactions récentes",
  viewAll: "Tout voir", language: "Langue", currency: "Devise", appearance: "Apparence",
  light: "Clair", dark: "Sombre", system: "Système", signOut: "Se déconnecter", profile: "Profil",
  purchase: "Achat", all: "Tout", purchases: "Achats", noTransactions: "Aucune transaction pour le moment",
  tryAgain: "Réessayer", cancel: "Annuler", saveChanges: "Enregistrer", delete: "Supprimer",
  currencySafety: "Les montants sont stockés en NOK et convertis avec les taux de change en direct lorsque vous changez de devise.",
  littleAtATime: "Un peu à la fois", keepWhatWhenWhy: "Gardez le quoi, le quand et le pourquoi de chaque achat en un seul endroit personnel.",
};

const esUi: Record<string, string> = {
  ...enUi,
  home: "Inicio", activity: "Actividad", more: "Más", addTransaction: "Añadir transacción",
  moneyIn: "Entradas", moneyOut: "Salidas", yourBalance: "Tu saldo", recentTransactions: "Transacciones recientes",
  viewAll: "Ver todo", language: "Idioma", currency: "Moneda", appearance: "Apariencia",
  light: "Claro", dark: "Oscuro", system: "Sistema", signOut: "Cerrar sesión", profile: "Perfil",
  purchase: "Compra", all: "Todo", purchases: "Compras", noTransactions: "Aún no hay transacciones",
  tryAgain: "Reintentar", cancel: "Cancelar", saveChanges: "Guardar cambios", delete: "Eliminar",
  currencySafety: "Los importes se almacenan en NOK y se convierten con tipos de cambio en vivo al cambiar de moneda.",
  littleAtATime: "Un poco cada vez", keepWhatWhenWhy: "Mantén el qué, cuándo y por qué de cada compra en un solo lugar personal.",
};

const itUi: Record<string, string> = {
  ...enUi,
  home: "Home", activity: "Attività", more: "Altro", addTransaction: "Aggiungi transazione",
  moneyIn: "Entrate", moneyOut: "Uscite", yourBalance: "Il tuo saldo", recentTransactions: "Transazioni recenti",
  viewAll: "Vedi tutto", language: "Lingua", currency: "Valuta", appearance: "Aspetto",
  light: "Chiaro", dark: "Scuro", system: "Sistema", signOut: "Esci", profile: "Profilo",
  purchase: "Acquisto", all: "Tutto", purchases: "Acquisti", noTransactions: "Nessuna transazione ancora",
  tryAgain: "Riprova", cancel: "Annulla", saveChanges: "Salva modifiche", delete: "Elimina",
  currencySafety: "Gli importi sono memorizzati in NOK e convertiti con tassi di cambio in tempo reale quando cambi valuta.",
  littleAtATime: "Un po’ alla volta", keepWhatWhenWhy: "Tieni cosa, quando e perché di ogni acquisto in un unico posto personale.",
};

const ptUi: Record<string, string> = {
  ...enUi,
  home: "Início", activity: "Atividade", more: "Mais", addTransaction: "Adicionar transação",
  moneyIn: "Entradas", moneyOut: "Saídas", yourBalance: "Seu saldo", recentTransactions: "Transações recentes",
  viewAll: "Ver tudo", language: "Idioma", currency: "Moeda", appearance: "Aparência",
  light: "Claro", dark: "Escuro", system: "Sistema", signOut: "Sair", profile: "Perfil",
  purchase: "Compra", all: "Tudo", purchases: "Compras", noTransactions: "Ainda não há transações",
  tryAgain: "Tentar de novo", cancel: "Cancelar", saveChanges: "Salvar alterações", delete: "Excluir",
  currencySafety: "Os valores são armazenados em NOK e convertidos com taxas de câmbio ao vivo ao mudar de moeda.",
  littleAtATime: "Um pouco de cada vez", keepWhatWhenWhy: "Mantenha o quê, quando e porquê de cada compra num só lugar pessoal.",
};

const nlUi: Record<string, string> = {
  ...enUi,
  home: "Home", activity: "Activiteit", more: "Meer", addTransaction: "Transactie toevoegen",
  moneyIn: "Inkomsten", moneyOut: "Uitgaven", yourBalance: "Je saldo", recentTransactions: "Recente transacties",
  viewAll: "Alles bekijken", language: "Taal", currency: "Valuta", appearance: "Uiterlijk",
  light: "Licht", dark: "Donker", system: "Systeem", signOut: "Uitloggen", profile: "Profiel",
  purchase: "Aankoop", all: "Alles", purchases: "Aankopen", noTransactions: "Nog geen transacties",
  tryAgain: "Opnieuw proberen", cancel: "Annuleren", saveChanges: "Wijzigingen opslaan", delete: "Verwijderen",
  currencySafety: "Bedragen worden opgeslagen in NOK en omgerekend met actuele wisselkoersen wanneer je van valuta wisselt.",
  littleAtATime: "Beetje bij beetje", keepWhatWhenWhy: "Houd wat, wanneer en waarom van elke aankoop op één persoonlijke plek.",
};

const uiCopy: Record<CopyLanguage, Record<string, string>> = {
  en: enUi,
  nb: nbUi,
  sv: svUi,
  da: daUi,
  de: deUi,
  fr: frUi,
  es: esUi,
  it: itUi,
  pt: ptUi,
  nl: nlUi,
};

export function translate(
  key: string,
  language: AppLanguage,
  values: Record<string, string | number> = {},
): string {
  const copyLang = languageForCopy(language);
  const text = uiCopy[copyLang]?.[key] ?? uiCopy.en[key] ?? "—";
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
