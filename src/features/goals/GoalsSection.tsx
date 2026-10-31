import { useState, type FormEvent } from 'react';
import { useSavingsGoals } from '@/hooks/useSavingsGoals';
import { formatMoney } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';
import './GoalsSection.css';

export function GoalsSection() {
  const { goals, loading, save, remove } = useSavingsGoals();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('0');
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await save({
        name: name.trim(),
        target_amount: parseFloat(target.replace(',', '.')),
        current_amount: parseFloat(current.replace(',', '.')) || 0,
        deadline: null,
      });
      setName('');
      setTarget('');
      setCurrent('0');
      setOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="goals-sec">
      <div className="goals-sec__header">
        <h2>Savings goals</h2>
        <button type="button" className="goals-sec__add" onClick={() => setOpen(true)}>
          <Plus size={18} /> New
        </button>
      </div>

      {loading ? (
        <p className="goals-sec__empty">Loading…</p>
      ) : goals.length === 0 ? (
        <p className="goals-sec__empty">No goals yet. Create one to track progress.</p>
      ) : (
        <ul className="goals-sec__list">
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100));
            return (
              <li key={g.id} className="goals-sec__item">
                <div className="goals-sec__top">
                  <span className="goals-sec__name">{g.name}</span>
                  <button
                    type="button"
                    className="goals-sec__del"
                    onClick={() => confirm('Delete goal?') && remove(g)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="goals-sec__bar">
                  <div className="goals-sec__fill" style={{ width: `${pct}%` }} />
                </div>
                <p className="goals-sec__meta">
                  {formatMoney(g.current_amount)} / {formatMoney(g.target_amount)} · {pct}%
                </p>
              </li>
            );
          })}
        </ul>
      )}

      {open && (
        <div className="goals-sec__modal">
          <form onSubmit={handleCreate} className="goals-sec__form">
            <h3>New goal</h3>
            <input
              required
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              required
              inputMode="decimal"
              placeholder="Target amount"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
            <input
              inputMode="decimal"
              placeholder="Current amount"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
            <div className="goals-sec__actions">
              <button type="button" onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
