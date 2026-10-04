import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import * as savingsGoalsService from "../services/savingsGoals";
import type { SavingsGoal, SavingsGoalInput } from "../types/savingsGoal";

export function useSavingsGoals(userId: string | undefined) {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);
  const [loadedUserId, setLoadedUserId] = useState<string | undefined>();
  const latestRequest = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++latestRequest.current;
    if (!userId || !supabase) {
      setGoals([]);
      setLoadedUserId(undefined);
      setError(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await savingsGoalsService.listSavingsGoals(supabase, userId);
      if (requestId === latestRequest.current) {
        setGoals(result);
        setLoadedUserId(userId);
        setError(null);
      }
    } catch (reason) {
      console.error("Could not load savings goals.", reason);
      if (requestId === latestRequest.current) {
        setError("We couldn\u2019t load your savings goals. Check your connection and try again.");
        setLoadedUserId(userId);
      }
    } finally {
      if (requestId === latestRequest.current) setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = useCallback(
    async (input: SavingsGoalInput, existing?: SavingsGoal) => {
      if (!userId || !supabase) throw new Error("Sign in before saving goals.");
      await savingsGoalsService.saveSavingsGoal(supabase, userId, input, existing);
      await refresh();
    },
    [userId, refresh],
  );

  const remove = useCallback(
    async (goal: SavingsGoal) => {
      if (!userId || !supabase) throw new Error("Sign in before deleting goals.");
      await savingsGoalsService.deleteSavingsGoal(supabase, userId, goal);
      await refresh();
    },
    [userId, refresh],
  );

  return {
    goals: userId && loadedUserId === userId ? goals : [],
    isLoading: Boolean(userId) && isLoading,
    error,
    refresh,
    save,
    remove,
  };
}
