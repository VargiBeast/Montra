import { useAuth } from "../../hooks/useAuth";
import { useRecurringPayments } from "../../hooks/useRecurringPayments";
import { useDisplayCurrency } from "../../lib/currency";
import { readLanguage } from "../../lib/i18n";
import { formatMoney, formatDate } from "../../lib/utils";
import type { RecurringPayment } from "../../types/recurringPayment";
import { PageHeader } from "../ui/PageHeader";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { LoadingState } from "../ui/LoadingState";
import { Button } from "../ui/Button";

function intervalLabel(interval: string): string {
  if (interval === "weekly") return "Weekly";
  if (interval === "yearly") return "Yearly";
  return "Monthly";
}

function RecurringRow({
  item,
  currency,
  convertFromBase,
}: {
  item: RecurringPayment;
  currency: string;
  convertFromBase: (amountInBase: number, toCurrency?: string) => number;
}) {
  const locale = readLanguage();
  const amountLabel = formatMoney(
    item.amount,
    currency,
    locale,
    convertFromBase(Number(item.amount), currency),
  );
  const isIn = item.type === "in";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 0",
        borderBottom: "1px solid var(--m-border)",
        opacity: item.active ? 1 : 0.55,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: "var(--m-text-sm)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.name}
          {!item.active ? (
            <span style={{ marginLeft: 8, fontSize: 11, color: "var(--m-text-muted)", fontWeight: 500 }}>
              Paused
            </span>
          ) : null}
        </div>
        <div style={{ fontSize: "var(--m-text-xs)", color: "var(--m-text-muted)", marginTop: 2 }}>
          {intervalLabel(item.interval)} · next {formatDate(item.next_due_date)}
          {" · "}
          {isIn ? "Income" : "Expense"}
        </div>
      </div>
      <div
        style={{
          fontWeight: 600,
          fontSize: "var(--m-text-sm)",
          color: isIn ? "var(--m-positive)" : "var(--m-text)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {amountLabel}
      </div>
    </div>
  );
}

/**
 * Planned / recurring payment definitions.
 * These do NOT automatically create transactions or change balances.
 */
export function RecurringPage() {
  const auth = useAuth();
  const { items, isLoading, error, refresh } = useRecurringPayments(auth.user?.id);
  const { currency, convertFromBase } = useDisplayCurrency();

  return (
    <div>
      <PageHeader
        title="Recurring"
        subtitle="Planned payments — not applied to balances until you record them"
      />

      {isLoading ? (
        <LoadingState label="Loading planned payments…" />
      ) : error ? (
        <Card>
          <div style={{ textAlign: "center", padding: "var(--m-space-6)" }}>
            <p role="alert" style={{ margin: "0 0 16px", color: "var(--m-negative)", fontSize: "var(--m-text-sm)" }}>
              {error}
            </p>
            <Button variant="secondary" onClick={() => void refresh()}>
              Try again
            </Button>
          </div>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            title="No planned payments"
            description="Recurring definitions stay separate from your journal. They never create transactions automatically."
          />
        </Card>
      ) : (
        <Card padding="md">
          <div role="list" aria-label="Recurring payments">
            {items.map((item) => (
              <div key={item.id} role="listitem">
                <RecurringRow item={item} currency={currency} convertFromBase={convertFromBase} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
