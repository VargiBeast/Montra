import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/authentication/AuthProvider';
import type { SavingsGoal, SavingsGoalInput } from '@/types/savingsGoal';

const TABLE = 'savings_goals';

export function useSavingsGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!supabase || !user) {
      setGoals([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: qError } = await supabase
        .from(TABLE)
        .select('id, user_id, name, target_amount, current_amount, deadline, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (qError) throw qError;
      setGoals(
        (data ?? []).map((row) => ({
          ...row,
          target_amount: Number(row.target_amount),
          current_amount: Number(row.current_amount),
          deadline: row.deadline ?? null,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = useCallback(
    async (input: SavingsGoalInput, existing?: SavingsGoal) => {
      if (!supabase || !user) throw new Error('Not authenticated');
      const name = input.name.trim();
      if (!name) throw new Error('Name is required');
      if (!Number.isFinite(input.target_amount) || input.target_amount <= 0) {
        throw new Error('Target must be greater than zero');
      }
      const now = new Date().toISOString();
      if (existing) {
        const { error: uError } = await supabase
          .from(TABLE)
          .update({
            name,
            target_amount: input.target_amount,
            current_amount: input.current_amount,
            deadline: input.deadline,
            updated_at: now,
          })
          .eq('id', existing.id)
          .eq('user_id', user.id);
        if (uError) throw uError;
      } else {
        const { error: iError } = await supabase.from(TABLE).insert({
          user_id: user.id,
          name,
          target_amount: input.target_amount,
          current_amount: input.current_amount,
          deadline: input.deadline,
          created_at: now,
          updated_at: now,
        });
        if (iError) throw iError;
      }
      await refresh();
    },
    [user, refresh],
  );

  const remove = useCallback(
    async (goal: SavingsGoal) => {
      if (!supabase || !user) throw new Error('Not authenticated');
      // Unlink wishlist items first (preserves existing relationship direction)
      await supabase
        .from('wishlists')
        .update({ savings_goal_id: null, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('savings_goal_id', goal.id);
      const { error: dError } = await supabase
        .from(TABLE)
        .delete()
        .eq('id', goal.id)
        .eq('user_id', user.id);
      if (dError) throw dError;
      await refresh();
    },
    [user, refresh],
  );

  return { goals, loading, error, refresh, save, remove };
}
