import { useMemo } from "react";
import {
  ArrowDownUp,
  BarChart3,
  ChevronRight,
  Gift,
  Lock,
  PiggyBank,
  Plus,
  Receipt,
  UserRound,
  TrendingUp,
  TrendingDown,
  CalendarClock,
} from "lucide-react";
import type { Transaction } from "../types/transaction";
import type { SavingsGoal } from "../types/savingsGoal";
import type { WishlistItem } from "../types/wishlist";
import type { RecurringPayment } from "../types/recurringPayment";
import { RecurringHomeTeaser } from "../components/RecurringHomeTeaser";
import { FinancialRadarCard } from "../components/FinancialRadarCard";
import { WhatIfCard } from "../components/WhatIfCard";
import { MoneyJourneyCard } from "../components/MoneyJourneyCard";
import { TransactionRow } from "../components/TransactionRow";
import { useDisplayCurrency } from "../lib/currency";
import { useLanguage, useTranslation } from "../lib/i18n";
import { fillMissingCopy } from "../lib/missingCopy";
import { formatMoney, getBalanceSummary } from "../lib/utils";
import { goalProgress } from "../types/savingsGoal";
import { filterTransactions, rangeForPeriod, summarize } from "../lib/analytics";
import {
  DEFAULT_PERSONALIZATION,
  type PersonalizationSettings,
} from "../lib/personalization";
import {
  resolveMoneySnapshotCopy,
  type MoneySnapshotKeys,
} from "../lib/moneySnapshotCopy";

const SNAPSHOT_KEYS = new Set([
  "trackedBalanceNote",
  "thisMonth",
  "thisMonthIncome",
  "thisMonthSpending",
  "thisMonthNet",
  "thisMonthEmpty",
]);

const HOME_FALLBACK: Record<string, string> = {
  analytics: "Analytics",
  analyticsHint: "Income, spending and categories",
  openAnalytics: "Open analytics",
  analyticsPlusBadge: "Montra Plus",
  analyticsPlusTitle: "Unlock Advanced Analytics",
  analyticsPlusBody:
    "See spending trends, category breakdowns, and clearer patterns in your money — included with Montra Plus.",
  analyticsPlusCta: "Get Montra Plus",
  homeGoalRemaining: "{amount} remaining",
  homeGoalComplete: "Goal reached",
  homeWishlistCount: "{count} items",
  homeWishlistCountOne: "1 item",
  homeWishlistEmpty: "Save products you want",
  homeGoalsEmpty: "Set a target and track progress",
  homeGoalsActive: "{count} active",
  noTransactionsYet: "No transactions yet",
  addFirstTransaction: "Add a purchase or money in to see your balance here.",
  planning: "Planning",
  savingsGoals: "Savings goals",
  wishlist: "Wishlist",
  recentActivity: "Recent activity",
  viewAll: "View all",
  addTransaction: "Add transaction",
  currentBalance: "Current balance",
  hello: "Hello",
  welcomeBack: "Welcome back",
  totalBalance: "Tracked balance",
  trackedBalanceNote: "From transactions you logged in Montra — not a bank balance.",
  thisMonth: "This month",
  thisMonthIncome: "Income",
  thisMonthSpending: "Spending",
  thisMonthNet: "Net",
  thisMonthEmpty: "No activity logged this month yet.",
  quickAdd: "Add",
  quickActivity: "Activity",
  quickReceipts: "Receipts",
  quickMore: "More",
  mainNavigation: "Quick actions",
  transactions: "Transactions",
};

interface HomePageProps {
  transactions: Transaction[];
  getImageUrl: (path: string) => Promise<string>;
  name: string;
  onAdd: () => void;
  onSelect: (transaction: Transaction) => void;
  onViewAll: () => void;
  onGetPlus?: () => void;
  hasPlus?: boolean;
  onOpenAnalytics?: () => void;
  onOpenSavingsGoals?: () => void;
  onOpenWishlist?: () => void;
  onOpenReceipts?: () => void;
  onOpenMore?: () => void;
  savingsGoals?: SavingsGoal[];
  wishlistItems?: WishlistItem[];
  recurringPayments?: RecurringPayment[];
  onOpenRecurring?: () => void;
  personalization?: PersonalizationSettings;
}

