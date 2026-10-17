import { useNavigate } from "react-router-dom";

/** Onboarding / marketing — visual match to reference (gold coins, green glow CTA). */
export function MarketingHome() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: "32px 24px calc(32px + env(safe-area-inset-bottom, 0px))",
        background: "#050806",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Vertical light bars (reference) */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          right: "18%",
          bottom: "40%",
          width: 3,
          background: "linear-gradient(180deg, transparent, rgba(16,185,129,0.55), transparent)",
          boxShadow: "0 0 24px rgba(16,185,129,0.35)",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "8%",
          right: "22%",
          bottom: "45%",
          width: 2,
          background: "linear-gradient(180deg, transparent, rgba(16,185,129,0.25), transparent)",
        }}
      />

      {/* Gold coin cluster (CSS illustration) */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translateX(-58%)",
          width: 220,
          height: 220,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 24,
            left: 28,
            width: 150,
            height: 150,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 35% 30%, #f5e6a3 0%, #e8c547 35%, #c9a227 70%, #8a7018 100%)",
            boxShadow: "0 20px 60px rgba(232,197,71,0.35), inset -12px -16px 28px rgba(0,0,0,0.25)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: "rgba(90, 70, 10, 0.85)",
              textShadow: "0 1px 0 rgba(255,255,255,0.25)",
              lineHeight: 1,
            }}
          >
            $
          </span>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: 0,
            width: 72,
            height: 72,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 35% 30%, #f0d978 0%, #d4af37 50%, #a88720 100%)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <span style={{ fontSize: 28, fontWeight: 700, color: "rgba(70,55,8,0.8)" }}>$</span>
        </div>
      </div>

      <div style={{ position: "relative", maxWidth: 400, marginInline: "auto", width: "100%" }}>
        <h1
          style={{
            margin: "0 0 12px",
            fontSize: "clamp(1.85rem, 6vw, 2.35rem)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
            color: "#f5faf7",
          }}
        >
          Maintain Your Personal Finance, Made Simple
        </h1>
        <p
          style={{
            margin: "0 0 28px",
            color: "rgba(159,179,166,0.95)",
            fontSize: 14,
            lineHeight: 1.55,
          }}
        >
          Track your money. Understand your money. Plan your money. Start by customizing your experience for smarter
          financial choices.
        </p>
        <button
          type="button"
          onClick={() => navigate("/login")}
          style={{
            width: "100%",
            padding: "16px 24px",
            border: "none",
            borderRadius: 9999,
            fontSize: 16,
            fontWeight: 600,
            color: "#04110a",
            cursor: "pointer",
            background: "linear-gradient(135deg, #34d399 0%, #10b981 45%, #059669 100%)",
            boxShadow: "0 0 32px rgba(16,185,129,0.45), 0 8px 24px rgba(0,0,0,0.35)",
          }}
        >
          Start Now
        </button>
        <p style={{ marginTop: 16, textAlign: "center", fontSize: 12, color: "#6b7f72" }}>
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            style={{
              background: "none",
              border: "none",
              color: "#10b981",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
