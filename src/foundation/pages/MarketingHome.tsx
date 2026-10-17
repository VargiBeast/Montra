import { useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";

/** New public marketing home — matches reference onboarding visual direction. */
export function MarketingHome() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: "var(--m-space-6)",
        background: "radial-gradient(ellipse at 30% 20%, #1a2e22 0%, #070a08 50%, #050806 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "12%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(232,197,71,0.25) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div style={{ maxWidth: 400, marginInline: "auto", width: "100%" }}>
        <h1
          style={{
            margin: "0 0 12px",
            fontSize: "clamp(1.75rem, 5vw, 2.25rem)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.2,
          }}
        >
          Maintain Your Personal Finance, Made Simple
        </h1>
        <p style={{ margin: "0 0 28px", color: "var(--m-text-secondary)", fontSize: "var(--m-text-sm)", lineHeight: 1.55 }}>
          Track your money. Understand your money. Plan your money. Start by customizing your experience for smarter
          financial choices.
        </p>
        <Button fullWidth size="lg" onClick={() => navigate("/login")}>
          Start Now
        </Button>
        <p style={{ marginTop: 16, textAlign: "center", fontSize: "var(--m-text-xs)", color: "var(--m-text-muted)" }}>
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            style={{ background: "none", border: "none", color: "var(--m-accent)", cursor: "pointer", fontWeight: 500 }}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
