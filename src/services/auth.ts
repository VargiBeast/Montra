import type { Provider } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured for this app.");
  }
  return supabase;
}

function redirectTo(path = "/") {
  const origin = window.location.origin;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function signInWithProvider(provider: Provider) {
  const client = requireSupabase();
  const { error } = await client.auth.signInWithOAuth({
    provider,
    options: { redirectTo: redirectTo("/app") },
  });
  if (error) throw error;
}

export async function signInWithEmail(email: string) {
  const client = requireSupabase();
  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo("/app"),
      shouldCreateUser: true,
    },
  });
  if (error) throw error;
}

export async function verifyEmailCode(email: string, token: string) {
  const client = requireSupabase();
  const { error } = await client.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error) throw error;
}

export async function signInWithPassword(email: string, password: string) {
  const client = requireSupabase();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUpWithPassword(email: string, password: string) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: redirectTo("/app") },
  });
  if (error) throw error;
  return { needsConfirmation: !data.session };
}

/** Send a password-reset email. Redirects to /reset-password after the user clicks the link. */
export async function requestPasswordReset(email: string) {
  const client = requireSupabase();
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo("/reset-password"),
  });
  if (error) throw error;
}

/** Set a new password while the recovery session from the email link is active. */
export async function updatePassword(password: string) {
  const client = requireSupabase();
  const { error } = await client.auth.updateUser({ password });
  if (error) throw error;
}

export async function signOut() {
  const client = requireSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}
