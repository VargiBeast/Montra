import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { usePlusEntitlement } from "../../hooks/usePlusEntitlement";
import { PageHeader } from "../ui/PageHeader";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

const links = [
  { label: "Wishlist", path: "/app/wishlist", icon: "🎁", hint: "Items you want" },
  { label: "Recurring", path: "/app/recurring", icon: "↻", hint: "Subscriptions & bills" },
  { label: "Receipts", path: "/app/receipts", icon: "🧾", hint: "Scan & confirm" },
  { label: "Personalize", path: "/app/personalize", icon: "🎨", hint: "Themes & layout" },
  { label: "Montra Plus", path: "/app/plus", icon: "✦", hint: "Premium features" },
  { label: "Profile", path: "/app/profile", icon: "👤", hint: "Account & sign out" },
] as const;

export function MorePage() {
  const auth = useAuth();
  const plus = usePlusEntitlement(auth.user?.id);
  const navigate = useNavigate();

  return (
    <div className="m-anim-in">
      <PageHeader title="More" subtitle="Tools and account" />

      {plus.hasPlus ? (
        <Card
          className="m-anim-scale"
          style={{
            marginBottom: 16,
            background: "linear-gradient(135deg, rgba(232,197,71,0.12), rgba(16,185,129,0.08))",
            borderColor: "rgba(232,197,71,0.25)",
          }}
          padding="md"
        >
          <p style={{ margin: 0, fontWeight: 700, color: "var(--m-gold)" }}>Montra Plus active</p>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--m-text-secondary)" }}>
            Premium personalization and planning tools unlocked.
          </p>
        </Card>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12,
        }}
      >
        {links.map((item, i) => (
          <button
            key={item.path}
            type="button"
            className={`m-anim-in m-anim-delay-${Math.min(i + 1, 4)}`}
            onClick={() => navigate(item.path)}
            style={{
              textAlign: "left",
              padding: 16,
              borderRadius: 16,
              border: "1px solid var(--m-border)",
              background: "var(--m-bg-card)",
              cursor: "pointer",
              color: "var(--m-text)",
              transition: "transform 0.2s var(--m-ease), border-color 0.2s",
            }}
          >
            <span style={{ fontSize: 22, display: "block", marginBottom: 8 }} aria-hidden>
              {item.icon}
            </span>
            <span style={{ fontWeight: 600, fontSize: 14, display: "block" }}>{item.label}</span>
            <span style={{ fontSize: 11, color: "var(--m-text-muted)" }}>{item.hint}</span>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 28 }}>
        <Button variant="ghost" fullWidth onClick={() => void auth.signOut().then(() => navigate("/login"))}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
