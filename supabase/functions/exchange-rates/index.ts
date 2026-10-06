// Montra — proxy Frankfurter exchange rates (server-side, CORS-safe)
// Deploy: supabase functions deploy exchange-rates --no-verify-jwt
// Public rates only; no secrets, no service-role.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ALLOWED_ORIGINS = new Set([
  "https://montra.cash",
  "https://www.montra.cash",
  "http://localhost:5000",
  "http://127.0.0.1:5000",
]);

const FRANKFURTER_URL = "https://api.frankfurter.app/latest?from=NOK";

function corsHeaders(origin: string | null): HeadersInit {
  const allowed =
    origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://montra.cash";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    Vary: "Origin",
    "Cache-Control": "public, max-age=3600",
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

  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405, origin);
  }

  try {
    const upstream = await fetch(FRANKFURTER_URL, {
      headers: { Accept: "application/json" },
    });
    if (!upstream.ok) {
      console.error("exchange-rates: frankfurter status", upstream.status);
      return jsonResponse(
        { error: "Upstream rates unavailable", code: "upstream" },
        502,
        origin,
      );
    }
    const data = (await upstream.json()) as {
      base?: string;
      date?: string;
      rates?: Record<string, number>;
    };
    if (!data?.rates || typeof data.rates !== "object") {
      return jsonResponse(
        { error: "Invalid upstream payload", code: "bad_payload" },
        502,
        origin,
      );
    }
    const rates = { ...data.rates, NOK: 1 };
    return jsonResponse(
      {
        base: data.base ?? "NOK",
        date: data.date ?? null,
        rates,
      },
      200,
      origin,
    );
  } catch (err) {
    console.error(
      "exchange-rates:",
      err instanceof Error ? err.message : String(err),
    );
    return jsonResponse(
      { error: "Unable to fetch rates", code: "internal" },
      500,
      origin,
    );
  }
});
