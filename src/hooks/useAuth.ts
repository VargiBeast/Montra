import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getErrorMessage } from "../lib/errors";
import { configurationError, isSupabaseConfigured, supabase } from "../lib/supabase";
import * as authService from "../services/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(configurationError);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoading(false);
      return;
    }
    let active = true;
    const sessionTimeout = window.setTimeout(() => {
      if (!active) return;
      setAuthError("We couldn’t connect to your account. Check your connection and try again.");
      setIsLoading(false);
    }, 12000);
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        window.clearTimeout(sessionTimeout);
        setUser(session?.user ?? null);
        setAuthError(null);
        setIsLoading(false);
      }
    });

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        window.clearTimeout(sessionTimeout);
        if (error) throw error;
        setUser(data.session?.user ?? null);
        setAuthError(null);
        setIsLoading(false);
      })
      .catch((error: unknown) => {
        if (!active) return;
        window.clearTimeout(sessionTimeout);
        console.error("Could not restore the Montra session.", error);
        setAuthError("We couldn’t connect to your account. Check your connection and try again.");
        setIsLoading(false);
      });

    return () => {
      active = false;
      window.clearTimeout(sessionTimeout);
      listener.subscription.unsubscribe();
    };
  }, []);

  const runAuthAction = useCallback(async (action: () => Promise<void>) => {
    setAuthError(null);
    try {
      await action();
    } catch (error) {
      console.error("Authentication failed.", error);
      const message = getErrorMessage(error, "We couldn’t complete that sign-in. Please try again.");
      setAuthError(message);
      throw new Error(message);
    }
  }, []);

  const signInWithProvider = useCallback(
    (provider: "google") =>
      runAuthAction(() => authService.signInWithProvider(provider)),
    [runAuthAction],
  );
  const signInWithEmail = useCallback(
    (email: string) => runAuthAction(() => authService.signInWithEmail(email)),
    [runAuthAction],
  );
  const verifyEmailCode = useCallback(
    (email: string, token: string) => runAuthAction(() => authService.verifyEmailCode(email, token)),
    [runAuthAction],
  );
  const signOut = useCallback(
    () => runAuthAction(() => authService.signOut()),
    [runAuthAction],
  );

  const retrySession = useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);
    setAuthError(null);
    const sessionTimeout = window.setTimeout(() => {
      setAuthError("We couldn’t connect to your account. Check your connection and try again.");
      setIsLoading(false);
    }, 12000);
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      setUser(data.session?.user ?? null);
    } catch (error) {
      console.error("Could not restore the Montra session.", error);
      setAuthError("We couldn’t connect to your account. Check your connection and try again.");
    } finally {
      window.clearTimeout(sessionTimeout);
      setIsLoading(false);
    }
  }, []);

  return {
    user,
    isLoading,
    authError,
    isConfigured: isSupabaseConfigured,
    signInWithProvider,
    signInWithEmail,
    verifyEmailCode,
    signOut,
    retrySession,
  };
}
