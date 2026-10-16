import { useMemo } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowDownUp,
  BarChart3,
  ChevronRight,
  Gift,
  Lock,
  PiggyBank,
  Plus,
  Receipt,
  UserRound,
} from "lucide-react";
import type { Transaction } from "../types/transaction";
import type { SavingsGoal } from "../types/savingsGoal";
import { goalProgress } from "../types/savingsGoal";
import type { WishlistItem } from "../types/wishlist";
import { formatMoney, getBalanceSummary } from "../lib/utils";
import { TransactionRow } from "../components/TransactionRow";
import { FinancialRadarCard } from "../components/FinancialRadarCard";
import { useDisplayCurrency } from "../lib/currency";
import { useLanguage, useTranslation } from "../lib/i18n";
import { fillMissingCopy } from "../lib/missingCopy";
import type { PersonalizationSettings } from "../lib/personalization";
import { DEFAULT_PERSONALIZATION } from "../lib/personalization";

const HOME_FALLBACK: Record<string, string> = {
  analytics: "Analytics",
  analyticsHint: "Income, spending and categories",
  openAnalytics: "Open analytics",
  analyticsPlusBadge: "Montra Plus",
  analyticsPlusTitle: "Unlock Advanced Analytics",
  analyticsPlusBody:
    "See spending trends, category breakdowns, and clearer patterns in your money — included with Montra Plus.",
  analyticsPlusBenefitTrends: "Spending trends & income vs expenses",
  analyticsPlusBenefitCategories: "Category breakdowns & comparisons",
  analyticsPlusBenefitInsights: "Insights and future forecasting",
  analyticsPlusCta: "Get Montra Plus",
  analyticsPlusComingSoon: "Montra Plus is coming soon.",
  analyticsPreviewLabel: "Preview",
  balanceAllActivity: "All activity",
  homeGoalOf: "{current} / {target}",
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
  savingsGoalsHint: "Track progress toward a target",
  wishlist: "Wishlist",
  wishlistHint: "Save products you want",
  recentActivity: "Recent activity",
  viewAll: "View all",
  addTransaction: "Add transaction",
  currentBalance: "Current balance",
  moneyIn: "Money in",
  moneyOut: "Money out",
  homeTitle: "Home",
  hello: "Hello",
  welcomeBack: "Welcome back",
  totalBalance: "Total balance",
  quickAdd: "Add",
  quickActivity: "Activity",
  quickReceipts: "Receipts",
  quickMore: "More",
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
  personalization = DEFAULT_PERSONALIZATION,
}: HomePageProps) {
  const translate = useTranslation();
  const { language } = useLanguage();
  const t = (key: string, values?: Record<string, string | number>) => {
    let value = fillMissingCopy(key, translate(key, values), language);
    if (value === "\u2014") value = HOME_FALLBACK[key] ?? key;
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

  const recent = useMemo(() => transactions.slice(0, 5), [transactions]);

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

  return (
    <main className="page-content void-home">
      <header className="void-welcome">
        <div className="void-welcome-text">
          <p className="void-welcome-label">{t("welcomeBack")}</p>
          <h1 className="void-welcome-name">{name || t("hello")}</h1>
        </div>
      </header>

      <section className="void-balance" aria-label={t("currentBalance")}>
        <p className="void-balance-label">{t("totalBalance")}</p>
        <p className="void-balance-value">{money(summary.balance)}</p>
        <div className="void-balance-split">
          <div>
            <span className="void-balance-split-label">
              <ArrowDownLeft size={14} aria-hidden="true" />
              {t("moneyIn")}
            </span>
            <strong className="void-balance-in">{money(summary.totalIn)}</strong>
          </div>
          <div>
            <span className="void-balance-split-label">
              <ArrowUpRight size={14} aria-hidden="true" />
              {t("moneyOut")}
            </span>
            <strong className="void-balance-out">{money(summary.totalOut)}</strong>
          </div>
        </div>
      </section>

      <nav className="void-quick" aria-label={t("mainNavigation")}>
        <button type="button" className="void-quick-item" onClick={onAdd}>
          <span className="void-quick-icon"><Plus size={20} /></span>
          <span>{t("quickAdd")}</span>
        </button>
        <button type="button" className="void-quick-item" onClick={onViewAll}>
          <span className="void-quick-icon"><ArrowDownUp size={20} /></span>
          <span>{t("quickActivity")}</span>
        </button>
        <button type="button" className="void-quick-item" onClick={() => onOpenReceipts?.()}>
          <span className="void-quick-icon"><Receipt size={20} /></span>
          <span>{t("quickReceipts")}</span>
        </button>
        <button type="button" className="void-quick-item" onClick={() => onOpenMore?.()}>
          <span className="void-quick-icon"><UserRound size={20} /></span>
          <span>{t("quickMore")}</span>
        </button>
      </nav>

      {hasPlus && personalization.showAnalytics !== false && (
        <div className="void-radar-wrap" style={{ order: personalization.sectionOrder?.indexOf("analytics") ?? 0 }}>
          <FinancialRadarCard
            transactions={transactions}
            savingsGoals={savingsGoals}
            onOpenAnalytics={onOpenAnalytics}
            onOpenSavingsGoals={onOpenSavingsGoals}
          />
        </div>
      )}

      {personalization.showPlanning !== false && (
        <section className="void-section" aria-label={t("planning")}>
          <div className="void-section-head">
            <h2>{t("planning")}</h2>
          </div>
          {featuredGoal && (
            <button type="button" className="void-goal-card" onClick={onOpenSavingsGoals}>
              <div className="void-goal-top">
                <span className="void-goal-icon"><PiggyBank size={18} /></span>
                <div>
                  <strong>{featuredGoal.goal.name}</strong>
                  <span>{featuredGoal.progress.isComplete ? t("homeGoalComplete") : t("homeGoalRemaining", { amount: money(featuredGoal.progress.remaining) })}</span>
                </div>
                <em>{Math.round(featuredGoal.progress.percent)}%</em>
              </div>
              <div className="void-goal-track">
                <span className="void-goal-fill" style={{ width: `${Math.min(100, featuredGoal.progress.percent)}%` }} />
              </div>
            </button>
          )}
          <div className="void-planning-grid">
            <button type="button" className="void-plan-card" onClick={onOpenSavingsGoals}>
              <span className="void-plan-icon"><PiggyBank size={18} /></span>
              <strong>{t("savingsGoals")}</strong>
              <span>{goalsLabel}</span>
            </button>
            <button type="button" className="void-plan-card" onClick={onOpenWishlist}>
              <span className="void-plan-icon"><Gift size={18} /></span>
              <strong>{t("wishlist")}</strong>
              <span>{wishlistLabel}</span>
            </button>
          </div>
        </section>
      )}

      {!hasPlus && personalization.showAnalytics !== false && (
        <section className="panel analytics-plus-card void-plus-teaser">
          <div className="analytics-plus-overlay">
            <span className="plus-badge">{t("analyticsPlusBadge")}</span>
            <div className="analytics-plus-icon" aria-hidden="true">
              <BarChart3 size={22} />
              <Lock size={12} className="analytics-plus-lock" />
            </div>
            <h2>{t("analyticsPlusTitle")}</h2>
            <p>{t("analyticsPlusBody")}</p>
            <button type="button" className="primary-button analytics-plus-cta" onClick={() => onGetPlus?.()}>
              {t("analyticsPlusCta")}
            </button>
          </div>
        </section>
      )}

      {personalization.showActivity !== false && (
        <section className="void-section void-activity" aria-label={t("recentActivity")}>
          <div className="void-section-head">
            <h2>{t("recentActivity")}</h2>
            {transactions.length > 0 && (
              <button type="button" className="text-button" onClick={onViewAll}>
                {t("viewAll")} <ChevronRight size={16} />
              </button>
            )}
          </div>
          {transactions.length === 0 ? (
            <div className="empty-state home-empty">
              <h3>{t("noTransactionsYet")}</h3>
              <p>{t("addFirstTransaction")}</p>
              <button type="button" className="primary-button" onClick={onAdd}>
                <Plus size={16} /> {t("addTransaction")}
              </button>
            </div>
          ) : (
            <ul className="transaction-list void-tx-list">
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
