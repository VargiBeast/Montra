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
  },
  nb: {
    hello: "Hei",
    homeTitle: "Hjem",
    currentBalance: "Saldo n\u00e5",
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
  },
} as const;

export function fillMissingCopy(key: string, value: string, language: string): string {
  if (value !== "\u2014") return value;
  const lang = language.toLowerCase().startsWith("nb") || language.toLowerCase().startsWith("no") || language.toLowerCase().startsWith("nn") ? "nb" : "en";
  return missingCopy[lang][key as keyof typeof missingCopy.en] ?? missingCopy.en[key as keyof typeof missingCopy.en] ?? key;
}
