import { useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useTransactions } from "../../hooks/useTransactions";
import { useDisplayCurrency } from "../../lib/currency";
import { readLanguage } from "../../lib/i18n";
import { formatMoney, getBalanceSummary } from "../../lib/utils";
import { PageHeader } from "../ui/PageHeader";
import { Card } from "../ui/Card";
import { LoadingState } from "../ui/LoadingState";
import { Button } from "../ui/Button";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function AnalyticsPage() {
  const auth = useAuth();
  const { transactions, isLoading, error, refresh } = useTransactions(auth.user?.id);
  const { currency, convertFromBase } = useDisplayCurrency();
  const locale = readLanguage();

  const summary = useMemo(() => getBalanceSummary(transactions), [transactions]);

  const monthlyOut = useMemo(() => {
    const buckets = Array.from({ length: 12 }, () => 0);
    const year = new Date().getFullYear();
    for (const tx of transactions) {
      if (tx.type !== "out") continue;
      const d = new Date(tx.date);
      if (d.getFullYear() !== year) continue;
      buckets[d.getMonth()] += Number(tx.amount) || 0;
    }
    return buckets.map((v) => convertFromBase(v, currency));
  }, [transactions, convertFromBase, currency]);

  const maxBar = Math.max(...monthlyOut, 1);

  const byMethod = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of transactions) {
      if (tx.type !== "out") continue;
      const key = (tx.method || "Other").trim() || "Other";
      map.set(key, (map.get(key) ?? 0) + (Number(tx.amount) || 0));
    }
    const total = [...map.values()].reduce((a, b) => a + b, 0) || 1;
    return [...map.entries()]
      .map(([label, base]) => ({
        label,
        amount: convertFromBase(base, currency),
        pct: Math.round((base / total) * 100),
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
  }, [transactions, convertFromBase, currency]);

  const totalOutDisplay = formatMoney(summary.totalOut, currency, locale, convertFromBase(summary.totalOut, currency));
  const totalInDisplay = formatMoney(summary.totalIn, currency, locale, convertFromBase(summary.totalIn, currency));

  if (isLoading) return <LoadingState label="Loading analytics…" />;

  if (error) {
    return (
      <div>
        <PageHeader title="Analytics" subtitle="Spending overview" />
        <Card>
          <p role="alert" style={{ color: "var(--m-negative)" }}>
            {error}
          </p>
          <Button variant="secondary" onClick={() => void refresh()} style={{ marginTop: 12 }}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  const hasData = transactions.length > 0;

  return (
    <div className="m-anim-in">
      <PageHeader title="Analytics" subtitle="From your recorded transactions" />

      <Card
        padding="lg"
        className="m-anim-scale"
        style={{
          marginBottom: 16,
          background: "linear-gradient(160deg, #0e1a14 0%, #0a120e 100%)",
          borderColor: "rgba(16,185,129,0.2)",
        }}
      >
        <p style={{ margin: 0, fontSize: 13, color: "var(--m-text-secondary)" }}>Spending Overview</p>
        <p
          style={{
            margin: "8px 0 0",
            fontSize: "clamp(1.75rem, 6vw, 2.25rem)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
          }}
        >
          {hasData ? totalOutDisplay : "—"}
        </p>
        <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--m-text-muted)" }}>
          Total expenses (journal) · Income {hasData ? totalInDisplay : "—"}
        </p>

        {hasData ? (
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 6,
              height: 120,
              marginTop: 24,
              paddingTop: 8,
            }}
            aria-label="Monthly spending this year"
          >
            {monthlyOut.map((v, i) => (
              <div key={MONTHS[i]} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div
                  className="m-bar"
                  style={{
                    width: "100%",
                    maxWidth: 28,
                    height: `${Math.max(4, (v / maxBar) * 100)}%`,
                    borderRadius: 6,
                    background: "linear-gradient(180deg, #34d399, #059669)",
                    animationDelay: `${i * 0.04}s`,
                  }}
                  title={`${MONTHS[i]}: ${v.toFixed(0)}`}
                />
                <span style={{ fontSize: 9, color: "var(--m-text-muted)" }}>{MONTHS[i]}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ marginTop: 20, color: "var(--m-text-muted)", fontSize: 13 }}>
            Add expenses in Activity to see your spending chart.
          </p>
        )}
      </Card>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {byMethod.length === 0 ? (
          <Card className="m-anim-in m-anim-delay-1">
            <p style={{ margin: 0, color: "var(--m-text-muted)", fontSize: 13 }}>No category data yet.</p>
          </Card>
        ) : (
          byMethod.map((row, idx) => (
            <Card key={row.label} className={`m-anim-in m-anim-delay-${Math.min(idx + 1, 4)}`} padding="md">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{row.label}</span>
                <span style={{ color: "var(--m-accent)", fontWeight: 600, fontSize: 13 }}>{row.pct}%</span>
              </div>
              <div
                style={{
                  height: 6,
                  borderRadius: 99,
                  background: "rgba(255,255,255,0.06)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${row.pct}%`,
                    height: "100%",
                    borderRadius: 99,
                    background: "linear-gradient(90deg, #10b981, #34d399)",
                  }}
                />
              </div>
              <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--m-text-muted)" }}>
                {formatMoney(row.amount, currency, locale, row.amount)}
              </p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
