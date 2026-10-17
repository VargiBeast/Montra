import { PageHeader } from "../ui/PageHeader";
import { Card } from "../ui/Card";

export function PlaceholderPage({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />
      <Card>
        <p style={{ margin: 0, color: "var(--m-text-secondary)", fontSize: "var(--m-text-sm)" }}>
          This screen is part of the new foundation. Full feature implementation follows in subsequent milestones.
          Backend contracts and data remain unchanged.
        </p>
      </Card>
    </div>
  );
}
