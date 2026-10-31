import { useState, type FormEvent } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { toIsoDate } from '@/lib/utils';
import type { TransactionType } from '@/types/transaction';
import './TransactionForm.css';

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
}

export function TransactionForm({ onClose, onSuccess }: Props) {
  const { create } = useTransactions();
  const [type, setType] = useState<TransactionType>('out');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(toIsoDate(new Date()));
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!name.trim()) {
      setError('Add a name');
      setSubmitting(false);
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Enter a valid amount greater than zero');
      setSubmitting(false);
      return;
    }

    try {
      await create({
        type,
        name: name.trim(),
        amount: parsedAmount,
        date,
        method: null,
        link: null,
        note: note.trim() || null,
        image: null,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save transaction');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="tx-form-overlay" role="dialog" aria-modal="true">
      <div className="tx-form">
        <header className="tx-form__header">
          <h2>New transaction</h2>
          <button type="button" className="tx-form__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="tx-form__type">
          <button
            type="button"
            className={`tx-form__type-btn${type === 'out' ? ' tx-form__type-btn--active' : ''}`}
            onClick={() => setType('out')}
          >
            Expense
          </button>
          <button
            type="button"
            className={`tx-form__type-btn${type === 'in' ? ' tx-form__type-btn--active' : ''}`}
            onClick={() => setType('in')}
          >
            Income
          </button>
        </div>

        <form onSubmit={handleSubmit} className="tx-form__body">
          <div className="tx-form__field">
            <label htmlFor="tx-amount">Amount (NOK)</label>
            <input
              id="tx-amount"
              type="text"
              inputMode="decimal"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              autoFocus
            />
          </div>

          <div className="tx-form__field">
            <label htmlFor="tx-name">Description</label>
            <input
              id="tx-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 'out' ? 'Coffee, groceries…' : 'Salary, refund…'}
            />
          </div>

          <div className="tx-form__field">
            <label htmlFor="tx-date">Date</label>
            <input
              id="tx-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="tx-form__field">
            <label htmlFor="tx-note">Note (optional)</label>
            <input
              id="tx-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any extra detail"
            />
          </div>

          {error && (
            <div className="tx-form__error" role="alert">
              {error}
            </div>
          )}

          <button type="submit" className="tx-form__submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save transaction'}
          </button>
        </form>
      </div>
    </div>
  );
}