export function HomePage({
  transactions,
  getImageUrl,
  name,
  onAdd,
  onSelect,
  onViewAll,
  onGetPlus,
  hasPlus = false,
  onOpenAnalytics,
  onOpenSavingsGoals,
  onOpenWishlist,
  onOpenReceipts,
  onOpenMore,
  savingsGoals = [],
  wishlistItems = [],
  recurringPayments = [],
  onOpenRecurring,
  personalization = DEFAULT_PERSONALIZATION,
}: HomePageProps) {
  const translate = useTranslation();
  const { language } = useLanguage();
  const t = (key: string, values?: Record<string, string | number>) => {
    let value: string | null = null;
    if (SNAPSHOT_KEYS.has(key)) {
      value = resolveMoneySnapshotCopy(language, key as MoneySnapshotKeys);
    }
    if (!value) {
      value = fillMissingCopy(key, translate(key, values), language);
    }
    if (!value || value === "\u2014" || value === key) value = HOME_FALLBACK[key] ?? key;
    if (values) {
      value = value.replace(/\{(\w+)\}/g, (m, n) =>
        Object.hasOwn(values, n) ? String(values[n]) : m,
      );
    }
    return value;
  };
  const { currency, convertFromBase } = useDisplayCurrency();
  const summary = getBalanceSummary(transactions);
  const money = (value: number) =>
    formatMoney(value, currency, language, convertFromBase(value, currency));

  const monthSummary = useMemo(() => {
    const range = rangeForPeriod("this_month");
    const monthTx = filterTransactions(transactions, range, "all", null);
    return summarize(monthTx);
  }, [transactions]);

  const recent = useMemo(() => transactions.slice(0, 6), [transactions]);

  const featuredGoal = useMemo(() => {
    const active = savingsGoals
      .map((g) => ({ goal: g, progress: goalProgress(g) }))
      .filter((x) => !x.progress.isComplete)
      .sort((a, b) => b.progress.percent - a.progress.percent);
    if (active.length > 0) return active[0];
    if (savingsGoals.length > 0) {
      const g = savingsGoals[0];
      return { goal: g, progress: goalProgress(g) };
    }
    return null;
  }, [savingsGoals]);

  const openWishlistCount = useMemo(
    () => wishlistItems.filter((item) => !item.purchased).length,
    [wishlistItems],
  );

  const activeGoalsCount = useMemo(
    () => savingsGoals.filter((g) => !goalProgress(g).isComplete).length,
    [savingsGoals],
  );

  const wishlistLabel =
    wishlistItems.length === 0
      ? t("homeWishlistEmpty")
      : openWishlistCount === 1
        ? t("homeWishlistCountOne")
        : t("homeWishlistCount", { count: openWishlistCount });

  const goalsLabel =
    savingsGoals.length === 0
      ? t("homeGoalsEmpty")
      : t("homeGoalsActive", { count: activeGoalsCount });

  const monthHasActivity = monthSummary.transactionCount > 0;
  const netPositive = monthSummary.netChange > 0;
  const netNegative = monthSummary.netChange < 0;

  const activeRecurring = useMemo(
    () => (recurringPayments ?? []).filter((p) => p.active !== false),
    [recurringPayments],
  );

  return (
    <main className="page-content mv-home">
      <header className="mv-header">
        <div className="mv-header-text">
          <p className="mv-kicker">{t("welcomeBack")}</p>
          <h1 className="mv-name">{name || t("hello")}</h1>
        </div>
      </header>

      <section className="mv-hero" aria-label={t("currentBalance")}>
        <div className="mv-hero-glow" aria-hidden="true" />
        <p className="mv-hero-label">{t("totalBalance")}</p>
        <p className="mv-hero-value">{money(summary.balance)}</p>
        {monthHasActivity && (
          <p
            className={
              netPositive
                ? "mv-hero-delta is-up"
                : netNegative
                  ? "mv-hero-delta is-down"
                  : "mv-hero-delta"
            }
          >
            {netPositive ? <TrendingUp size={14} /> : netNegative ? <TrendingDown size={14} /> : null}
            <span>
              {netPositive ? "+" : ""}
              {money(monthSummary.netChange)} · {t("thisMonth")}
            </span>
          </p>
        )}
        <p className="mv-hero-note">{t("trackedBalanceNote")}</p>
      </section>

      <nav className="mv-actions" aria-label={t("mainNavigation")}>
        <button type="button" className="mv-action" onClick={onAdd}>
          <span className="mv-action-orb"><Plus size={22} /></span>
          <span className="mv-action-label">{t("quickAdd")}</span>
        </button>
        <button type="button" className="mv-action" onClick={onViewAll}>
          <span className="mv-action-orb"><ArrowDownUp size={20} /></span>
          <span className="mv-action-label">{t("quickActivity")}</span>
        </button>
        <button type="button" className="mv-action" onClick={() => onOpenReceipts?.()}>
          <span className="mv-action-orb"><Receipt size={20} /></span>
          <span className="mv-action-label">{t("quickReceipts")}</span>
        </button>
        <button type="button" className="mv-action" onClick={() => onOpenMore?.()}>
          <span className="mv-action-orb"><UserRound size={20} /></span>
          <span className="mv-action-label">{t("quickMore")}</span>
        </button>
      </nav>

      <section className="mv-card mv-month" aria-label={t("thisMonth")}>
        <div className="mv-card-head">
          <h2>{t("thisMonth")}</h2>
        </div>
        {monthHasActivity ? (
          <div className="mv-month-grid">
            <div className="mv-stat">
              <span>{t("thisMonthIncome")}</span>
              <strong className="is-in">{money(monthSummary.totalIncome)}</strong>
            </div>
            <div className="mv-stat">
              <span>{t("thisMonthSpending")}</span>
              <strong className="is-out">{money(monthSummary.totalSpending)}</strong>
            </div>
            <div className="mv-stat">
              <span>{t("thisMonthNet")}</span>
              <strong className={netPositive ? "is-in" : netNegative ? "is-out" : ""}>
                {money(monthSummary.netChange)}
              </strong>
            </div>
          </div>
        ) : (
          <p className="mv-empty-line">{t("thisMonthEmpty")}</p>
        )}
      </section>

      {personalization.showPlanning !== false && (
        <section className="mv-card mv-feature" aria-label={t("planning")}>
          {featuredGoal ? (
            <button type="button" className="mv-feature-btn" onClick={onOpenSavingsGoals}>
              <div className="mv-feature-copy">
                <span className="mv-feature-badge">{t("savingsGoals")}</span>
                <strong>{featuredGoal.goal.name}</strong>
                <span>
                  {featuredGoal.progress.isComplete
                    ? t("homeGoalComplete")
                    : t("homeGoalRemaining", { amount: money(featuredGoal.progress.remaining) })}
                </span>
              </div>
              <div className="mv-feature-ring" aria-hidden="true">
                <em>{Math.round(featuredGoal.progress.percent)}%</em>
              </div>
            </button>
          ) : (
            <button type="button" className="mv-feature-btn" onClick={onOpenSavingsGoals}>
              <div className="mv-feature-copy">
                <span className="mv-feature-badge">{t("planning")}</span>
                <strong>{t("savingsGoals")}</strong>
                <span>{t("homeGoalsEmpty")}</span>
              </div>
              <span className="mv-feature-icon"><PiggyBank size={28} /></span>
            </button>
          )}
          <div className="mv-feature-links">
            <button type="button" onClick={onOpenSavingsGoals}>
              <PiggyBank size={16} /> {goalsLabel}
            </button>
            <button type="button" onClick={onOpenWishlist}>
              <Gift size={16} /> {wishlistLabel}
            </button>
            {onOpenRecurring && (
              <button type="button" onClick={onOpenRecurring}>
                <CalendarClock size={16} /> {t("planning")}
              </button>
            )}
          </div>
        </section>
      )}

      {onOpenRecurring && (
        <RecurringHomeTeaser items={activeRecurring} onOpen={onOpenRecurring} />
      )}

      {hasPlus && personalization.showAnalytics !== false && (
        <FinancialRadarCard
          transactions={transactions}
          savingsGoals={savingsGoals}
          onOpenAnalytics={onOpenAnalytics}
          onOpenSavingsGoals={onOpenSavingsGoals}
        />
      )}

      {personalization.showPlanning !== false && <WhatIfCard goals={savingsGoals} />}
      <MoneyJourneyCard transactions={transactions} goals={savingsGoals} />

      {!hasPlus && personalization.showAnalytics !== false && (
        <section className="mv-card mv-plus">
          <span className="mv-feature-badge">{t("analyticsPlusBadge")}</span>
          <div className="mv-plus-icon" aria-hidden="true">
            <BarChart3 size={22} />
            <Lock size={12} />
          </div>
          <h2>{t("analyticsPlusTitle")}</h2>
          <p>{t("analyticsPlusBody")}</p>
          <button type="button" className="mv-cta" onClick={() => onGetPlus?.()}>
            {t("analyticsPlusCta")}
          </button>
        </section>
      )}

      {personalization.showActivity !== false && (
        <section className="mv-card mv-tx" aria-label={t("recentActivity")}>
          <div className="mv-card-head">
            <h2>{t("transactions")}</h2>
            {transactions.length > 0 && (
              <button type="button" className="mv-link" onClick={onViewAll}>
                {t("viewAll")} <ChevronRight size={16} />
              </button>
            )}
          </div>
          {transactions.length === 0 ? (
            <div className="mv-empty">
              <h3>{t("noTransactionsYet")}</h3>
              <p>{t("addFirstTransaction")}</p>
              <button type="button" className="mv-cta" onClick={onAdd}>
                <Plus size={16} /> {t("addTransaction")}
              </button>
            </div>
          ) : (
            <ul className="mv-tx-list">
              {recent.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  transaction={tx}
                  onClick={onSelect}
                  getImageUrl={getImageUrl}
                />
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
