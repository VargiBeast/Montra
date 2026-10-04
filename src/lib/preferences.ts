import { supabase } from "./supabase";

export const languageChoices = [
  { locale: "en", label: "English" },
  { locale: "nb", label: "Norsk (Bokmål)" },
  { locale: "sv", label: "Svenska" },
  { locale: "da", label: "Dansk" },
  { locale: "de", label: "Deutsch" },
  { locale: "fr", label: "Français" },
  { locale: "es", label: "Español" },
  { locale: "it", label: "Italiano" },
  { locale: "pt", label: "Português" },
  { locale: "nl", label: "Nederlands" },
  { locale: "fi", label: "Suomi" },
  { locale: "pl", label: "Polski" },
  { locale: "cs", label: "Čeština" },
  { locale: "tr", label: "Türkçe" },
  { locale: "ar", label: "العربية" },
  { locale: "ja", label: "日本語" },
  { locale: "ko", label: "한국어" },
  { locale: "zh-Hans", label: "简体中文" },
] as const;

export const currencyChoices = [
  { code: "NOK", label: "Norwegian Krone" },
  { code: "USD", label: "US Dollar" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "British Pound" },
  { code: "SEK", label: "Swedish Krona" },
  { code: "DKK", label: "Danish Krone" },
  { code: "CHF", label: "Swiss Franc" },
  { code: "JPY", label: "Japanese Yen" },
  { code: "CNY", label: "Chinese Yuan" },
  { code: "PLN", label: "Polish Złoty" },
  { code: "CZK", label: "Czech Koruna" },
  { code: "TRY", label: "Turkish Lira" },
  { code: "KRW", label: "South Korean Won" },
] as const;

export type PreferenceLocale = (typeof languageChoices)[number]["locale"];
export type DisplayCurrency = (typeof currencyChoices)[number]["code"];

export interface UserPreferences {
  locale: PreferenceLocale;
  currency: DisplayCurrency;
}

const TABLE = "user_preferences";
const DEFAULT_PREFERENCES: UserPreferences = { locale: "en", currency: "NOK" };

const LOCALE_ALIASES: Record<string, PreferenceLocale> = {
  en: "en",
  nb: "nb",
  no: "nb",
  nn: "nb",
  sv: "sv",
  da: "da",
  de: "de",
  fr: "fr",
  es: "es",
  it: "it",
  pt: "pt",
  nl: "nl",
  fi: "fi",
  pl: "pl",
  cs: "cs",
  tr: "tr",
  ar: "ar",
  ja: "ja",
  ko: "ko",
  zh: "zh-Hans",
  "zh-hans": "zh-Hans",
  "zh-cn": "zh-Hans",
};

export function normalizePreferenceLocale(value: string | null | undefined): PreferenceLocale {
  if (!value) return "en";
  const base = value.trim().toLowerCase().replace("_", "-");
  const primary = base.split("-")[0];
  return LOCALE_ALIASES[base] ?? LOCALE_ALIASES[primary] ?? "en";
}

export function normalizeDisplayCurrency(value: string | null | undefined): DisplayCurrency {
  const code = value?.trim().toUpperCase();
  return currencyChoices.some((choice) => choice.code === code) ? (code as DisplayCurrency) : "NOK";
}

function client() {
  if (!supabase) throw new Error("Montra is missing its Supabase connection settings.");
  return supabase;
}

function toPreferences(row: { locale?: string | null; currency?: string | null }): UserPreferences {
  return {
    locale: normalizePreferenceLocale(row.locale),
    currency: normalizeDisplayCurrency(row.currency),
  };
}

export async function fetchUserPreferences(userId: string): Promise<UserPreferences | null> {
  const { data, error } = await client()
    .from(TABLE)
    .select("locale, currency")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ? toPreferences(data) : null;
}

export async function ensureUserPreferences(userId: string): Promise<UserPreferences> {
  const existing = await fetchUserPreferences(userId);
  if (existing) return existing;

  const { error } = await client().from(TABLE).insert({
    user_id: userId,
    locale: DEFAULT_PREFERENCES.locale,
    currency: DEFAULT_PREFERENCES.currency,
  });
  if (!error) return DEFAULT_PREFERENCES;

  const raced = await fetchUserPreferences(userId);
  if (raced) return raced;
  throw error;
}

export async function saveUserPreferences(userId: string, preferences: UserPreferences): Promise<void> {
  const payload = {
    user_id: userId,
    locale: preferences.locale,
    currency: preferences.currency,
  };
  const { data, error } = await client()
    .from(TABLE)
    .update({ locale: payload.locale, currency: payload.currency })
    .eq("user_id", userId)
    .select("user_id");
  if (error) throw error;
  if (data?.length) return;

  const { error: insertError } = await client().from(TABLE).insert(payload);
  if (insertError) throw insertError;
}
