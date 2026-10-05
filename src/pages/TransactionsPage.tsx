import { useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import type { Transaction } from "../types/transaction";
import { TransactionRow } from "../components/TransactionRow";
import { formatMoney, getBalanceSummary } from "../lib/utils";
import { useDisplayCurrency } from "../lib/currency";
import { useLanguage, useTranslation } from "../lib/i18n";

type Filter = "All" | "Purchases" | "Money in";

interface TransactionsPageProps {
  transactions: Transaction[];
  getImageUrl: (path: string) => Promise<string>;
  onAdd: () => void;
  onSelect: (transaction: Transaction) => void;
}

const ACTIVITY_FALLBACK: Record<string, string> = {
  activityResultCount: "{count} entries",
  clearFilters: "Clear filters",
  nothingMatches: "Nothing matches",
  tryDifferentSearch: "Try another name, note, or payment method.",
  noTransactions: "No transactions yet",
  firstEntryWillAppear: "When you add an entry, it will show up here.",
  transactionPageGreeting: "Your history, clearly ordered",
  activity: "Activity",
  addTransaction: "Add transaction",
  addEntry: "Add",
  searchTransactions: "Search transactions",
  searchHistory: "Search history",
  filterTransactions: "Filter transactions",
  all: "All",
  purchases: "Purchases",
  moneyIn: "Money in",
  otherDates: "Other dates",
};

function monthHeading(dateString: string, language: string, otherLabel: string) {
  const date = new Date(`${dateString}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? otherLabel
    : new Intl.DateTimeFormat(language, { month: "long", year: "numeric" }).format(date);
}

export function TransactionsPage({
  transactions,
  getImageUrl,
  onAdd,
  onSelect,
}: TransactionsPageProps) {
  const translate = useTranslation();
  const { language } = useLanguage();
  const { currency, convertFromBase } = useDisplayCurrency();
  const t = (key: string, values?: Record<string, string | number>) => {
    let value = translate(key, values);
    if (value === "\u2014") value = ACTIVITY_FALLBACK[key] ?? key;
    if (values) {
      value = value.replace(/\{(\w+)\}/g, (m, n) =>
        Object.hasOwn(values, n) ? String(values[n]) : m,
      );
    }
    return value;
  };

  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return transactions
      .filter((item) => {
        const inFilter =
          filter === "All" ||
          (filter === "Purchases" ? item.type === "out" : item.type === "in");
        if (!inFilter) return false;
        if (!normalized) return true;
        return [item.name, item.method, item.note].some((value) =>
          value?.toLowerCase().includes(normalized),
        );
      })
      .sort(
        (a, b) =>
          b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at),
      );
  }, [filter, query, transactions]);

  const otherDatesLabel = t("otherDates");
  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, Transaction[]>>((groups, item) => {
      const label = monthHeading(item.date, language, otherDatesLabel);
      groups[label] ??= [];
      groups[label].push(item);
      return groups;
    }, {});
  }, [filtered, language, otherDatesLabel]);

  const entries = Object.entries(grouped);
  const hasActiveFilters = filter !== "All" || query.trim().length > 0;
  const summary = useMemo(() => getBalanceSummary(filtered), [filtered]);
  const money = (value: number) =>
    formatMoney(value, currency, language, convertFromBase(value, currency));

  function clearFilters() {
    setFilter("All");
    setQuery("");
  }

  return (
    <main className="page-content activity-page">
      <div className="page-header">
        <div>
          <p className="greeting">{t("transactionPageGreeting")}</p>
          <h1 className="page-title">{t("activity")}</h1>
        </div>
        <button className="primary-button activity-add" type="button" onClick={onAdd}>
          <Plus size={17} />
          <span className="desktop-label">{t("addTransaction")}</span>
          <span className="mobile-label">{t("addEntry")}</span>
        </button>
      </div>

      <div className="history-tools">
        <label className="search-field">
          <Search size={17} aria-hidden="true" />
          <input
            aria-label={t("searchTransactions")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchHistory")}
            autoComplete="off"
            enterKeyHint="search"
          />
          {query.trim() && (
            <button
              type="button"
              className="search-clear"
              aria-label={t("clearFilters")}
              onClick={() => setQuery("")}
            >
              <X size={14} />
            </button>
          )}
        </label>
        <div className="filter-pills" role="group" aria-label={t("filterTransactions")}>
          {(["All", "Purchases", "Money in"] as Filter[]).map((option) => (
            <button
              key={option}
              type="button"
              className={`filter-pill ${filter === option ? "active" : ""}`}
              aria-pressed={filter === option}
              onClick={() => setFilter(option)}
            >
              {t(
                option === "All" ? "all" : option === "Purchases" ? "purchases" : "moneyIn",
              )}
            </button>
          ))}
        </div>
      </div>

      {transactions.length > 0 && (
        <div className="activity-summary panel" aria-live="polite">
          <span className="activity-summary-count">
            {t("activityResultCount", { count: filtered.length })}
          </span>
          {filtered.length > 0 && (
            <span className="activity-summary-totals">
              <span className="activity-sum-in">+{money(summary.totalIn)}</span>
              <span className="activity-sum-sep" aria-hidden="true">
                ·
              </span>
              <span className="activity-sum-out">{"\u2212"}{money(summary.totalOut)}</span>
            </span>
          )}
          {hasActiveFilters && (
            <button type="button" className="text-button activity-clear" onClick={clearFilters}>
              {t("clearFilters")}
            </button>
          )}
        </div>
      )}

      <section className="panel section-panel activity-list-panel">
        {entries.length ? (
          entries.map(([month, items]) => (
            <div key={month} className="activity-month-group">
              <div className="month-label">{month}</div>
              <ul className="transaction-list">
                {items.map((transaction) => (
                  <li key={transaction.id}>
                    <TransactionRow
                      transaction={transaction}
                      getImageUrl={getImageUrl}
                      onClick={onSelect}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <div className="empty-state activity-empty">
            <span className="empty-art" aria-hidden="true">
              <Search size={21} />
            </span>
            <h3>{transactions.length ? t("nothingMatches") : t("noTransactions")}</h3>
            <p>{transactions.length ? t("tryDifferentSearch") : t("firstEntryWillAppear")}</p>
            {transactions.length && hasActiveFilters ? (
              <button className="secondary-button" type="button" onClick={clearFilters}>
                {t("clearFilters")}
              </button>
            ) : null}
            {!transactions.length && (
              <button className="primary-button" type="button" onClick={onAdd}>
                <Plus size={16} /> {t("addTransaction")}
              </button>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
