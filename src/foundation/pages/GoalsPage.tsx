import { PageHeader } from "../ui/PageHeader";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";

export function GoalsPage() {
  return (
    <div>
      <PageHeader title="Savings goals" subtitle="Track progress toward what matters" />
      <Card>
        <EmptyState
          title="No goals yet"
          description="Create a savings goal to start tracking progress. Existing goal data remains in Supabase."
        />
      </Card>
    </div>
  );
}
