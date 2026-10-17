import type { ReactNode } from "react";
import { Button } from "./Button";

export interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}

export function EmptyState({ title, description, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "var(--m-space-10) var(--m-space-4)",
        gap: "var(--m-space-3)",
      }}
    >
      {icon ? (
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "var(--m-radius-full)",
            background: "var(--m-accent-soft)",
            display: "grid",
            placeItems: "center",
            color: "var(--m-accent)",
            marginBottom: "var(--m-space-2)",
          }}
        >
          {icon}
        </div>
      ) : null}
      <h2 style={{ margin: 0, fontSize: "var(--m-text-lg)", fontWeight: 600 }}>{title}</h2>
      {description ? (
        <p style={{ margin: 0, maxWidth: 320, color: "var(--m-text-secondary)", fontSize: "var(--m-text-sm)" }}>
          {description}
        </p>
      ) : null}
      {actionLabel && onAction ? (
        <div style={{ marginTop: "var(--m-space-3)" }}>
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      ) : null}
    </div>
  );
}
