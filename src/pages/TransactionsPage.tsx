import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import type { Transaction } from "../types/transaction";
import { TransactionRow } from "../components/TransactionRow";

type Filter = "All" | "Purchases" | "Money in";
interface TransactionsPageProps {
  transactions: Transaction[];
  getImageUrl: (path: string) => Promise<string>;
  onAdd: () => void;
  onSelect: (transaction: Transaction) => void;
}

function monthHeading(dateString: string) {
  const date = new Date(`${dateString}T12:00:00`);
  return Number.isNaN(date.getTime()) ? "Other dates" : new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(date);
}

export function TransactionsPage({ transactions, getImageUrl, onAdd, onSelect }: TransactionsPageProps) {
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const grouped = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = transactions.filter((item) => {
      const inFilter = filter === "All" || (filter === "Purchases" ? item.type === "out" : item.type === "in");
      const matches = [item.name, item.method, item.note].some((value) => value?.toLowerCase().includes(normalized));
      return inFilter && (!normalized || matches);
    }).sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at));
    return filtered.reduce<Record<string, Transaction[]>>((groups, item) => {
      const label = monthHeading(item.date);
      groups[label] ??= [];
      groups[label].push(item);
      return groups;
    }, {});
  }, [filter, query, transactions]);
  const entries = Object.entries(grouped);

  return (
    <main className="page-content">
      <div className="page-header">
        <div><p className="greeting">Every detail, in its place</p><h1 className="page-title">Transactions</h1></div>
        <button className="primary-button" type="button" onClick={onAdd}><Plus size={17} /><span className="desktop-label">Add transaction</span><span className="mobile-label">Add</span></button>
      </div>
      <div className="history-tools">
        <label className="search-field"><Search size={17} /><input aria-label="Search transactions" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your history" /></label>
        <div className="filter-pills" role="group" aria-label="Filter transactions">
          {(["All", "Purchases", "Money in"] as Filter[]).map((option) => <button key={option} type="button" className={`filter-pill ${filter === option ? "active" : ""}`} aria-pressed={filter === option} onClick={() => setFilter(option)}>{option}</button>)}
        </div>
      </div>
      <section className="panel section-panel">
        {entries.length ? entries.map(([month, items]) => <div key={month}>
          <div className="month-label">{month}</div>
          <div className="transaction-list">{items.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} getImageUrl={getImageUrl} onClick={onSelect} />)}</div>
        </div>) : <div className="empty-state">
          <span className="empty-art"><Search size={21} /></span>
          <h3>{transactions.length ? "Nothing matches that search" : "No transactions yet"}</h3>
          <p>{transactions.length ? "Try a different name, note, or payment method." : "When you add an entry, it will find a home here."}</p>
          {!transactions.length && <button className="primary-button" type="button" onClick={onAdd}><Plus size={16} /> Add a transaction</button>}
        </div>}
      </section>
    </main>
  );
}