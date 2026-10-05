import { languageForCopy, readLanguage } from "./i18n";

function phrase(en: string, no: string) {
  const lang = languageForCopy(readLanguage());
  return lang === "nb" ? no : en;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof (error as { message: unknown }).message === "string"
        ? (error as { message: string }).message
        : "";

  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
      ? String((error as { code: string }).code).toLowerCase()
      : typeof error === "object" &&
          error !== null &&
          "error_code" in error &&
          typeof (error as { error_code: unknown }).error_code === "string"
        ? String((error as { error_code: string }).error_code).toLowerCase()
        : "";

  const normalized = `${message} ${code}`.toLowerCase();

  if (
    normalized.includes("over_email_send_rate_limit") ||
    normalized.includes("email rate limit") ||
    normalized.includes("rate limit") ||
    normalized.includes("too many requests") ||
    code === "over_email_send_rate_limit"
  ) {
    return phrase(
      "Too many sign-in emails were sent. Please wait a few minutes, or sign in with a password or Google.",
      "For mange innloggings-e-poster er sendt. Vent noen minutter, eller logg inn med passord eller Google.",
    );
  }

  if (
    normalized.includes("provider") &&
    (normalized.includes("not enabled") || normalized.includes("unsupported"))
  ) {
    return phrase(
      "That sign-in option isn’t enabled on this Montra account yet. Try Google or email.",
      "Den innloggingsmåten er ikke aktivert på denne Montra-kontoen ennå. Prøv Google eller e-post.",
    );
  }

  if (
    normalized.includes("redirect") &&
    (normalized.includes("not allowed") || normalized.includes("whitelist"))
  ) {
    return phrase(
      "This app address isn’t in Supabase’s allowed redirect URLs yet. Ask the account owner to add it.",
      "Denne appadressen er ikke lagt til i Supabase sine tillatte redirect-URL-er ennå.",
    );
  }

  if (
    normalized.includes("network") ||
    normalized.includes("fetch") ||
    normalized.includes("connection") ||
    normalized.includes("failed to fetch")
  ) {
    return phrase(
      "We couldn’t reach Montra. Check your internet connection and try again.",
      "Vi fikk ikke kontakt med Montra. Sjekk internett og prøv igjen.",
    );
  }

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid_credentials") ||
    normalized.includes("invalid credentials")
  ) {
    return phrase("Incorrect email or password.", "Feil e-post eller passord.");
  }

  if (
    normalized.includes("invalid email") ||
    normalized.includes("unable to validate email") ||
    normalized.includes("email_address_invalid")
  ) {
    return phrase("Invalid email.", "Ugyldig e-post.");
  }

  if (
    normalized.includes("email not confirmed") ||
    normalized.includes("email_not_confirmed")
  ) {
    return phrase(
      "Confirm your email before signing in with a password. Check your inbox for the confirmation link.",
      "Bekreft e-posten din før du logger inn med passord. Sjekk innboksen for bekreftelseslenken.",
    );
  }

  if (
    normalized.includes("user already registered") ||
    normalized.includes("already been registered") ||
    normalized.includes("user_already_exists")
  ) {
    return phrase(
      "An account with this email already exists. Try signing in.",
      "Det finnes allerede en konto med denne e-posten. Prøv å logge inn.",
    );
  }

  if (
    (normalized.includes("otp") || normalized.includes("token") || normalized.includes("code")) &&
    (normalized.includes("invalid") || normalized.includes("expired"))
  ) {
    return phrase(
      "Invalid or expired code. Request a new one and try again.",
      "Ugyldig eller utløpt kode. Be om en ny og prøv igjen.",
    );
  }

  if (normalized.includes("password") && normalized.includes("at least")) {
    return phrase(
      "Password must be at least 6 characters.",
      "Passordet må ha minst 6 tegn.",
    );
  }

  if (
    normalized.includes("signup is disabled") ||
    normalized.includes("signups not allowed")
  ) {
    return phrase(
      "New account creation is temporarily unavailable. Try signing in instead.",
      "Oppretting av ny konto er midlertidig utilgjengelig. Prøv å logge inn i stedet.",
    );
  }

  if (!message) return fallback;

  // Prefer a friendly fallback over raw Supabase strings for unknown cases
  return fallback;
}
