import type { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "var(--m-space-4)",
        marginBottom: "var(--m-space-6)",
      }}
    >
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: "var(--m-text-2xl)",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--m-text)",
          }}
        >
          {title}
        </h1>
        {subtitle ? (
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "var(--m-text-sm)",
              color: "var(--m-text-secondary)",
            }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div style={{ flexShrink: 0 }}>{action}</div> : null}
    </header>
  );
}
