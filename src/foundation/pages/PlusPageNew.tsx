import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { usePlusEntitlement } from "../../hooks/usePlusEntitlement";
import { useStripePortal } from "../../hooks/useStripePortal";
import { PLUS_PRICING } from "../../lib/plus";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";
import { PageHeader } from "../ui/PageHeader";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { LoadingState } from "../ui/LoadingState";

type Plan = "monthly" | "yearly";

export function PlusPageNew() {
  const auth = useAuth();
  const plus = usePlusEntitlement(auth.user?.id);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [plan, setPlan] = useState<Plan>("yearly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<"success" | "cancelled" | null>(null);

  const { openPortal, portalLoading, portalError } = useStripePortal(auth.user, (k) => k);

  useEffect(() => {
    if (portalError) setError(portalError);
  }, [portalError]);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      setStatusMsg("success");
      const next = new URLSearchParams(searchParams);
      next.delete("checkout");
      setSearchParams(next, { replace: true });
      void plus.refresh();
    } else if (checkout === "cancelled") {
      setStatusMsg("cancelled");
      const next = new URLSearchParams(searchParams);
      next.delete("checkout");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, plus]);

  const startCheckout = useCallback(async () => {
    if (loading) return;
    setError(null);
    if (!auth.user) {
      navigate("/login", { state: { from: "/app/plus" } });
      return;
    }
    if (!isSupabaseConfigured || !supabase) {
      setError("Checkout is unavailable right now.");
      return;
    }
    setLoading(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("create-stripe-checkout", {
        body: { plan },
      });
      if (invokeError) {
        setError("Could not start checkout. Try again.");
        setLoading(false);
        return;
      }
      const url = (data as { url?: string } | null)?.url;
      if (typeof url === "string" && url.startsWith("https://")) {
        window.location.href = url;
        return;
      }
      setError("Could not start checkout. Try again.");
      setLoading(false);
    } catch {
      setError("Could not start checkout. Try again.");
      setLoading(false);
    }
  }, [auth.user, loading, navigate, plan]);

  if (auth.isLoading || plus.isLoading) return <LoadingState label="Loading Plus…" />;

  const features = [
    "Deeper analytics and insights",
    "Advanced planning tools",
    "Themes and Home personalization",
    "Priority product improvements",
  ];

  return (
    <div className="m-anim-in">
      <PageHeader title="Montra Plus" subtitle={plus.hasPlus ? "Your subscription is active" : "Unlock the full toolkit"} />

      {statusMsg === "success" && !plus.hasPlus ? (
        <Card style={{ marginBottom: 16, borderColor: "rgba(52,211,153,0.3)" }}>
          <p style={{ margin: 0, color: "var(--m-positive)", fontSize: 14 }}>
            Payment received. Plus unlocks when the server confirms your entitlement.
          </p>
        </Card>
      ) : null}
      {statusMsg === "cancelled" ? (
        <Card style={{ marginBottom: 16 }}>
          <p style={{ margin: 0, color: "var(--m-text-muted)", fontSize: 14 }}>Checkout cancelled.</p>
        </Card>
      ) : null}

      <Card
        padding="lg"
        className="m-anim-scale"
        style={{
          marginBottom: 16,
          background: "linear-gradient(160deg, #0e1a14, #0a120e)",
          borderColor: "rgba(16,185,129,0.25)",
        }}
      >
        {plus.hasPlus ? (
          <>
            <p style={{ margin: 0, fontWeight: 700, color: "var(--m-gold)" }}>Plus active</p>
            <p style={{ margin: "8px 0 16px", fontSize: 13, color: "var(--m-text-secondary)" }}>
              Manage billing in the Stripe customer portal.
            </p>
            <Button onClick={openPortal} disabled={portalLoading}>
              {portalLoading ? "Opening…" : "Manage subscription"}
            </Button>
          </>
        ) : (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => setPlan("monthly")}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 12,
                  border: plan === "monthly" ? "1px solid var(--m-accent)" : "1px solid var(--m-border)",
                  background: plan === "monthly" ? "var(--m-accent-soft)" : "transparent",
                  color: "var(--m-text)",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {PLUS_PRICING.monthlyLabel}
                <span style={{ display: "block", fontSize: 11, opacity: 0.7 }}>Monthly</span>
              </button>
              <button
                type="button"
                onClick={() => setPlan("yearly")}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 12,
                  border: plan === "yearly" ? "1px solid var(--m-accent)" : "1px solid var(--m-border)",
                  background: plan === "yearly" ? "var(--m-accent-soft)" : "transparent",
                  color: "var(--m-text)",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {PLUS_PRICING.yearlyLabel}
                <span style={{ display: "block", fontSize: 11, opacity: 0.7 }}>Yearly</span>
              </button>
            </div>
            <ul style={{ margin: "0 0 16px", padding: 0, listStyle: "none" }}>
              {features.map((f) => (
                <li key={f} style={{ padding: "6px 0", fontSize: 14, color: "var(--m-text-secondary)" }}>
                  <span style={{ color: "var(--m-positive)", marginRight: 8 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Button fullWidth onClick={() => void startCheckout()} disabled={loading}>
              {loading ? "Starting…" : !auth.user ? "Sign in to upgrade" : "Start Plus"}
            </Button>
            {error ? (
              <p role="alert" style={{ margin: "12px 0 0", color: "var(--m-negative)", fontSize: 13 }}>
                {error}
              </p>
            ) : null}
          </>
        )}
      </Card>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button variant="secondary" size="sm" onClick={() => navigate("/app/personalize")}>
          Personalize
        </Button>
        <Button variant="ghost" size="sm" onClick={() => navigate("/app/analytics")}>
          Analytics
        </Button>
      </div>
    </div>
  );
}
