-- Recurring payments (planned income/expense templates).
-- These are NOT transactions. They must never be mixed into balance/analytics
-- until the user explicitly logs one occurrence as a transaction.

CREATE TABLE IF NOT EXISTS public.recurring_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('in', 'out')),
  name text NOT NULL,
  amount numeric(14, 2) NOT NULL CHECK (amount > 0),
  interval text NOT NULL CHECK (interval IN ('weekly', 'monthly', 'yearly')),
  anchor_date date NOT NULL,
  schedule_day integer NULL CHECK (schedule_day IS NULL OR (schedule_day >= 1 AND schedule_day <= 31)),
  next_due_date date NOT NULL,
  note text NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS recurring_payments_user_id_idx
  ON public.recurring_payments (user_id);

CREATE INDEX IF NOT EXISTS recurring_payments_user_next_due_idx
  ON public.recurring_payments (user_id, next_due_date ASC)
  WHERE active = true;

ALTER TABLE public.recurring_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recurring_payments_select_own" ON public.recurring_payments;
DROP POLICY IF EXISTS "recurring_payments_insert_own" ON public.recurring_payments;
DROP POLICY IF EXISTS "recurring_payments_update_own" ON public.recurring_payments;
DROP POLICY IF EXISTS "recurring_payments_delete_own" ON public.recurring_payments;

CREATE POLICY "recurring_payments_select_own"
  ON public.recurring_payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "recurring_payments_insert_own"
  ON public.recurring_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recurring_payments_update_own"
  ON public.recurring_payments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recurring_payments_delete_own"
  ON public.recurring_payments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
