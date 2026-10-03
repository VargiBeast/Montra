import { ArrowDownLeft, ArrowUpRight, ChevronRight, Plus, Sparkles } from "lucide-react";
import type { Transaction } from "../types/transaction";
import { formatMoney, getBalanceSummary } from "../lib/utils";
import { TransactionRow } from "../components/TransactionRow";

interface HomePageProps {
  transactions: Transaction[];
  getImageUrl: (path: string) => Promise<string>;
  name: string;
  onAdd: () => void;
  onSelect: (transaction: Transaction) => void;
  onViewAll: () => void;
}

export function HomePage({ transactions, getImageUrl, name, onAdd, onSelect, onViewAll }: HomePageProps) {
  const summary = getBalanceSummary(transactions);
  const latest = [...transactions].sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at)).slice(0, 5);
  const firstName = name.trim().split(/\s+/)[0] || "there";

  return (
    <main className="page-content">
      <div className="page-header">
        <div>
          <p className="greeting">A clearer view of your everyday</p>
          <h1 className="page-title">Good to see you, {firstName}</h1>
        </div>
      </div>
      <div className="dashboard-grid">
        <div>
          <section className="balance-panel" aria-label="Balance summary">
            <div className="balance-content">
              <span className="eyebrow">Your balance</span>
              <div className="balance-amount">{formatMoney(summary.balance)}</div>
              <div className="balance-meta">
                <div className="balance-meta-item"><span className="balance-meta-icon"><ArrowDownLeft size={15} /></span><span>Money in<strong>{formatMoney(summary.totalIn)}</strong></span></div>
                <div className="balance-meta-item"><span className="balance-meta-icon"><ArrowUpRight size={15} /></span><span>Money out<strong>{formatMoney(summary.totalOut)}</strong></span></div>
              </div>
            </div>
          </section>
          <section className="panel section-panel" style={{ marginTop: 18 }}>
            <div className="section-heading">
              <h2>Recent transactions</h2>
              {transactions.length > 0 && <button className="text-action" type="button" onClick={onViewAll}>View all <ChevronRight size={15} /></button>}
            </div>
            {latest.length ? <div className="transaction-list">{latest.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} getImageUrl={getImageUrl} onClick={onSelect} />)}</div> :
              <div className="empty-state">
                <span className="empty-art"><Sparkles size={22} /></span>
                <h3>Your money story starts here</h3>
                <p>Add your first purchase or money-in entry. Saldo will keep the details together, so patterns are easier to see later.</p>
                <button className="primary-button" type="button" onClick={onAdd}><Plus size={17} /> Add a transaction</button>
              </div>}
          </section>
        </div>
        <aside className="panel quick-card">
          <span className="quick-orb" aria-hidden="true" />
          <span className="eyebrow" style={{ color: "var(--green)" }}>A little at a time</span>
          <h2>Make spending<br />feel more intentional.</h2>
          <p>Keep the what, when, and why of each purchase in one personal place.</p>
          <button className="secondary-button" type="button" onClick={onAdd}><Plus size={16} /> Add an entry</button>
        </aside>
      </div>
    </main>
  );
}