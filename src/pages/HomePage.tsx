import { ArrowDownLeft, ArrowUpRight, BarChart3, ChevronRight, Lock, Plus, Sparkles, TrendingUp } from "lucide-react";
import type { Transaction } from "../types/transaction";
import { formatMoney, getBalanceSummary } from "../lib/utils";
import { TransactionRow } from "../components/TransactionRow";
import { useDisplayCurrency } from "../lib/currency";
import { useLanguage, useTranslation } from "../lib/i18n";

const PLUS_FALLBACK: Record<string, string> = {
  analytics: "Analytics",
  analyticsHint: "Income, spending and categories",
  openAnalytics: "Open analytics",
  analyticsPlusBadge: "Montra Plus",
  analyticsPlusTitle: "Unlock Advanced Analytics",
  analyticsPlusBody: "See spending trends, category breakdowns, and clearer patterns in your money \u2014 included with Montra Plus.",
  analyticsPlusBenefitTrends: "Spending trends & income vs expenses",
  analyticsPlusBenefitCategories: "Category breakdowns & comparisons",
  analyticsPlusBenefitInsights: "Insights and future forecasting",
  analyticsPlusCta: "Get Montra Plus",
  analyticsPlusComingSoon: "Montra Plus is coming soon.",
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
}

export function HomePage({ transactions, getImageUrl, name, onAdd, onSelect, onViewAll, onGetPlus, hasPlus = false, onOpenAnalytics }: HomePageProps) {
  const translate = useTranslation();
  const t = (key: string, values?: Record<string, string | number>) => {
    const value = translate(key, values);
    if (value !== "\u2014") return value;
    return PLUS_FALLBACK[key] ?? key;
  };
  const { language } = useLanguage();
  const { currency, convertFromBase } = useDisplayCurrency();
  const summary = getBalanceSummary(transactions);
  const money = (value: number) => formatMoney(value, currency, language, convertFromBase(value, currency));

  return (
    <main className="page-content">
      <div className="page-header">
        <div>
          <p className="greeting">{t("hello")}{name ? `, ${name}` : ""}</p>
          <h1 className="page-title">{t("homeTitle")}</h1>
        </div>
      </div>

      <section className="panel balance-card">
        <span className="eyebrow">{t("currentBalance")}</span>
        <strong className="balance-value">{money(summary.balance)}</strong>
        <div className="balance-split">
          <div>
            <span className="balance-split-label"><ArrowDownLeft size={14} /> {t("moneyIn")}</span>
            <strong>{money(summary.income)}</strong>
          </div>
          <div>
            <span className="balance-split-label"><ArrowUpRight size={14} /> {t("moneyOut")}</span>
            <strong>{money(summary.spending)}</strong>
          </div>
        </div>
      </section>

      {hasPlus ? (
        <section className="panel section-panel analytics-unlocked-card">
          <div className="section-heading">
            <h2>{t("analytics")}</h2>
          </div>
          <p className="analytics-hint">{t("analyticsHint")}</p>
          <button type="button" className="primary-button" onClick={() => onOpenAnalytics?.()}>
            {t("openAnalytics")}
          </button>
        </section>
      ) : (
        <section className="panel analytics-plus-card" aria-label={t("analytics")}>
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
              <li><TrendingUp size={16} />{t("analyticsPlusBenefitTrends")}</li>
              <li><Sparkles size={16} />{t("analyticsPlusBenefitCategories")}</li>
              <li><BarChart3 size={16} />{t("analyticsPlusBenefitInsights")}</li>
            </ul>
            <button type="button" className="primary-button analytics-plus-cta" onClick={() => onGetPlus?.()}>
              {t("analyticsPlusCta")}
            </button>
          </div>
        </section>
      )}

      <section className="panel section-panel">
        <div className="section-heading">
          <h2>{t("recentActivity")}</h2>
          {transactions.length > 0 && (
            <button type="button" className="text-button" onClick={onViewAll}>
              {t("viewAll")} <ChevronRight size={16} />
            </button>
          )}
        </div>
        {transactions.length === 0 ? (
          <div className="empty-state">
            <h3>{t("noTransactionsYet")}</h3>
            <p>{t("addFirstTransaction")}</p>
            <button type="button" className="primary-button" onClick={onAdd}>
              <Plus size={16} /> {t("addTransaction")}
            </button>
          </div>
        ) : (
          <ul className="transaction-list">
            {transactions.slice(0, 5).map((tx) => (
              <TransactionRow key={tx.id} transaction={tx} money={money} onSelect={onSelect} getImageUrl={getImageUrl} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
