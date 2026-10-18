import { NavLink, Outlet, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../../hooks/useAuth";
import { usePlusEntitlement } from "../../hooks/usePlusEntitlement";
import { useTranslation } from "../../lib/i18n";

function BottomNavItem({
  to,
  end,
  label,
  icon,
}: {
  to: string;
  end?: boolean;
  label: string;
  icon: string;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        padding: "6px 8px",
        borderRadius: "var(--m-radius-md)",
        color: isActive ? "var(--m-accent)" : "var(--m-text-muted)",
        textDecoration: "none",
        fontSize: 10,
        fontWeight: isActive ? 600 : 500,
        minWidth: 52,
      })}
    >
      <span style={{ fontSize: 18, lineHeight: 1 }} aria-hidden>
        {icon}
      </span>
      {label}
    </NavLink>
  );
}

function SideNavItem({ to, end, label }: { to: string; end?: boolean; label: string }) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        borderRadius: "var(--m-radius-md)",
        color: isActive ? "var(--m-text)" : "var(--m-text-secondary)",
        background: isActive ? "var(--m-accent-soft)" : "transparent",
        textDecoration: "none",
        fontSize: "var(--m-text-sm)",
        fontWeight: isActive ? 600 : 500,
      })}
    >
      {label}
    </NavLink>
  );
}

export function AppShell({ children }: { children?: ReactNode }) {
  const auth = useAuth();
  const plus = usePlusEntitlement(auth.user?.id);
  const navigate = useNavigate();
  const t = useTranslation();

  const label = (key: string, fallback: string) => {
    const v = t(key);
    return v && v !== "—" && v !== key ? v : fallback;
  };

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: "var(--m-bg)" }}>
      <aside
        className="m-side-nav"
        style={{
          display: "none",
          width: "var(--m-side-width)",
          flexShrink: 0,
          borderRight: "1px solid var(--m-border)",
          background: "var(--m-bg-elevated)",
          padding: "var(--m-space-4)",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div style={{ padding: "8px 14px 20px", display: "flex", alignItems: "center", gap: 8 }}>
          <strong style={{ letterSpacing: "0.04em" }}>MONTRA</strong>
          {plus.hasPlus ? (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--m-gold)",
                background: "rgba(232,197,71,0.12)",
                padding: "2px 8px",
                borderRadius: 99,
              }}
            >
              Plus
            </span>
          ) : null}
        </div>
        <SideNavItem to="/app" end label={label("navHome", "Home")} />
        <SideNavItem to="/app/activity" label={label("navActivity", "Activity")} />
        <SideNavItem to="/app/receipts" label={label("navReceipts", "Receipts")} />
        <SideNavItem to="/app/analytics" label={label("navAnalytics", "Analytics")} />
        <SideNavItem to="/app/goals" label={label("navGoals", "Goals")} />
        <SideNavItem to="/app/wishlist" label={label("navWishlist", "Wishlist")} />
        <SideNavItem to="/app/recurring" label={label("navRecurring", "Recurring")} />
        <SideNavItem to="/app/more" label={label("navMore", "More")} />
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={() => void auth.signOut().then(() => navigate("/login"))}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--m-text-muted)",
            padding: "10px 14px",
            textAlign: "left",
            cursor: "pointer",
            fontSize: "var(--m-text-sm)",
          }}
        >
          {label("navSignOut", "Sign out")}
        </button>
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <main
          className="m-main"
          style={{
            flex: 1,
            padding: "var(--m-space-4)",
            paddingBottom: "calc(var(--m-nav-height) + var(--m-space-4))",
            maxWidth: "var(--m-content-max)",
            width: "100%",
            marginInline: "auto",
          }}
        >
          {children ?? <Outlet />}
        </main>

        <nav
          className="m-bottom-nav"
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            height: "var(--m-nav-height)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            background: "rgba(7, 10, 8, 0.92)",
            backdropFilter: "blur(16px)",
            borderTop: "1px solid var(--m-border)",
            zIndex: 40,
            paddingBottom: "env(safe-area-inset-bottom, 0)",
          }}
          aria-label={label("mainNavigation", "Primary")}
        >
          <BottomNavItem to="/app" end label={label("navHome", "Home")} icon="⌂" />
          <BottomNavItem to="/app/activity" label={label("navActivity", "Activity")} icon="☰" />
          <button
            type="button"
            aria-label={label("navAddTransaction", "Add")}
            onClick={() => navigate("/app/activity", { state: { openCreate: true } })}
            style={{
              width: 52,
              height: 52,
              marginTop: -18,
              borderRadius: "50%",
              border: "none",
              background: "linear-gradient(135deg, #34d399, #059669)",
              color: "#04110a",
              fontSize: 28,
              fontWeight: 600,
              boxShadow: "0 4px 20px rgba(16,185,129,0.4)",
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
              lineHeight: 1,
            }}
          >
            +
          </button>
          <BottomNavItem to="/app/receipts" label={label("navReceipts", "Receipts")} icon="◫" />
          <BottomNavItem to="/app/more" label={label("navMore", "More")} icon="⋯" />
        </nav>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .m-side-nav { display: flex !important; }
          .m-bottom-nav { display: none !important; }
          .m-main { padding-bottom: var(--m-space-6) !important; }
        }
      `}</style>
    </div>
  );
}
