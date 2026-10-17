import { PageHeader } from "../ui/PageHeader";
import { Card } from "../ui/Card";

/** New Analytics surface matching the reference dark/violet direction. */
export function AnalyticsPage() {
  return (
    <div>
      <PageHeader title="Analytics" subtitle="Spending overview and insights" />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "var(--m-space-4)",
        }}
      >
        <Card
          padding="lg"
          style={{
            minHeight: 180,
            background: "linear-gradient(160deg, #12101c 0%, #0e0c16 100%)",
            borderColor: "rgba(139, 92, 246, 0.2)",
          }}
        >
          <p style={{ margin: 0, fontSize: "var(--m-text-sm)", color: "var(--m-text-secondary)" }}>
            Spending Overview
          </p>
          <p style={{ margin: "12px 0 0", fontSize: "var(--m-text-3xl)", fontWeight: 700, color: "var(--m-violet)" }}>
            —
          </p>
          <p style={{ margin: "8px 0 0", fontSize: "var(--m-text-sm)", color: "var(--m-text-muted)" }}>
            Charts will connect to verified analytics helpers in a later milestone.
          </p>
        </Card>
        <Card padding="lg">
          <p style={{ margin: 0, fontSize: "var(--m-text-sm)", color: "var(--m-text-secondary)" }}>Categories</p>
          <p style={{ margin: "12px 0 0", color: "var(--m-text-muted)", fontSize: "var(--m-text-sm)" }}>
            Category breakdown placeholder.
          </p>
        </Card>
      </div>
    </div>
  );
}
