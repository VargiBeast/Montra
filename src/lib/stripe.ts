import { supabase } from './supabase';

export type PlusPlan = 'monthly' | 'yearly';

/** Calls create-stripe-checkout Edge Function with the contract it expects. */
export async function startPlusCheckout(
  plan: PlusPlan,
): Promise<{ url: string } | { error: string }> {
  if (!supabase) return { error: 'Supabase is not configured' };

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { error: 'You need to be signed in' };

  try {
    const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
      body: { plan },
    });

    if (error) {
      const msg = error.message || '';
      if (msg.includes('non-2xx') || msg.includes('FunctionsHttpError')) {
        const detail =
          data && typeof data === 'object' && 'error' in data
            ? String((data as { error?: string }).error)
            : null;
        return {
          error:
            detail ||
            'Checkout is not available right now. Please try again or contact support.',
        };
      }
      return { error: msg || 'Checkout failed' };
    }

    if (data?.url) return { url: data.url as string };
    if (data?.error) return { error: String(data.error) };
    return { error: 'Checkout did not return a URL' };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Checkout failed',
    };
  }
}
