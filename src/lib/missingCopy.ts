export const missingCopy = {
  en: {
    hello: "Hello",
    homeTitle: "Home",
    currentBalance: "Current balance",
    recentActivity: "Recent activity",
    settingsGreeting: "Your space, your way",
    languageHint: "Choose your language",
    displayCurrency: "Currency",
    currencyHint: "Display currency",
    exportHint: "Save a copy of your transaction details",
    importHint: "Restore transaction details from JSON",
    wishlist: "Wishlist",
    wishlistHint: "Products you want, with price and a savings goal",
    profileHint: "Account details and sign out",
    signOutHint: "Sign out of your Montra account",
    onboardingSignIn: "Sign in",
    onboardingAccountTitle: "Keep your Montra safe",
    onboardingAccountBody: "Sign in to sync this device and keep your entries across sessions.",
    onboardingAccountCta: "Sign in or create account",
    onboardingAccountLater: "Not now",
    sectionPreferences: "Preferences",
    sectionData: "Data",
    sectionAccount: "Account",
  },
  nb: {
    hello: "Hei",
    homeTitle: "Hjem",
    currentBalance: "Current balance",
    recentActivity: "Siste aktivitet",
    settingsGreeting: "Ditt rom, p\u00e5 din m\u00e5te",
    languageHint: "Velg spr\u00e5k",
    displayCurrency: "Valuta",
    currencyHint: "Visningsvaluta",
    exportHint: "Lagre en kopi av transaksjonsdetaljene",
    importHint: "Gjenopprett transaksjonsdetaljer fra JSON",
    wishlist: "\u00d8nskeliste",
    wishlistHint: "Ting du vil spare til",
    profileHint: "Kontodetaljer og utlogging",
    signOutHint: "Logg ut av Montra-kontoen din",
    onboardingSignIn: "Logg inn",
    onboardingAccountTitle: "Ta vare p\u00e5 Montra-en din",
    onboardingAccountBody: "Logg inn for \u00e5 synke denne enheten og beholde oppf\u00f8ringene dine.",
    onboardingAccountCta: "Logg inn eller opprett konto",
    onboardingAccountLater: "Ikke n\u00e5",
    sectionPreferences: "Innstillinger",
    sectionData: "Data",
    sectionAccount: "Konto",
  },
} as const;

export function fillMissingCopy(key: string, value: string, language: string): string {
  // Never surface internal keys. A real translation, including English fallback
  // already applied by translate(), must pass through unchanged.
  if (value && value !== "\u2014" && value !== key) return value;
  const lang = language.toLowerCase().startsWith("nb") || language.toLowerCase().startsWith("no") || language.toLowerCase().startsWith("nn") ? "nb" : "en";
  return missingCopy[lang][key as keyof typeof missingCopy.en]
    ?? missingCopy.en[key as keyof typeof missingCopy.en]
    ?? (value && value !== key ? value : "\u2014");
}
