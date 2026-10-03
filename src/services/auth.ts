import type { Provider } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured for this app.");
  }
  return supabase;
}

export async function signInWithProvider(provider: Provider) {
  const client = requireSupabase();
  const { error } = await client.auth.signInWithOAuth({
    provider,
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}

export async function signInWithEmail(email: string) {
  const client = requireSupabase();
  const { error } = await client.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) throw error;
}

export async function signOut() {
  const client = requireSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}