import { supabase } from './supabase';

export type PlusInterval = 'month' | 'year';

/** Calls the existing create-stripe-checkout Edge Function. */
export async function startPlusCheckout(
  interval: PlusInterval,
): Promise<{ url: string } | { error: string }> {
  if (!supabase) return { error: 'Supabase is not configured' };

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { error: 'You need to be signed in' };

  try {
    const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
      body: {
        interval,
        success_url: `${window.location.origin}/plus?checkout=success`,
        cancel_url: `${window.location.origin}/plus?checkout=cancelled`,
      },
    });

    if (error) {
      // Surface a clearer message for common Edge Function failures
      const msg = error.message || '';
      if (msg.includes('non-2xx') || msg.includes('FunctionsHttpError')) {
        return {
          error:
            'Checkout is not available right now. Stripe may not be fully configured for this environment.',
        };
      }
      return { error: msg || 'Checkout failed' };
    }

    if (data?.url) return { url: data.url };
    if (data?.error) return { error: String(data.error) };
    return { error: 'Checkout did not return a URL' };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Checkout failed',
    };
  }
}
