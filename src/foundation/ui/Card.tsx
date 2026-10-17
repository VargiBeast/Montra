import type { CSSProperties, ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
  padding?: "sm" | "md" | "lg";
  style?: CSSProperties;
  className?: string;
}

const paddingMap = {
  sm: "var(--m-space-3)",
  md: "var(--m-space-4)",
  lg: "var(--m-space-6)",
};

export function Card({ children, padding = "md", style, className }: CardProps) {
  return (
    <div
      className={className}
      style={{
        background: "var(--m-bg-card)",
        border: "1px solid var(--m-border)",
        borderRadius: "var(--m-radius-lg)",
        padding: paddingMap[padding],
        boxShadow: "var(--m-shadow-sm)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
