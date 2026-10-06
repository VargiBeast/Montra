import { useMemo } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  Gift,
  Lock,
  PiggyBank,
  Plus,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { Transaction } from "../types/transaction";
import type { SavingsGoal } from "../types/savingsGoal";
import { goalProgress } from "../types/savingsGoal";
import type { WishlistItem } from "../types/wishlist";
import { formatMoney, getBalanceSummary } from "../lib/utils";
import { TransactionRow } from "../components/TransactionRow";
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
    "See spending trends, category breakdowns, and clearer patterns in your money \u2014 included with Montra Plus.",
  analyticsPlusBenefitTrends: "Spending trends & income vs expenses",
  analyticsPlusBenefitCategories: "Category breakdowns & comparisons",
  analyticsPlusBenefitInsights: "Insights and future forecasting",
  analyticsPlusCta: "Get Montra Plus",
  analyticsPlusComingSoon: "Montra Plus is coming soon.",
  balanceAllActivity: "All activity",
  homeGoalOf: "{current} / {target}",
  homeGoalRemaining: "{amount} remaining",
  homeGoalComplete: "Goal reached",
  homeWishlistCount: "{count} items",
  homeWishlistEmpty: "Save products you want",
  homeGoalsEmpty: "Set a target and track progress",
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

  return (
    <main className="page-content home-page">
      <div className="page-header">
        <div>
          <p className="greeting">
            {t("hello")}
            {name ? `, ${name}` : ""}
          </p>
          <h1 className="page-title">{t("homeTitle")}</h1>
        </div>
      </div>

      <section className="panel balance-card" aria-label={t("currentBalance")}>
        <span className="eyebrow">{t("currentBalance")}</span>
        <strong className="balance-value">{money(summary.balance)}</strong>
        <p className="balance-period">{t("balanceAllActivity")}</p>
        <div className="balance-split">
          <div>
            <span className="balance-split-label">
              <ArrowDownLeft size={14} aria-hidden="true" /> {t("moneyIn")}
            </span>
            <strong className="balance-in">{money(summary.totalIn)}</strong>
          </div>
          <div>
            <span className="balance-split-label">
              <ArrowUpRight size={14} aria-hidden="true" /> {t("moneyOut")}
            </span>
            <strong className="balance-out">{money(summary.totalOut)}</strong>
          </div>
        </div>
      </section>

      {personalization.showPlanning && (onOpenSavingsGoals || onOpenWishlist) && (
        <section className="panel section-panel home-planning" style={{ order: personalization.sectionOrder.indexOf("planning") }} aria-label={t("planning")}>
          <div className="section-heading">
            <h2>{t("planning")}</h2>
          </div>

          {featuredGoal && onOpenSavingsGoals && (
            <button
              type="button"
              className="home-goal-card"
              onClick={onOpenSavingsGoals}
              aria-label={featuredGoal.goal.name}
            >
              <div className="home-goal-card-top">
                <span className="planning-card-icon" aria-hidden="true">
                  <PiggyBank size={18} />
                </span>
                <div className="home-goal-card-copy">
                  <strong>{featuredGoal.goal.name}</strong>
                  <span>
                    {featuredGoal.progress.isComplete
                      ? t("homeGoalComplete")
                      : t("homeGoalRemaining", {
                          amount: money(featuredGoal.progress.remaining),
                        })}
                  </span>
                </div>
                <span className="home-goal-percent" aria-hidden="true">
                  {featuredGoal.progress.percent}%
                </span>
              </div>
              <div className="home-goal-track" aria-hidden="true">
                <span
                  className={`home-goal-fill ${featuredGoal.progress.isComplete ? "is-complete" : ""}`}
                  style={{ width: `${featuredGoal.progress.percent}%` }}
                />
              </div>
              <p className="home-goal-amounts">
                {t("homeGoalOf", {
                  current: money(featuredGoal.goal.current_amount),
                  target: money(featuredGoal.goal.target_amount),
                })}
              </p>
            </button>
          )}

          <div className={`planning-grid ${featuredGoal ? "has-featured-goal" : ""}`}>
            {onOpenSavingsGoals && !featuredGoal && (
              <button type="button" className="planning-card" onClick={onOpenSavingsGoals}>
                <span className="planning-card-icon" aria-hidden="true">
                  <PiggyBank size={18} />
                </span>
                <strong>{t("savingsGoals")}</strong>
                <span>
                  {savingsGoals.length === 0
                    ? t("homeGoalsEmpty")
                    : t("homeGoalsActive", {
                        count: savingsGoals.filter((g) => !goalProgress(g).isComplete).length,
                      })}
                </span>
              </button>
            )}
            {onOpenWishlist && (
              <button type="button" className="planning-card" onClick={onOpenWishlist}>
                <span className="planning-card-icon" aria-hidden="true">
                  <Gift size={18} />
                </span>
                <strong>{t("wishlist")}</strong>
                <span>
                  {wishlistItems.length === 0
                    ? t("homeWishlistEmpty")
                    : t("homeWishlistCount", { count: openWishlistCount })}
                </span>
              </button>
            )}
            {featuredGoal && onOpenSavingsGoals && savingsGoals.length > 1 && (
              <button type="button" className="planning-card" onClick={onOpenSavingsGoals}>
                <span className="planning-card-icon" aria-hidden="true">
                  <PiggyBank size={18} />
                </span>
                <strong>{t("savingsGoals")}</strong>
                <span>
                  {t("homeGoalsActive", {
                    count: savingsGoals.filter((g) => !goalProgress(g).isComplete).length,
                  })}
                </span>
              </button>
            )}
          </div>
        </section>
      )}

      {personalization.showAnalytics && (hasPlus ? (
        <section className="panel section-panel analytics-unlocked-card" style={{ order: personalization.sectionOrder.indexOf("analytics") }}>
          <div className="section-heading">
            <h2>{t("analytics")}</h2>
          </div>
          <p className="analytics-hint">{t("analyticsHint")}</p>
          <button type="button" className="primary-button" onClick={() => onOpenAnalytics?.()}>
            {t("openAnalytics")}
          </button>
        </section>
      ) : (
        <section className="panel analytics-plus-card" style={{ order: personalization.sectionOrder.indexOf("analytics") }} aria-label={t("analytics")}>
          <div className="analytics-plus-preview" aria-hidden="true">
            <div className="analytics-plus-preview-bars">
              <span style={{ height: "42%" }} />
              <span style={{ height: "68%" }} />
              <span style={{ height: "35%" }} />
              <span style={{ height: "80%" }} />
              <span style={{ height: "55%" }} />
            </div>
            <div className="analytics-plus-preview-lines">
              <div />
              <div />
              <div />
            </div>
          </div>
          <div className="analytics-plus-overlay">
            <span className="plus-badge">{t("analyticsPlusBadge")}</span>
            <div className="analytics-plus-icon" aria-hidden="true">
              <BarChart3 size={22} />
              <Lock size={12} className="analytics-plus-lock" />
            </div>
            <h2>{t("analyticsPlusTitle")}</h2>
            <p>{t("analyticsPlusBody")}</p>
            <ul className="analytics-plus-benefits">
              <li>
                <TrendingUp size={16} />
                {t("analyticsPlusBenefitTrends")}
              </li>
              <li>
                <Sparkles size={16} />
                {t("analyticsPlusBenefitCategories")}
              </li>
              <li>
                <BarChart3 size={16} />
                {t("analyticsPlusBenefitInsights")}
              </li>
            </ul>
            <p className="analytics-preview-label">{t("analyticsPreviewLabel")}</p>
            <button type="button" className="primary-button analytics-plus-cta" onClick={() => onGetPlus?.()}>
              {t("analyticsPlusCta")}
            </button>
          </div>
        </section>
      ))}

      {personalization.showActivity && (
      <section className="panel section-panel home-activity" style={{ order: personalization.sectionOrder.indexOf("activity") }} aria-label={t("recentActivity")}>
        <div className="section-heading">
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
          <ul className="transaction-list">
            {recent.map((tx) => (
              <TransactionRow key={tx.id} transaction={tx} onClick={onSelect} getImageUrl={getImageUrl} />
            ))}
          </ul>
        )}
      </section>
      )}
    </main>
  );
}
