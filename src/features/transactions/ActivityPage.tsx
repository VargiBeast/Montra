import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Trash2 } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { formatMoney } from '@/lib/utils';
import { TransactionForm } from './TransactionForm';
import './ActivityPage.css';

export function ActivityPage() {
  const [params, setParams] = useSearchParams();
  const showAdd = params.get('action') === 'add';
  const { transactions, loading, error, remove, refresh } = useTransactions();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'in' | 'out'>('all');

  const filtered = useMemo(() => {
    let list = transactions;
    if (filter !== 'all') list = list.filter((t) => t.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.note && t.note.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [transactions, filter, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const tx of filtered) {
      const key = tx.date.slice(0, 7); // YYYY-MM
      const arr = map.get(key) ?? [];
      arr.push(tx);
      map.set(key, arr);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  function closeForm() {
    params.delete('action');
    setParams(params, { replace: true });
  }

  async function handleDelete(id: string) {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;
    if (!confirm(`Delete “${tx.name}”?`)) return;
    try {
      await remove(tx);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  return (
    <div className="activity">
      <header className="activity__header">
        <h1>Activity</h1>
        <div className="activity__tools">
          <button
            type="button"
            className="activity__icon-btn"
            aria-label="Search"
            onClick={() => document.getElementById('activity-search')?.focus()}
          >
            <Search size={20} />
          </button>
          <button
            type="button"
            className="activity__icon-btn"
            aria-label="Filter"
            onClick={() =>
              setFilter((f) => (f === 'all' ? 'out' : f === 'out' ? 'in' : 'all'))
            }
          >
            <Filter size={20} />
          </button>
        </div>
      </header>

      <div className="activity__search-row">
        <input
          id="activity-search"
          type="search"
          placeholder="Search transactions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="activity__search"
        />
        <div className="activity__filters">
          {(['all', 'in', 'out'] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={`activity__chip${filter === f ? ' activity__chip--active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'in' ? 'Income' : 'Expenses'}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="activity__error">{error}</div>}

      {loading ? (
        <div className="activity__empty">
          <p>Loading transactions…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="activity__empty">
          <p>No transactions yet.</p>
          <p className="activity__empty-hint">
            Tap the + button to add your first income or expense.
          </p>
        </div>
      ) : (
        <div className="activity__groups">
          {grouped.map(([month, txs]) => (
            <section key={month} className="activity__group">
              <h2 className="activity__month">{month}</h2>
              <ul className="activity__list">
                {txs.map((tx) => (
                  <li key={tx.id} className="activity__item">
                    <div className="activity__item-main">
                      <span className="activity__item-name">{tx.name}</span>
                      <span className="activity__item-date">{tx.date}</span>
                    </div>
                    <div className="activity__item-right">
                      <span
                        className={`activity__item-amount activity__item-amount--${tx.type}`}
                      >
                        {tx.type === 'in' ? '+' : '−'}
                        {formatMoney(Number(tx.amount))}
                      </span>
                      <button
                        type="button"
                        className="activity__delete"
                        aria-label="Delete"
                        onClick={() => handleDelete(tx.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {showAdd && (
        <TransactionForm
          onClose={closeForm}
          onSuccess={() => {
            refresh();
          }}
        />
      )}
    </div>
  );
}
