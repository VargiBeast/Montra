import { ArrowDownLeft, ArrowUpRight, ChevronRight, Plus, Sparkles } from "lucide-react";
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
}

export function HomePage({ transactions, getImageUrl, name, onAdd, onSelect, onViewAll }: HomePageProps) {
  const t = useTranslation();
  const { language } = useLanguage();
  const { currency } = useDisplayCurrency();
  const summary = getBalanceSummary(transactions);
  const money = (value: number) => formatMoney(value, currency, language);
  const latest = [...transactions].sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at)).slice(0, 5);
  const firstName = name.trim().split(/\s+/)[0] || "there";

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
          <section className="panel section-panel" style={{ marginTop: 18 }}>
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
          <span className="eyebrow" style={{ color: "var(--green)" }}>A little at a time</span>
          <h2>{t("intentionalSpending")}</h2>
          <p>Keep the what, when, and why of each purchase in one personal place.</p>
          <button className="secondary-button" type="button" onClick={onAdd}><Plus size={16} /> {t("addEntry")}</button>
        </aside>
      </div>
    </main>
  );
}