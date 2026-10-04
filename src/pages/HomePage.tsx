import { ArrowDownLeft, ArrowUpRight, BarChart3, ChevronRight, Lock, Plus, Sparkles, TrendingUp } from "lucide-react";
import type { Transaction } from "../types/transaction";
import { formatMoney, getBalanceSummary } from "../lib/utils";
import { TransactionRow } from "../components/TransactionRow";
import { useDisplayCurrency } from "../lib/currency";
import { useLanguage, useTranslation } from "../lib/i18n";

interface HomePageProps {
  transactions: Transaction[];
  getImageUrl: (path: string) => Promise<string>;
  name: string;
  onAdd: () => void;
  onSelect: (transaction: Transaction) => void;
  onViewAll: () => void;
  onGetPlus?: () => void;
}

export function HomePage({ transactions, getImageUrl, name, onAdd, onSelect, onViewAll, onGetPlus }: HomePageProps) {
  const t = useTranslation();
  const { language } = useLanguage();
  const { currency, convertFromBase } = useDisplayCurrency();
  const summary = getBalanceSummary(transactions);
  const money = (value: number) => formatMoney(value, currency, language, convertFromBase(value, currency));
  const latest = [...transactions].sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at)).slice(0, 5);
  const firstName = name.trim().split(/\s+/)[0] || t("nameFallback");

  return (
    <main className="page-content">
      <div className="page-header">
        <div>
          <p className="greeting">{t("greetingHome")}</p>
          <h1 className="page-title">{t("goodToSeeYou", { name: firstName })}</h1>
        </div>
      </div>
      <div className="dashboard-grid">
        <div>
          <section className="balance-panel" aria-label={t("balanceSummary")}>
            <div className="balance-content">
              <span className="eyebrow">{t("yourBalance")}</span>
              <div className="balance-amount">{money(summary.balance)}</div>
              <div className="balance-meta">
                <div className="balance-meta-item"><span className="balance-meta-icon"><ArrowDownLeft size={15} /></span><span>{t("moneyIn")}<strong>{money(summary.totalIn)}</strong></span></div>
                <div className="balance-meta-item"><span className="balance-meta-icon"><ArrowUpRight size={15} /></span><span>{t("moneyOut")}<strong>{money(summary.totalOut)}</strong></span></div>
              </div>
            </div>
          </section>

          <section className="panel analytics-plus-card" aria-label={t("analytics")}>
            <div className="analytics-plus-preview" aria-hidden="true">
              <div className="analytics-plus-preview-bars">
                <span style={{ height: "42%" }} />
                <span style={{ height: "68%" }} />
                <span style={{ height: "35%" }} />
                <span style={{ height: "78%" }} />
                <span style={{ height: "52%" }} />
                <span style={{ height: "64%" }} />
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
                <li><TrendingUp size={14} />{t("analyticsPlusBenefitTrends")}</li>
                <li><BarChart3 size={14} />{t("analyticsPlusBenefitCategories")}</li>
                <li><Sparkles size={14} />{t("analyticsPlusBenefitInsights")}</li>
              </ul>
              <button className="primary-button analytics-plus-cta" type="button" onClick={() => onGetPlus?.()}>
                {t("analyticsPlusCta")}
              </button>
            </div>
          </section>

          <section className="panel section-panel stack-md">
            <div className="section-heading">
              <h2>{t("recentTransactions")}</h2>
              {transactions.length > 0 && <button className="text-action" type="button" onClick={onViewAll}>{t("viewAll")} <ChevronRight size={15} /></button>}
            </div>
            {latest.length ? <div className="transaction-list">{latest.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} getImageUrl={getImageUrl} onClick={onSelect} />)}</div> :
              <div className="empty-state">
                <span className="empty-art"><Sparkles size={22} /></span>
                <h3>{t("moneyStoryStarts")}</h3>
                <p>{t("firstEntryHint")}</p>
                <button className="primary-button" type="button" onClick={onAdd}><Plus size={17} /> {t("addTransaction")}</button>
              </div>}
          </section>
        </div>
        <aside className="panel quick-card">
          <span className="quick-orb" aria-hidden="true" />
          <span className="eyebrow accent-green">{t("littleAtATime")}</span>
          <h2>{t("intentionalSpending")}</h2>
          <p>{t("keepWhatWhenWhy")}</p>
          <button className="secondary-button" type="button" onClick={onAdd}><Plus size={16} /> {t("addEntry")}</button>
        </aside>
      </div>
    </main>
  );
}
