import { readLanguage } from "./i18n";

function phrase(en: string, no: string) {
  return readLanguage() === "no" ? no : en;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof error.message === "string"
        ? error.message
        : "";

  const normalized = message.toLowerCase();

  if (
    normalized.includes("provider") &&
    (normalized.includes("not enabled") || normalized.includes("unsupported"))
  ) {
    return phrase(
      "That sign-in option isn’t enabled on this Saldo account yet. Try Google or email.",
      "Den innloggingsmåten er ikke aktivert på denne Saldo-kontoen ennå. Prøv Google eller e-post.",
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
    normalized.includes("rate limit") ||
    normalized.includes("too many requests")
  ) {
    return phrase(
      "Please wait a little before trying again.",
      "Vent litt før du prøver igjen.",
    );
  }

  if (
    normalized.includes("network") ||
    normalized.includes("fetch") ||
    normalized.includes("connection")
  ) {
    return phrase(
      "We couldn’t reach Saldo. Check your internet connection and try again.",
      "Vi fikk ikke kontakt med Saldo. Sjekk internett og prøv igjen.",
    );
  }

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid credentials")
  ) {
    return phrase("Incorrect password.", "Feil passord.");
  }

  if (
    normalized.includes("invalid email") ||
    normalized.includes("unable to validate email")
  ) {
    return phrase("Invalid email.", "Ugyldig e-post.");
  }

  if (normalized.includes("email not confirmed")) {
    return phrase(
      "Confirm your email before signing in with a password.",
      "Bekreft e-posten din før du logger inn med passord.",
    );
  }

  if (
    normalized.includes("user already registered") ||
    normalized.includes("already been registered")
  ) {
    return phrase(
      "An account with this email already exists. Try signing in.",
      "Det finnes allerede en konto med denne e-posten. Prøv å logge inn.",
    );
  }

  if (
    (normalized.includes("otp") || normalized.includes("token")) &&
    (normalized.includes("invalid") || normalized.includes("expired"))
  ) {
    return phrase(
      "Invalid or expired code.",
      "Ugyldig eller utløpt kode.",
    );
  }

  if (
    normalized.includes("password") &&
    normalized.includes("at least")
  ) {
    return phrase(
      "Password must be at least 6 characters.",
      "Passordet må ha minst 6 tegn.",
    );
  }

  if (!message) return fallback;

  return fallback;
}