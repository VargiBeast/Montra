import { supabase } from './supabase';

export type PlusInterval = 'month' | 'year';

/** Calls the existing create-stripe-checkout Edge Function. */
export async function startPlusCheckout(interval: PlusInterval): Promise<{ url: string } | { error: string }> {
  if (!supabase) return { error: 'Supabase not configured' };

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: 'Not signed in' };

  const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
    body: {
      interval,
      success_url: `${window.location.origin}/plus?checkout=success`,
      cancel_url: `${window.location.origin}/plus?checkout=cancelled`,
    },
  });

  if (error) return { error: error.message };
  if (data?.url) return { url: data.url };
  return { error: data?.error || 'Checkout failed' };
}
