-- Montra Plus entitlement sync
-- Stripe Sync Engine writes stripe.subscriptions → this keeps public.plus_entitlements in sync.
-- Frontend only SELECTs its own row (RLS). No client writes.

CREATE TABLE IF NOT EXISTS public.plus_entitlements (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL,
  stripe_subscription_id text,
  status text NOT NULL DEFAULT 'none',
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS plus_entitlements_stripe_subscription_id_uidx
  ON public.plus_entitlements (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS plus_entitlements_stripe_customer_id_idx
  ON public.plus_entitlements (stripe_customer_id);

CREATE INDEX IF NOT EXISTS plus_entitlements_status_idx
  ON public.plus_entitlements (status);

ALTER TABLE public.plus_entitlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plus_entitlements_select_own" ON public.plus_entitlements;
CREATE POLICY "plus_entitlements_select_own"
  ON public.plus_entitlements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public._plus_period_end_as_timestamptz(raw anyelement)
RETURNS timestamptz
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF raw IS NULL THEN
    RETURN NULL;
  END IF;
  IF pg_typeof(raw) IN ('bigint'::regtype, 'integer'::regtype, 'numeric'::regtype, 'double precision'::regtype) THEN
    IF (raw::numeric) > 1000000000000 THEN
      RETURN to_timestamp((raw::numeric) / 1000.0);
    END IF;
    RETURN to_timestamp(raw::numeric);
  END IF;
  IF pg_typeof(raw) IN ('timestamp with time zone'::regtype, 'timestamp without time zone'::regtype) THEN
    RETURN raw::timestamptz;
  END IF;
  BEGIN
    RETURN raw::text::timestamptz;
  EXCEPTION WHEN others THEN
    BEGIN
      RETURN to_timestamp(raw::text::numeric);
    EXCEPTION WHEN others THEN
      RETURN NULL;
    END;
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_plus_entitlement_for_customer(p_customer_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, stripe, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_sub_id text;
  v_status text;
  v_period_end timestamptz;
  v_livemode boolean;
BEGIN
  IF p_customer_id IS NULL OR length(trim(p_customer_id)) = 0 THEN
    RETURN;
  END IF;

  SELECT scl.user_id
    INTO v_user_id
  FROM public.stripe_customer_links scl
  WHERE scl.stripe_customer_id = p_customer_id
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT
    s.id,
    s.status,
    public._plus_period_end_as_timestamptz(s.current_period_end),
    COALESCE(s.livemode, true)
  INTO
    v_sub_id,
    v_status,
    v_period_end,
    v_livemode
  FROM stripe.subscriptions s
  WHERE s.customer = p_customer_id
  ORDER BY
    CASE
      WHEN s.status IN ('active', 'trialing') THEN 0
      ELSE 1
    END,
    public._plus_period_end_as_timestamptz(s.current_period_end) DESC NULLS LAST
  LIMIT 1;

  IF v_sub_id IS NULL THEN
    UPDATE public.plus_entitlements
    SET
      status = 'none',
      stripe_subscription_id = NULL,
      current_period_end = NULL,
      updated_at = now()
    WHERE user_id = v_user_id;
    RETURN;
  END IF;

  IF v_livemode IS DISTINCT FROM true THEN
    INSERT INTO public.plus_entitlements AS pe (
      user_id, stripe_customer_id, stripe_subscription_id, status, current_period_end, created_at, updated_at
    ) VALUES (
      v_user_id, p_customer_id, v_sub_id, 'none', v_period_end, now(), now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      stripe_customer_id = EXCLUDED.stripe_customer_id,
      stripe_subscription_id = EXCLUDED.stripe_subscription_id,
      status = 'none',
      current_period_end = EXCLUDED.current_period_end,
      updated_at = now();
    RETURN;
  END IF;

  INSERT INTO public.plus_entitlements AS pe (
    user_id,
    stripe_customer_id,
    stripe_subscription_id,
    status,
    current_period_end,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    p_customer_id,
    v_sub_id,
    COALESCE(v_status, 'none'),
    v_period_end,
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    stripe_customer_id = EXCLUDED.stripe_customer_id,
    stripe_subscription_id = EXCLUDED.stripe_subscription_id,
    status = EXCLUDED.status,
    current_period_end = EXCLUDED.current_period_end,
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.sync_plus_entitlement_for_customer(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_plus_entitlement_for_customer(text) TO service_role;

CREATE OR REPLACE FUNCTION public.sync_all_plus_entitlements()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, stripe, pg_temp
AS $$
DECLARE
  r record;
  n integer := 0;
BEGIN
  FOR r IN
    SELECT DISTINCT stripe_customer_id
    FROM public.stripe_customer_links
    WHERE stripe_customer_id IS NOT NULL
  LOOP
    PERFORM public.sync_plus_entitlement_for_customer(r.stripe_customer_id);
    n := n + 1;
  END LOOP;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_all_plus_entitlements() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_all_plus_entitlements() TO service_role;

CREATE OR REPLACE FUNCTION public.trg_sync_plus_entitlement_from_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, stripe, pg_temp
AS $$
DECLARE
  v_customer text;
BEGIN
  v_customer := COALESCE(NEW.customer, OLD.customer);
  IF v_customer IS NOT NULL THEN
    PERFORM public.sync_plus_entitlement_for_customer(v_customer);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_plus_entitlement_on_subscription ON stripe.subscriptions;
CREATE TRIGGER trg_plus_entitlement_on_subscription
  AFTER INSERT OR UPDATE OR DELETE
  ON stripe.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sync_plus_entitlement_from_subscription();

CREATE OR REPLACE FUNCTION public.trg_sync_plus_entitlement_from_customer_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, stripe, pg_temp
AS $$
BEGIN
  IF NEW.stripe_customer_id IS NOT NULL THEN
    PERFORM public.sync_plus_entitlement_for_customer(NEW.stripe_customer_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_plus_entitlement_on_customer_link ON public.stripe_customer_links;
CREATE TRIGGER trg_plus_entitlement_on_customer_link
  AFTER INSERT OR UPDATE OF stripe_customer_id
  ON public.stripe_customer_links
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sync_plus_entitlement_from_customer_link();

SELECT public.sync_all_plus_entitlements();
