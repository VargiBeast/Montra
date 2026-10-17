import { useAuth } from "../../hooks/useAuth";
import { useDisplayCurrency } from "../../lib/currency";
import { usePlusEntitlement } from "../../hooks/usePlusEntitlement";
import { Card } from "../ui/Card";
import { PageHeader } from "../ui/PageHeader";
import { Button } from "../ui/Button";
import { LoadingState } from "../ui/LoadingState";
import { useNavigate } from "react-router-dom";

/**
 * New Home — independent of the previous HomePage component hierarchy.
 * Wires verified contracts only: auth, currency, plus entitlement.
 * Balance and activity will be connected to transaction services in a later milestone.
 */
export function HomePage() {
  const auth = useAuth();
  const { currency, ratesReady } = useDisplayCurrency();
  const plus = usePlusEntitlement(auth.user?.id);
  const navigate = useNavigate();

  if (auth.isLoading) {
    return <LoadingState label="Restoring your session…" />;
  }

  const displayName =
    auth.user?.user_metadata?.full_name ??
    auth.user?.user_metadata?.name ??
    auth.user?.email?.split("@")[0] ??
    "there";

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${displayName}`}
        subtitle={ratesReady ? `Display currency: ${currency}` : "Loading rates…"}
        action={
          plus.hasPlus ? undefined : (
            <Button size="sm" variant="secondary" onClick={() => navigate("/app/plus")}>
              Get Plus
            </Button>
          )
        }
      />

      <Card
        padding="lg"
        style={{
          background: "linear-gradient(160deg, #0e1a14 0%, #0a120e 60%, #0d1511 100%)",
          borderColor: "rgba(16, 185, 129, 0.2)",
          marginBottom: "var(--m-space-4)",
        }}
      >
        <p style={{ margin: 0, fontSize: "var(--m-text-sm)", color: "var(--m-text-secondary)" }}>
          Total Balance
        </p>
        <p
          style={{
            margin: "8px 0 0",
            fontSize: "var(--m-text-4xl)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "var(--m-text)",
          }}
        >
          —
        </p>
        <p style={{ margin: "8px 0 0", fontSize: "var(--m-text-sm)", color: "var(--m-text-muted)" }}>
          Connected to live data in the next milestone
        </p>
      </Card>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "var(--m-space-3)",
          marginBottom: "var(--m-space-6)",
        }}
      >
        {[
          { label: "Add", path: "/app/activity" },
          { label: "Receipts", path: "/app/receipts" },
          { label: "Goals", path: "/app/goals" },
          { label: "More", path: "/app/more" },
        ].map((item) => (
          <Button
            key={item.path}
            variant="secondary"
            fullWidth
            onClick={() => navigate(item.path)}
            style={{ paddingBlock: 16 }}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: "var(--m-text-base)", fontWeight: 600 }}>Recent activity</h2>
          <button
            type="button"
            onClick={() => navigate("/app/activity")}
            style={{
              background: "none",
              border: "none",
              color: "var(--m-accent)",
              fontSize: "var(--m-text-sm)",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            See all
          </button>
        </div>
        <p style={{ margin: 0, color: "var(--m-text-muted)", fontSize: "var(--m-text-sm)" }}>
          Transaction list will appear here once the data layer is wired to the new shell.
        </p>
      </Card>
    </div>
  );
}
