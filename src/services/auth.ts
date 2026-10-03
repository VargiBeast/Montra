import type { Provider } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured for this app.");
  }
  return supabase;
}

function redirectTo() {
  return window.location.origin;
}

export async function signInWithProvider(provider: Provider) {
  const client = requireSupabase();
  const { error } = await client.auth.signInWithOAuth({
    provider,
    options: { redirectTo: redirectTo() },
  });
  if (error) throw error;
}

export async function signInWithEmail(email: string) {
  const client = requireSupabase();
  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo(),
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
    options: { emailRedirectTo: redirectTo() },
  });
  if (error) throw error;
  return { needsConfirmation: !data.session };
}

export async function signOut() {
  const client = requireSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}
