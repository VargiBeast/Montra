import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTransactions } from "../../hooks/useTransactions";
import { usePlusEntitlement } from "../../hooks/usePlusEntitlement";
import { useDisplayCurrency } from "../../lib/currency";
import { readLanguage } from "../../lib/i18n";
import { formatMoney, formatDate, getBalanceSummary } from "../../lib/utils";
import type { Transaction } from "../../types/transaction";
import { Card } from "../ui/Card";
import { PageHeader } from "../ui/PageHeader";
import { Button } from "../ui/Button";
import { LoadingState } from "../ui/LoadingState";

function RecentRow({
  tx,
  currency,
  convertFromBase,
}: {
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
        padding: "10px 0",
        borderBottom: "1px solid var(--m-border)",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "var(--m-radius-full)",
          background: isIn ? "rgba(52, 211, 153, 0.12)" : "rgba(248, 113, 113, 0.1)",
          color: isIn ? "var(--m-positive)" : "var(--m-negative)",
          display: "grid",
          placeItems: "center",
          fontSize: 12,
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
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {tx.name}
        </div>
        <div style={{ fontSize: "var(--m-text-xs)", color: "var(--m-text-muted)" }}>
          {formatDate(tx.date)}
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
        {isIn ? "+" : "−"}
        {amountLabel.replace(/^[^\d-]*/, "")}
      </div>
    </div>
  );
}

/**
 * New Home — truthful financial summary from real user transactions only.
 * Balance = totalIn − totalOut (journal net), not a bank connection.
 * No fabricated numbers; empty state when there is no data.
 */
export function HomePage() {
  const auth = useAuth();
  const { transactions, isLoading, error, refresh } = useTransactions(auth.user?.id);
  const { currency, convertFromBase, ratesReady } = useDisplayCurrency();
  const plus = usePlusEntitlement(auth.user?.id);
  const navigate = useNavigate();
  const locale = readLanguage();

  const summary = useMemo(() => getBalanceSummary(transactions), [transactions]);
  const recent = useMemo(() => transactions.slice(0, 5), [transactions]);

  if (auth.isLoading) {
    return <LoadingState label="Restoring your session…" />;
  }

  const displayName =
    auth.user?.user_metadata?.full_name ??
    auth.user?.user_metadata?.name ??
    auth.user?.email?.split("@")[0] ??
    "there";

  const hasData = transactions.length > 0;
  const balanceDisplay = hasData
    ? formatMoney(summary.balance, currency, locale, convertFromBase(summary.balance, currency))
    : null;

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${displayName}`}
        subtitle={ratesReady ? `Display currency: ${currency}` : "Loading rates…"}
        action={
          plus.hasPlus ? undefined : (
            <Button size="sm" variant="secondary" onClick={() => navigate("/app/plus")}>
              Get Plus
            </Button>
          )
        }
      />

      <Card
        padding="lg"
        style={{
          background: "linear-gradient(160deg, #0e1a14 0%, #0a120e 60%, #0d1511 100%)",
          borderColor: "rgba(16, 185, 129, 0.2)",
          marginBottom: "var(--m-space-4)",
        }}
      >
        <p style={{ margin: 0, fontSize: "var(--m-text-sm)", color: "var(--m-text-secondary)" }}>
          Journal balance
        </p>
        {isLoading ? (
          <p style={{ margin: "12px 0 0", color: "var(--m-text-muted)", fontSize: "var(--m-text-sm)" }}>
            Loading…
          </p>
        ) : error ? (
          <div style={{ marginTop: 12 }}>
            <p role="alert" style={{ margin: 0, color: "var(--m-negative)", fontSize: "var(--m-text-sm)" }}>
              {error}
            </p>
            <Button size="sm" variant="ghost" onClick={() => void refresh()} style={{ marginTop: 8 }}>
              Retry
            </Button>
          </div>
        ) : hasData ? (
          <>
            <p
              style={{
                margin: "8px 0 0",
                fontSize: "var(--m-text-4xl)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "var(--m-text)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {balanceDisplay}
            </p>
            <p style={{ margin: "8px 0 0", fontSize: "var(--m-text-xs)", color: "var(--m-text-muted)" }}>
              Net of recorded income and expenses · not a bank balance
            </p>
            <div
              style={{
                display: "flex",
                gap: "var(--m-space-4)",
                marginTop: "var(--m-space-4)",
                fontSize: "var(--m-text-sm)",
              }}
            >
              <div>
                <span style={{ color: "var(--m-text-muted)" }}>In </span>
                <span style={{ color: "var(--m-positive)", fontWeight: 600 }}>
                  {formatMoney(summary.totalIn, currency, locale, convertFromBase(summary.totalIn, currency))}
                </span>
              </div>
              <div>
                <span style={{ color: "var(--m-text-muted)" }}>Out </span>
                <span style={{ color: "var(--m-text)", fontWeight: 600 }}>
                  {formatMoney(summary.totalOut, currency, locale, convertFromBase(summary.totalOut, currency))}
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            <p
              style={{
                margin: "8px 0 0",
                fontSize: "var(--m-text-2xl)",
                fontWeight: 600,
                color: "var(--m-text-muted)",
              }}
            >
              No activity yet
            </p>
            <p style={{ margin: "8px 0 0", fontSize: "var(--m-text-sm)", color: "var(--m-text-muted)" }}>
              Add your first transaction to see a journal balance here.
            </p>
          </>
        )}
      </Card>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "var(--m-space-3)",
          marginBottom: "var(--m-space-6)",
        }}
      >
        {[
          { label: "Activity", path: "/app/activity" },
          { label: "Receipts", path: "/app/receipts" },
          { label: "Goals", path: "/app/goals" },
          { label: "More", path: "/app/more" },
        ].map((item) => (
          <Button
            key={item.path}
            variant="secondary"
            fullWidth
            onClick={() => navigate(item.path)}
            style={{ paddingBlock: 16 }}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <h2 style={{ margin: 0, fontSize: "var(--m-text-base)", fontWeight: 600 }}>Recent activity</h2>
          <button
            type="button"
            onClick={() => navigate("/app/activity")}
            style={{
              background: "none",
              border: "none",
              color: "var(--m-accent)",
              fontSize: "var(--m-text-sm)",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            See all
          </button>
        </div>
        {isLoading ? (
          <p style={{ margin: "12px 0 0", color: "var(--m-text-muted)", fontSize: "var(--m-text-sm)" }}>Loading…</p>
        ) : recent.length === 0 ? (
          <p style={{ margin: "12px 0 0", color: "var(--m-text-muted)", fontSize: "var(--m-text-sm)" }}>
            No transactions yet.
          </p>
        ) : (
          <div role="list">
            {recent.map((tx) => (
              <div key={tx.id} role="listitem">
                <RecentRow tx={tx} currency={currency} convertFromBase={convertFromBase} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
