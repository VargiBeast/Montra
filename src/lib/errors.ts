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
  if (normalized.includes("provider") && (normalized.includes("not enabled") || normalized.includes("unsupported"))) {
    return "That sign-in option isn’t enabled on this Saldo account yet. Try Google or email.";
  }
  if (normalized.includes("redirect") && (normalized.includes("not allowed") || normalized.includes("whitelist"))) {
    return "This app address isn’t in Supabase’s allowed redirect URLs yet. Ask the account owner to add it.";
  }
  if (normalized.includes("rate limit") || normalized.includes("too many requests")) {
    return "Please wait a little before trying again.";
  }
  if (normalized.includes("network") || normalized.includes("fetch") || normalized.includes("connection")) {
    return "We couldn’t reach Saldo. Check your internet connection and try again.";
  }
  return fallback;
}