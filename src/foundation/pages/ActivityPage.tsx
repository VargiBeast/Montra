import { PageHeader } from "../ui/PageHeader";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Button } from "../ui/Button";

/** New Activity / Transactions surface — independent implementation. */
export function ActivityPage() {
  return (
    <div>
      <PageHeader
        title="Activity"
        subtitle="Your transactions and history"
        action={
          <Button size="sm" onClick={() => { /* form milestone later */ }}>
            Add
          </Button>
        }
      />
      <Card>
        <EmptyState
          title="No transactions yet"
          description="When you add income or expenses they will appear here. Receipt capture and confirmation remain explicit."
          actionLabel="Add transaction"
          onAction={() => undefined}
        />
      </Card>
    </div>
  );
}
