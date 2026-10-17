import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTransactions } from "../../hooks/useTransactions";
import { usePlusEntitlement } from "../../hooks/usePlusEntitlement";
import { useDisplayCurrency } from "../../lib/currency";
import { readLanguage } from "../../lib/i18n";
import { formatMoney, formatDate, getBalanceSummary } from "../../lib/utils";
import type { Transaction } from "../../types/transaction";
import { LoadingState } from "../ui/LoadingState";

function QuickAction({
  label,
  onClick,
  icon,
}: {
  label: string;
  onClick: () => void;
  icon: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        background: "none",
        border: "none",
        cursor: "pointer",
        color: "var(--m-text-secondary)",
        padding: 0,
        minWidth: 64,
      }}
    >
      <span
        style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.08)",
          display: "grid",
          placeItems: "center",
          fontSize: 20,
          color: "#e8f5ef",
        }}
        aria-hidden
      >
        {icon}
      </span>
      <span style={{ fontSize: 12, fontWeight: 500 }}>{label}</span>
    </button>
  );
}

function TransactionRow({
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
        padding: "14px 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: isIn ? "rgba(52, 211, 153, 0.15)" : "rgba(255,255,255,0.06)",
          color: isIn ? "#34d399" : "#9fb3a6",
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
            fontSize: 14,
            color: "#f0f7f2",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {tx.name}
        </div>
        <div style={{ fontSize: 12, color: "#6b7f72", marginTop: 2 }}>
          {isIn ? "Receive" : "Send"}
          {tx.method ? ` · ${tx.method}` : ""}
        </div>
      </div>
      <div
        style={{
          fontWeight: 600,
          fontSize: 14,
          color: isIn ? "#34d399" : "#f0f7f2",
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
        }}
      >
        {isIn ? "+" : "−"}
        {amountLabel.replace(/^[^\d-]*/, "")}
      </div>
    </div>
  );
}

/**
 * Home — reference layout (welcome, balance, quick actions, transactions)
 * with Montra data: journal net, real transactions, Plus entitlement.
 */
export function HomePage() {
  const auth = useAuth();
  const { transactions, isLoading, error, refresh } = useTransactions(auth.user?.id);
  const { currency, convertFromBase } = useDisplayCurrency();
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

  const avatarUrl =
    typeof auth.user?.user_metadata?.avatar_url === "string"
      ? auth.user.user_metadata.avatar_url
      : typeof auth.user?.user_metadata?.picture === "string"
        ? auth.user.user_metadata.picture
        : null;

  const hasData = transactions.length > 0;
  const balanceDisplay = hasData
    ? formatMoney(summary.balance, currency, locale, convertFromBase(summary.balance, currency))
    : formatMoney(0, currency, locale, 0);

  return (
    <div style={{ maxWidth: 480, marginInline: "auto" }}>
      {/* Header — avatar + welcome + more */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              overflow: "hidden",
              background: "rgba(16,185,129,0.2)",
              flexShrink: 0,
              display: "grid",
              placeItems: "center",
              fontWeight: 700,
              color: "#10b981",
            }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" width={44} height={44} style={{ objectFit: "cover" }} />
            ) : (
              displayName.slice(0, 1).toUpperCase()
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 12, color: "#6b7f72" }}>Welcome Back</p>
            <p
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 600,
                color: "#f0f7f2",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {displayName}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/app/more")}
          aria-label="More"
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
            color: "#9fb3a6",
            cursor: "pointer",
            fontSize: 16,
          }}
        >
          ⌂
        </button>
      </header>

      {/* Total Balance — centered like reference */}
      <section style={{ textAlign: "center", marginBottom: 28 }}>
        <p style={{ margin: 0, fontSize: 13, color: "#9fb3a6", fontWeight: 500 }}>Total Balance</p>
        {isLoading ? (
          <p style={{ margin: "8px 0 0", color: "#6b7f72" }}>Loading…</p>
        ) : error ? (
          <div style={{ marginTop: 8 }}>
            <p role="alert" style={{ margin: 0, color: "#f87171", fontSize: 13 }}>
              {error}
            </p>
            <button
              type="button"
              onClick={() => void refresh()}
              style={{
                marginTop: 8,
                background: "none",
                border: "none",
                color: "#10b981",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: "clamp(2rem, 8vw, 2.5rem)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "#f5faf7",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {balanceDisplay}
            </p>
            {hasData ? (
              <p
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  margin: "10px 0 0",
                  padding: "4px 10px",
                  borderRadius: 9999,
                  background: "rgba(52,211,153,0.12)",
                  color: "#34d399",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Journal net · not a bank balance
              </p>
            ) : (
              <p style={{ margin: "10px 0 0", fontSize: 12, color: "#6b7f72" }}>
                Add transactions to build your balance
              </p>
            )}
          </>
        )}
      </section>

      {/* Quick actions — Montra functions, circular like reference */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 24,
          padding: "0 4px",
        }}
      >
        <QuickAction label="Add" icon="＋" onClick={() => navigate("/app/activity")} />
        <QuickAction label="Receipt" icon="▤" onClick={() => navigate("/app/receipts")} />
        <QuickAction label="Goals" icon="◎" onClick={() => navigate("/app/goals")} />
        <QuickAction label="More" icon="⋯" onClick={() => navigate("/app/more")} />
      </div>

      {/* Plus promo — maps to Share & Earn slot in reference */}
      {!plus.hasPlus && !plus.isLoading ? (
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 20,
            padding: "20px 18px",
            marginBottom: 20,
            background: "linear-gradient(135deg, #0e1f16 0%, #0a1610 60%, #0c1812 100%)",
            border: "1px solid rgba(16,185,129,0.2)",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              right: -20,
              top: -20,
              width: 120,
              height: 120,
              borderRadius: "40%",
              background: "radial-gradient(circle, rgba(16,185,129,0.35), transparent 70%)",
              transform: "rotate(25deg)",
            }}
          />
          <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: "#f0f7f2", position: "relative" }}>
            Montra Plus
          </p>
          <p style={{ margin: "6px 0 14px", fontSize: 13, color: "#9fb3a6", position: "relative", maxWidth: "70%" }}>
            Unlock analytics depth, planning tools, and premium personalization.
          </p>
          <button
            type="button"
            onClick={() => navigate("/app/plus")}
            style={{
              position: "relative",
              padding: "10px 18px",
              borderRadius: 9999,
              border: "none",
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "#04110a",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(16,185,129,0.35)",
            }}
          >
            Get Plus
          </button>
        </div>
      ) : null}

      {/* Transactions */}
      <section
        style={{
          borderRadius: 20,
          padding: "16px 18px 8px",
          background: "rgba(18, 26, 21, 0.9)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#f0f7f2" }}>Transactions</h2>
          <button
            type="button"
            onClick={() => navigate("/app/activity")}
            style={{
              background: "none",
              border: "none",
              color: "#10b981",
              fontSize: 13,
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            See all
          </button>
        </div>
        {isLoading ? (
          <p style={{ margin: "16px 0", color: "#6b7f72", fontSize: 13 }}>Loading…</p>
        ) : recent.length === 0 ? (
          <p style={{ margin: "16px 0", color: "#6b7f72", fontSize: 13 }}>
            No transactions yet. Tap Add to record income or expenses.
          </p>
        ) : (
          <div role="list">
            {recent.map((tx) => (
              <div key={tx.id} role="listitem">
                <TransactionRow tx={tx} currency={currency} convertFromBase={convertFromBase} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
