import { NavLink, Outlet, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../../hooks/useAuth";
import { usePlusEntitlement } from "../../hooks/usePlusEntitlement";

const navItems = [
  { to: "/app", end: true, label: "Home", icon: "⌂" },
  { to: "/app/activity", label: "Activity", icon: "☰" },
  { to: "/app/analytics", label: "Analytics", icon: "◔" },
  { to: "/app/goals", label: "Goals", icon: "◎" },
  { to: "/app/more", label: "More", icon: "⋯" },
] as const;

function NavItem({ to, end, label, icon }: { to: string; end?: boolean; label: string; icon: string }) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        padding: "8px 12px",
        borderRadius: "var(--m-radius-md)",
        color: isActive ? "var(--m-accent)" : "var(--m-text-muted)",
        textDecoration: "none",
        fontSize: "var(--m-text-xs)",
        fontWeight: isActive ? 600 : 500,
        transition: "color var(--m-duration)",
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

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100dvh",
        background: "var(--m-bg)",
      }}
    >
      {/* Desktop side navigation */}
      <aside
        style={{
          display: "none",
          width: "var(--m-side-width)",
          flexShrink: 0,
          borderRight: "1px solid var(--m-border)",
          background: "var(--m-bg-elevated)",
          padding: "var(--m-space-6) var(--m-space-3)",
          flexDirection: "column",
          gap: "var(--m-space-2)",
        }}
        className="m-side-nav"
      >
        <div
          style={{
            padding: "0 var(--m-space-3) var(--m-space-6)",
            fontWeight: 700,
            fontSize: "var(--m-text-lg)",
            letterSpacing: "-0.02em",
          }}
        >
          Montra
          {plus.hasPlus ? (
            <span
              style={{
                marginLeft: 8,
                fontSize: 11,
                fontWeight: 600,
                color: "var(--m-gold)",
                background: "var(--m-gold-soft)",
                padding: "2px 8px",
                borderRadius: "var(--m-radius-full)",
              }}
            >
              Plus
            </span>
          ) : null}
        </div>
        <SideNavItem to="/app" end label="Home" />
        <SideNavItem to="/app/activity" label="Activity" />
        <SideNavItem to="/app/analytics" label="Analytics" />
        <SideNavItem to="/app/goals" label="Goals" />
        <SideNavItem to="/app/wishlist" label="Wishlist" />
        <SideNavItem to="/app/recurring" label="Recurring" />
        <SideNavItem to="/app/more" label="More" />
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
          Sign out
        </button>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <main
          style={{
            flex: 1,
            padding: "var(--m-space-4)",
            paddingBottom: "calc(var(--m-nav-height) + var(--m-space-4))",
            maxWidth: "var(--m-content-max)",
            width: "100%",
            marginInline: "auto",
          }}
          className="m-main"
        >
          {children ?? <Outlet />}
        </main>

        {/* Mobile bottom navigation */}
        <nav
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
          className="m-bottom-nav"
          aria-label="Primary"
        >
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
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
