import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import type { Transaction } from "../types/transaction";
import { TransactionRow } from "../components/TransactionRow";
import { readLanguage } from "../lib/i18n";
import { useTranslation } from "../lib/i18n";

type Filter = "All" | "Purchases" | "Money in";
interface TransactionsPageProps {
  transactions: Transaction[];
  getImageUrl: (path: string) => Promise<string>;
  onAdd: () => void;
  onSelect: (transaction: Transaction) => void;
}

function monthHeading(dateString: string, otherLabel: string) {
  const date = new Date(`${dateString}T12:00:00`);
  return Number.isNaN(date.getTime()) ? otherLabel : new Intl.DateTimeFormat(readLanguage(), { month: "long", year: "numeric" }).format(date);
}

export function TransactionsPage({ transactions, getImageUrl, onAdd, onSelect }: TransactionsPageProps) {
  const t = useTranslation();
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
      const label = monthHeading(item.date, t("otherDates"));
      groups[label] ??= [];
      groups[label].push(item);
      return groups;
    }, {});
  }, [filter, query, transactions, t]);
  const entries = Object.entries(grouped);

  return (
    <main className="page-content">
      <div className="page-header">
        <div><p className="greeting">{t("transactionPageGreeting")}</p><h1 className="page-title">{t("activity")}</h1></div>
        <button className="primary-button" type="button" onClick={onAdd}><Plus size={17} /><span className="desktop-label">{t("addTransaction")}</span><span className="mobile-label">{t("addEntry")}</span></button>
      </div>
      <div className="history-tools">
        <label className="search-field"><Search size={17} /><input aria-label={t("searchTransactions")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("searchHistory")} /></label>
        <div className="filter-pills" role="group" aria-label={t("filterTransactions")}>
          {(["All", "Purchases", "Money in"] as Filter[]).map((option) => <button key={option} type="button" className={`filter-pill ${filter === option ? "active" : ""}`} aria-pressed={filter === option} onClick={() => setFilter(option)}>{t(option === "All" ? "all" : option === "Purchases" ? "purchases" : "moneyIn")}</button>)}
        </div>
      </div>
      <section className="panel section-panel">
        {entries.length ? entries.map(([month, items]) => <div key={month}>
          <div className="month-label">{month}</div>
          <div className="transaction-list">{items.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} getImageUrl={getImageUrl} onClick={onSelect} />)}</div>
        </div>) : <div className="empty-state">
          <span className="empty-art"><Search size={21} /></span>
          <h3>{transactions.length ? t("nothingMatches") : t("noTransactions")}</h3>
          <p>{transactions.length ? t("tryDifferentSearch") : t("firstEntryWillAppear")}</p>
          {!transactions.length && <button className="primary-button" type="button" onClick={onAdd}><Plus size={16} /> {t("addTransaction")}</button>}
        </div>}
      </section>
    </main>
  );
}