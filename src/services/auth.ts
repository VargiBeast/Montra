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

/** Magic-link email OTP (creates user if needed). */
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

/** Optional OTP code verification for magic-link flows that collect a code. */
export async function verifyEmailCode(email: string, token: string) {
  const client = requireSupabase();
  const { error } = await client.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error) throw error;
}

export async function signOut() {
  const client = requireSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}
