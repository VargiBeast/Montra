export type AppLanguage = "en" | "no";

const STORAGE_KEY = "saldo.language";

export function readLanguage(): AppLanguage {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "no" ? "no" : "en";
  } catch {
    return "en";
  }
}

export function writeLanguage(language: AppLanguage) {
  try {
    window.localStorage.setItem(STORAGE_KEY, language);
  } catch {
    /* Language still applies for this visit if storage is blocked. */
  }
}

export const loginCopy = {
  en: {
    languageName: "English",
    languageLabel: "Language",
    storyTitle: "Your money,\nin a softer focus.",
    storyBody: "A personal journal for the things you spend on and the things that come in. Clear enough to understand, human enough to return to.",
    welcome: "Welcome to Saldo",
    welcomeBody: "Sign in to find your money story right where you left it.",
    notConnected: "Saldo isn’t connected yet. Add the Supabase connection settings to continue.",
    tryAgain: "Try again",
    continueGoogle: "Continue with Google",
    continueEmail: "Continue with Email",
    or: "or",
    choose: "Choose how you’d like to sign in:",
    password: "Password",
    oneTime: "One-time code",
    email: "Email address",
    emailPlaceholder: "you@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "Your password",
    continue: "Continue",
    continuing: "Continuing…",
    sendCode: "Send code",
    sending: "Sending…",
    back: "Back",
    createAccount: "Create account",
    creating: "Creating account…",
    haveAccount: "Already have a password?",
    signInInstead: "Sign in",
    needAccount: "New to Saldo?",
    usePassword: "Use a password",
    useCode: "Use a one-time code",
    codeSent: "Code sent",
    codeSentBody: "A one-time code and sign-in link are on their way to",
    codeSentHint: "Open the link in this browser, or enter the code from the email.",
    codeLabel: "One-time code",
    codePlaceholder: "123456",
    verify: "Verify code",
    verifying: "Verifying…",
    resend: "Send a new code",
    accountCreated: "Account created. Check your email to confirm it, then sign in.",
    signedUpReady: "Account created. You’re signed in.",
    legal: "By continuing, you’re signing in to your personal Saldo space.",
    enterEmail: "Please enter your email.",
    invalidEmail: "Invalid email.",
    enterPassword: "Please enter your password.",
    shortPassword: "Password must be at least 6 characters.",
    enterCode: "Please enter the code from your email.",
    couldNotSend: "Something went wrong. Please try again.",
    couldNotSignIn: "Something went wrong. Please try again.",
  },
  no: {
    languageName: "Norsk",
    languageLabel: "Språk",
    storyTitle: "Pengene dine,\ni et mykere fokus.",
    storyBody: "En personlig journal for det du bruker penger på, og det som kommer inn. Tydelig nok til å forstå, menneskelig nok til å komme tilbake til.",
    welcome: "Velkommen til Saldo",
    welcomeBody: "Logg inn for å finne pengehistorien din der du forlot den.",
    notConnected: "Saldo er ikke koblet til ennå. Legg inn Supabase-innstillingene for å fortsette.",
    tryAgain: "Prøv igjen",
    continueGoogle: "Fortsett med Google",
    continueEmail: "Fortsett med e-post",
    or: "eller",
    choose: "Velg hvordan du vil logge inn:",
    password: "Passord",
    oneTime: "Engangskode",
    email: "E-postadresse",
    emailPlaceholder: "deg@example.com",
    passwordLabel: "Passord",
    passwordPlaceholder: "Passordet ditt",
    continue: "Fortsett",
    continuing: "Fortsetter…",
    sendCode: "Send kode",
    sending: "Sender…",
    back: "Tilbake",
    createAccount: "Opprett konto",
    creating: "Oppretter konto…",
    haveAccount: "Har du allerede passord?",
    signInInstead: "Logg inn",
    needAccount: "Ny i Saldo?",
    usePassword: "Bruk passord",
    useCode: "Bruk engangskode",
    codeSent: "Kode sendt",
    codeSentBody: "En engangskode og innloggingslenke er på vei til",
    codeSentHint: "Åpne lenken i denne nettleseren, eller skriv inn koden fra e-posten.",
    codeLabel: "Engangskode",
    codePlaceholder: "123456",
    verify: "Bekreft kode",
    verifying: "Bekrefter…",
    resend: "Send ny kode",
    accountCreated: "Konto opprettet. Sjekk e-posten for å bekrefte den, og logg deretter inn.",
    signedUpReady: "Konto opprettet. Du er logget inn.",
    legal: "Ved å fortsette logger du inn i ditt personlige Saldo-område.",
    enterEmail: "Skriv inn e-postadressen din.",
    invalidEmail: "Ugyldig e-post.",
    enterPassword: "Skriv inn passordet ditt.",
    shortPassword: "Passordet må ha minst 6 tegn.",
    enterCode: "Skriv inn koden fra e-posten.",
    couldNotSend: "Noe gikk galt. Prøv igjen.",
    couldNotSignIn: "Noe gikk galt. Prøv igjen.",
  },
} as const;
