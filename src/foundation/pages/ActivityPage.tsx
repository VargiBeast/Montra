import { useAuth } from "../../hooks/useAuth";
import { useTransactions } from "../../hooks/useTransactions";
import { useDisplayCurrency } from "../../lib/currency";
import { readLanguage } from "../../lib/i18n";
import { formatDate, formatMoney } from "../../lib/utils";
import type { Transaction } from "../../types/transaction";
import { PageHeader } from "../ui/PageHeader";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { LoadingState } from "../ui/LoadingState";
import { Button } from "../ui/Button";

function TransactionRow({ tx, currency, convertFromBase }: {
  tx: Transaction;
  currency: string;
  convertFromBase: (amountInBase: number, toCurrency?: string) => number;
}) {
  const isIn = tx.type === "in";
  const locale = readLanguage();
  const displayAmount = convertFromBase(Number(tx.amount), currency);
  const amountLabel = formatMoney(Number(tx.amount), currency, locale, displayAmount);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 0",
        borderBottom: "1px solid var(--m-border)",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "var(--m-radius-full)",
          background: isIn ? "rgba(52, 211, 153, 0.12)" : "rgba(248, 113, 113, 0.1)",
          color: isIn ? "var(--m-positive)" : "var(--m-negative)",
          display: "grid",
          placeItems: "center",
          fontSize: 14,
          fontWeight: 700,
          flexShrink: 0,
        }}
        aria-hidden
      >
        {isIn ? "↓" : "↑"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: "var(--m-text-sm)",
            color: "var(--m-text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {tx.name}
        </div>
        <div style={{ fontSize: "var(--m-text-xs)", color: "var(--m-text-muted)", marginTop: 2 }}>
          {formatDate(tx.date)}
          {tx.method ? ` · ${tx.method}` : ""}
          {" · "}
          {isIn ? "Received" : "Sent"}
        </div>
      </div>
      <div
        style={{
          fontWeight: 600,
          fontSize: "var(--m-text-sm)",
          color: isIn ? "var(--m-positive)" : "var(--m-text)",
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
        }}
      >
        {isIn ? "+" : "−"}{amountLabel.replace(/^[^\d-]*/, "")}
      </div>
    </div>
  );
}

/**
 * Real Activity page — uses verified useTransactions + transaction service.
 * Data is RLS-scoped to the authenticated user. No fabricated rows.
 */
export function ActivityPage() {
  const auth = useAuth();
  const { transactions, isLoading, error, refresh } = useTransactions(auth.user?.id);
  const { currency, convertFromBase, ratesReady } = useDisplayCurrency();

  return (
    <div>
      <PageHeader
        title="Activity"
        subtitle="Your transactions and history"
      />

      {isLoading ? (
        <LoadingState label="Loading your transactions…" />
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
      ) : transactions.length === 0 ? (
        <Card>
          <EmptyState
            title="No transactions yet"
            description="When you add income or expenses they will appear here. Nothing is created automatically."
          />
        </Card>
      ) : (
        <Card padding="md">
          {!ratesReady ? (
            <p style={{ margin: "0 0 8px", fontSize: "var(--m-text-xs)", color: "var(--m-text-muted)" }}>
              Using fallback exchange rates until live rates load.
            </p>
          ) : null}
          <div role="list" aria-label="Transactions">
            {transactions.map((tx) => (
              <div key={tx.id} role="listitem">
                <TransactionRow
                  tx={tx}
                  currency={currency}
                  convertFromBase={convertFromBase}
                />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
