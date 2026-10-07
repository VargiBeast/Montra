// Montra Plus — create Stripe Checkout Session (subscription + 7-day trial)
// Deploy: supabase functions deploy create-stripe-checkout
// JWT is verified inside the function via supabase.auth.getUser.
// Does NOT use service-role credentials.

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

function logError(
  step: string,
  err: unknown,
  extra?: Record<string, string | number | boolean | null | undefined>,
): void {
  const base: Record<string, unknown> = { step };
  if (err instanceof Error) {
    base.name = err.name;
    base.message = err.message;
  } else if (typeof err === "string") {
    base.message = err;
  } else if (err && typeof err === "object") {
    const o = err as Record<string, unknown>;
    if (typeof o.name === "string") base.name = o.name;
    if (typeof o.message === "string") base.message = o.message;
    if (typeof o.type === "string") base.stripe_type = o.type;
    if (typeof o.code === "string") base.stripe_code = o.code;
    if (typeof o.statusCode === "number") base.stripe_status = o.statusCode;
  } else {
    base.message = String(err);
  }
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v !== undefined) base[k] = v;
    }
  }
  console.error("checkout:", JSON.stringify(base));
}

function stripeModeFromSecret(secret: string): "live" | "test" | "unknown" {
  if (secret.startsWith("sk_live_")) return "live";
  if (secret.startsWith("sk_test_")) return "test";
  return "unknown";
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, origin);
  }

  let step = "init";

  try {
    step = "env";
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const publishableKey =
      Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ??
      Deno.env.get("SUPABASE_ANON_KEY") ??
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
      null;
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");

    if (!supabaseUrl || !publishableKey) {
      logError(step, "missing SUPABASE_URL or publishable key env");
      return jsonResponse(
        { error: "Unable to start checkout", code: "config_supabase" },
        500,
        origin,
      );
    }
    if (!stripeSecret) {
      logError(step, "missing STRIPE_SECRET_KEY");
      return jsonResponse(
        { error: "Unable to start checkout", code: "config_stripe" },
        500,
        origin,
      );
    }

    const stripeMode = stripeModeFromSecret(stripeSecret);

    step = "auth_header";
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Authentication required" }, 401, origin);
    }
    const jwt = authHeader.slice(7);

    step = "auth_get_user";
    const supabaseAuth = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser(jwt);

    if (userError || !user) {
      logError(step, userError ?? "no user", { has_user: !!user });
      return jsonResponse({ error: "Authentication required" }, 401, origin);
    }

    step = "parse_body";
    let body: { plan?: string };
    try {
      body = await req.json();
    } catch (parseErr) {
      logError(step, parseErr);
      return jsonResponse({ error: "Invalid request body" }, 400, origin);
    }

    step = "validate_plan";
    const plan =
      body?.plan === "yearly"
        ? "yearly"
        : body?.plan === "monthly"
          ? "monthly"
          : null;
    if (!plan) {
      logError(step, "invalid plan", { plan: body?.plan ?? null });
      return jsonResponse(
        { error: "Invalid plan", code: "invalid_plan" },
        400,
        origin,
      );
    }
    const priceId = PRICE_IDS[plan];

    step = "stripe_init";
    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2024-11-20.acacia",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabase = supabaseAuth;

    step = "customer_lookup";
    const { data: linkRow, error: linkError } = await supabase
      .from("stripe_customer_links")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (linkError) {
      logError(step, linkError, {
        code: linkError.code,
        details: linkError.details ?? null,
        hint: linkError.hint ?? null,
      });
      return jsonResponse(
        { error: "Unable to start checkout", code: "customer_lookup" },
        500,
        origin,
      );
    }

    let customerId: string | null = linkRow?.stripe_customer_id ?? null;

    if (!customerId) {
      step = "stripe_customer_create";
      try {
        const customer = await stripe.customers.create({
          email: user.email ?? undefined,
          metadata: { montra_user_id: user.id },
        });
        customerId = customer.id;

        step = "customer_link_upsert";
        const { error: upsertError } = await supabase
          .from("stripe_customer_links")
          .upsert(
            {
              user_id: user.id,
              stripe_customer_id: customerId,
            },
            { onConflict: "user_id" },
          );

        if (upsertError) {
          logError(step, upsertError, {
            code: upsertError.code,
            details: upsertError.details ?? null,
            hint: upsertError.hint ?? null,
          });
        }
      } catch (stripeErr: unknown) {
        const se = stripeErr as {
          type?: string;
          code?: string;
          message?: string;
          statusCode?: number;
        };
        logError(step, stripeErr, {
          stripe_type: se?.type ?? null,
          stripe_code: se?.code ?? null,
          stripe_status: se?.statusCode ?? null,
          stripe_mode: stripeMode,
        });
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

    step = "stripe_price_retrieve";
    try {
      const price = await stripe.prices.retrieve(priceId);
      if (!price || price.deleted) {
        logError(step, "price missing or deleted", {
          plan,
          stripe_mode: stripeMode,
        });
        return jsonResponse(
          {
            error: "Unable to start checkout",
            code: "stripe_price_missing",
            stripe_code: "resource_missing",
            stripe_mode: stripeMode,
          },
          502,
          origin,
        );
      }
      if (!price.active) {
        logError(step, "price inactive", { plan, stripe_mode: stripeMode });
        return jsonResponse(
          {
            error: "Unable to start checkout",
            code: "stripe_price_inactive",
            stripe_mode: stripeMode,
          },
          502,
          origin,
        );
      }
    } catch (priceErr: unknown) {
      const se = priceErr as {
        type?: string;
        code?: string;
        message?: string;
        statusCode?: number;
      };
      logError(step, priceErr, {
        stripe_type: se?.type ?? null,
        stripe_code: se?.code ?? null,
        stripe_status: se?.statusCode ?? null,
        plan,
        stripe_mode: stripeMode,
      });
      return jsonResponse(
        {
          error: "Unable to start checkout",
          code: "stripe_price",
          stripe_code: se?.code ?? null,
          stripe_mode: stripeMode,
        },
        502,
        origin,
      );
    }

    step = "stripe_session_create";
    try {
      // Hosted Checkout (Stripe Checkout Builder / hosted_web_0001).
      // Secret key from STRIPE_SECRET_KEY env only — never hardcode keys.
      // Real Price IDs / success / cancel URLs preserved (not Builder placeholders).
      // Do not hardcode payment_method_types — Stripe uses Dashboard-enabled methods.
      // automatic_tax requires Stripe Tax configured on the account.
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        // Builder export uses hosted_page; Stripe Sessions API accepts "hosted".
        ui_mode: "hosted",
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
        billing_address_collection: "auto",
        name_collection: {
          individual: {
            enabled: true,
            optional: false,
          },
        },
        phone_number_collection: {
          enabled: true,
        },
        payment_method_collection: "always",
        allow_promotion_codes: true,
        consent_collection: {
          terms_of_service: "required",
        },
        custom_text: {
          terms_of_service_acceptance: {
            message:
              "By starting your trial, you agree to our Terms of Service and Privacy Policy.",
          },
        },
        automatic_tax: {
          enabled: true,
        },
        submit_type: "auto",
        // Builder integration tags (stored as top-level when supported by API).
        integration_identifier: "hosted_web_0001",
        origin_context: "web",
      } as Stripe.Checkout.SessionCreateParams);

      if (!session.url) {
        logError(step, "session created without url", {
          session_id: session.id,
        });
        return jsonResponse(
          { error: "Unable to start checkout", code: "no_session_url" },
          502,
          origin,
        );
      }

      return jsonResponse({ url: session.url }, 200, origin);
    } catch (stripeErr: unknown) {
      const se = stripeErr as {
        type?: string;
        code?: string;
        message?: string;
        statusCode?: number;
      };
      logError(step, stripeErr, {
        stripe_type: se?.type ?? null,
        stripe_code: se?.code ?? null,
        stripe_status: se?.statusCode ?? null,
        plan,
        stripe_mode: stripeMode,
      });
      return jsonResponse(
        {
          error: "Unable to start checkout",
          code: "stripe_session",
          stripe_code: se?.code ?? null,
          stripe_mode: stripeMode,
        },
        502,
        origin,
      );
    }
  } catch (err: unknown) {
    logError(step, err);
    return jsonResponse(
      { error: "Unable to start checkout", code: "internal" },
      500,
      origin,
    );
  }
});
