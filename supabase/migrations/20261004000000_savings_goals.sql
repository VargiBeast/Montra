-- Savings Goals for Montra
-- Amounts are stored in base currency (NOK), same as transactions.

CREATE TABLE IF NOT EXISTS public.savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name text NOT NULL,
  target_amount numeric(14, 2) NOT NULL CHECK (target_amount > 0),
  current_amount numeric(14, 2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  deadline date NULL,
  wishlist_item_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS savings_goals_user_id_idx
  ON public.savings_goals (user_id);

CREATE INDEX IF NOT EXISTS savings_goals_user_updated_idx
  ON public.savings_goals (user_id, updated_at DESC);

ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "savings_goals_select_own" ON public.savings_goals;
DROP POLICY IF EXISTS "savings_goals_insert_own" ON public.savings_goals;
DROP POLICY IF EXISTS "savings_goals_update_own" ON public.savings_goals;
DROP POLICY IF EXISTS "savings_goals_delete_own" ON public.savings_goals;

CREATE POLICY "savings_goals_select_own"
  ON public.savings_goals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "savings_goals_insert_own"
  ON public.savings_goals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "savings_goals_update_own"
  ON public.savings_goals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "savings_goals_delete_own"
  ON public.savings_goals
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
