// Montra Plus — create Stripe Checkout Session (subscription + 7-day trial)
// Deploy: supabase functions deploy create-stripe-checkout
// (JWT is verified inside the function via supabase.auth.getUser)

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";

const ALLOWED_ORIGINS = new Set([
  "https://montra.cash",
  "https://www.montra.cash",
]);

const PRICE_IDS: Record<string, string> = {
  monthly: "price_1UNWoLPoFbr8ckzNvSQANDDz",
  yearly: "price_1UNWoLPoFbr8ckzNjxOSUmSY",
};

const SUCCESS_URL = "https://montra.cash/plus?checkout=success";
const CANCEL_URL = "https://montra.cash/plus?checkout=cancelled";

function corsHeaders(origin: string | null): HeadersInit {
  const allowed =
    origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://montra.cash";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function jsonResponse(
  body: unknown,
  status: number,
  origin: string | null,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, origin);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    // Prefer service role for server-side customer mapping writes; fall back to publishable + user JWT for auth only
    const serviceRoleKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
      Deno.env.get("SUPABASE_SERVICE_ROLE") ??
      null;
    const publishableKey =
      Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ??
      Deno.env.get("SUPABASE_ANON_KEY") ??
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
      null;
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");

    if (!supabaseUrl || !publishableKey) {
      console.error("checkout: missing SUPABASE_URL or publishable key env");
      return jsonResponse(
        { error: "Unable to start checkout", code: "config_supabase" },
        500,
        origin,
      );
    }
    if (!stripeSecret) {
      console.error("checkout: missing STRIPE_SECRET_KEY");
      return jsonResponse(
        { error: "Unable to start checkout", code: "config_stripe" },
        500,
        origin,
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Authentication required" }, 401, origin);
    }
    const jwt = authHeader.slice(7);

    // Authenticate user with the user's JWT (never trust client for identity)
    const supabaseAuth = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser(jwt);

    if (userError || !user) {
      console.error("checkout: auth failed", userError?.message ?? "no user");
      return jsonResponse({ error: "Authentication required" }, 401, origin);
    }

    let body: { plan?: string };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid request body" }, 400, origin);
    }

    const plan = body?.plan === "yearly" ? "yearly" : body?.plan === "monthly" ? "monthly" : null;
    if (!plan) {
      return jsonResponse({ error: "Invalid plan", code: "invalid_plan" }, 400, origin);
    }
    const priceId = PRICE_IDS[plan];

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2024-11-20.acacia",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Admin client for stripe_customer_links (RLS may block user-level writes)
    const supabaseAdmin = serviceRoleKey
      ? createClient(supabaseUrl, serviceRoleKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : supabaseAuth;

    // Lookup existing Stripe customer mapping
    const { data: linkRow, error: linkError } = await supabaseAdmin
      .from("stripe_customer_links")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (linkError) {
      console.error("checkout: stripe_customer_links read failed", linkError.code, linkError.message);
      return jsonResponse(
        { error: "Unable to start checkout", code: "customer_lookup" },
        500,
        origin,
      );
    }

    let customerId: string | null = linkRow?.stripe_customer_id ?? null;

    if (!customerId) {
      try {
        const customer = await stripe.customers.create({
          email: user.email ?? undefined,
          metadata: { montra_user_id: user.id },
        });
        customerId = customer.id;

        const { error: upsertError } = await supabaseAdmin
          .from("stripe_customer_links")
          .upsert(
            {
              user_id: user.id,
              stripe_customer_id: customerId,
            },
            { onConflict: "user_id" },
          );

        if (upsertError) {
          console.error(
            "checkout: stripe_customer_links upsert failed",
            upsertError.code,
            upsertError.message,
          );
          // Continue with customer id even if mapping write fails — session can still open
        }
      } catch (stripeErr: unknown) {
        const se = stripeErr as { type?: string; code?: string; message?: string; statusCode?: number };
        console.error(
          "checkout: stripe customer create failed",
          se?.type,
          se?.code,
          se?.statusCode,
        );
        return jsonResponse(
          {
            error: "Unable to start checkout",
            code: "stripe_customer",
            stripe_code: se?.code ?? null,
          },
          502,
          origin,
        );
      }
    }

    try {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId!,
        line_items: [{ price: priceId, quantity: 1 }],
        subscription_data: {
          trial_period_days: 7,
          metadata: { montra_user_id: user.id, montra_plan: plan },
        },
        success_url: SUCCESS_URL,
        cancel_url: CANCEL_URL,
        client_reference_id: user.id,
        metadata: { montra_user_id: user.id, montra_plan: plan },
      });

      if (!session.url) {
        console.error("checkout: session created without url", session.id);
        return jsonResponse(
          { error: "Unable to start checkout", code: "no_session_url" },
          502,
          origin,
        );
      }

      return jsonResponse({ url: session.url }, 200, origin);
    } catch (stripeErr: unknown) {
      const se = stripeErr as { type?: string; code?: string; message?: string; statusCode?: number };
      console.error(
        "checkout: stripe session create failed",
        se?.type,
        se?.code,
        se?.statusCode,
      );
      return jsonResponse(
        {
          error: "Unable to start checkout",
          code: "stripe_session",
          stripe_code: se?.code ?? null,
        },
        502,
        origin,
      );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("checkout: unhandled", message);
    return jsonResponse(
      { error: "Unable to start checkout", code: "internal" },
      500,
      origin,
    );
  }
});
