import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  children: ReactNode;
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: {
    background: "linear-gradient(135deg, var(--m-accent) 0%, var(--m-accent-strong) 100%)",
    color: "#04110a",
    border: "none",
    boxShadow: "0 4px 16px var(--m-accent-glow)",
  },
  secondary: {
    background: "var(--m-bg-card)",
    color: "var(--m-text)",
    border: "1px solid var(--m-border-strong)",
  },
  ghost: {
    background: "transparent",
    color: "var(--m-text-secondary)",
    border: "1px solid transparent",
  },
  danger: {
    background: "rgba(248, 113, 113, 0.12)",
    color: "var(--m-negative)",
    border: "1px solid rgba(248, 113, 113, 0.25)",
  },
};

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { padding: "6px 12px", fontSize: "var(--m-text-sm)", borderRadius: "var(--m-radius-sm)" },
  md: { padding: "10px 18px", fontSize: "var(--m-text-sm)", borderRadius: "var(--m-radius-md)" },
  lg: { padding: "14px 24px", fontSize: "var(--m-text-base)", borderRadius: "var(--m-radius-lg)" },
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  children,
  style,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: `transform var(--m-duration) var(--m-ease), opacity var(--m-duration)`,
        width: fullWidth ? "100%" : undefined,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
