import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { PageHeader } from "../ui/PageHeader";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

const links = [
  { label: "Wishlist", path: "/app/wishlist" },
  { label: "Recurring payments", path: "/app/recurring" },
  { label: "Receipts", path: "/app/receipts" },
  { label: "Personalize", path: "/app/personalize" },
  { label: "Montra Plus", path: "/app/plus" },
  { label: "Profile & settings", path: "/app/profile" },
] as const;

export function MorePage() {
  const auth = useAuth();
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader title="More" subtitle="Tools and account" />
      <Card style={{ display: "flex", flexDirection: "column", gap: 4, padding: 8 }}>
        {links.map((item) => (
          <button
            key={item.path}
            type="button"
            onClick={() => navigate(item.path)}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "14px 12px",
              background: "transparent",
              border: "none",
              borderRadius: "var(--m-radius-md)",
              color: "var(--m-text)",
              fontSize: "var(--m-text-sm)",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {item.label}
          </button>
        ))}
      </Card>
      <div style={{ marginTop: "var(--m-space-6)" }}>
        <Button
          variant="ghost"
          fullWidth
          onClick={() => void auth.signOut().then(() => navigate("/login"))}
        >
          Sign out
        </Button>
      </div>
    </div>
  );
}
