import { useMemo } from 'react';
import { useAuth } from '@/features/authentication/AuthProvider';
import { useTransactions } from '@/hooks/useTransactions';
import { useSavingsGoals } from '@/hooks/useSavingsGoals';
import { formatMoney, toIsoDate } from '@/lib/utils';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Target, Radar } from 'lucide-react';
import './HomePage.css';

export function HomePage() {
  const { user } = useAuth();
  const { transactions, loading: txLoading } = useTransactions();
  const { goals, loading: goalsLoading } = useSavingsGoals();

  const firstName =
    (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'there';

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const summary = useMemo(() => {
    const now = new Date();
    const startOfMonth = toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const today = toIsoDate(now);

    let income = 0;
    let expenses = 0;
    let balance = 0;

    for (const tx of transactions) {
      const amount = Number(tx.amount) || 0;
      if (tx.type === 'in') {
        balance += amount;
        if (tx.date >= startOfMonth && tx.date <= today) income += amount;
      } else {
        balance -= amount;
        if (tx.date >= startOfMonth && tx.date <= today) expenses += amount;
      }
    }

    return {
      balance,
      income,
      expenses,
      recent: transactions.slice(0, 5),
    };
  }, [transactions]);

  const activeGoals = goals.filter((g) => g.current_amount < g.target_amount).slice(0, 3);

  return (
    <div className="home">
      <header className="home__hero">
        <div className="home__greeting">
          <span className="home__badge">Montra</span>
          <h1>
            {greeting}, <strong>{firstName}</strong>
          </h1>
        </div>

        <div className="home__balance-card">
          <p className="home__balance-label">Total Balance</p>
          <p className="home__balance-value">
            {txLoading ? '…' : formatMoney(summary.balance)}
          </p>
          <p className="home__balance-hint">Based on your transactions · NOK</p>

          <div className="home__balance-actions">
            <button type="button" className="home__action home__action--primary">
              Add money
            </button>
            <button type="button" className="home__action">
              Transfer
            </button>
          </div>
        </div>
      </header>

      <section className="home__section">
        <div className="home__section-header">
          <h2>This month</h2>
        </div>
        <div className="home__stats">
          <div className="home__stat">
            <div className="home__stat-icon home__stat-icon--in">
              <ArrowDownRight size={18} />
            </div>
            <div>
              <p className="home__stat-label">Income</p>
              <p className="home__stat-value">
                {txLoading ? '…' : formatMoney(summary.income)}
              </p>
            </div>
          </div>
          <div className="home__stat">
            <div className="home__stat-icon home__stat-icon--out">
              <ArrowUpRight size={18} />
            </div>
            <div>
              <p className="home__stat-label">Expenses</p>
              <p className="home__stat-value">
                {txLoading ? '…' : formatMoney(summary.expenses)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="home__section">
        <div className="home__section-header">
          <h2>
            <Radar size={18} /> Financial Radar
          </h2>
        </div>
        <div className="home__card home__card--empty">
          <p>
            {transactions.length < 3
              ? 'Add a few more transactions to unlock personalized insights.'
              : 'Insights engine ready — full radar view coming in next iteration.'}
          </p>
        </div>
      </section>

      <section className="home__section">
        <div className="home__section-header">
          <h2>
            <Target size={18} /> Goals
          </h2>
        </div>
        {goalsLoading ? (
          <div className="home__card home__card--empty">
            <p>Loading goals…</p>
          </div>
        ) : activeGoals.length === 0 ? (
          <div className="home__card home__card--empty">
            <p>Create a savings goal to start tracking progress.</p>
          </div>
        ) : (
          <div className="home__goals">
            {activeGoals.map((goal) => {
              const pct = Math.min(
                100,
                Math.round((goal.current_amount / goal.target_amount) * 100),
              );
              return (
                <div key={goal.id} className="home__goal-card">
                  <div className="home__goal-header">
                    <span className="home__goal-name">{goal.goal.name}</span>
                    <span className="home__goal-pct">{pct}%</span>
                  </div>
                  <div className="home__goal-bar">
                    <div className="home__goal-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="home__goal-meta">
                    {formatMoney(goal.current_amount)} / {formatMoney(goal.target_amount)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="home__section">
        <div className="home__section-header">
          <h2>
            <TrendingUp size={18} /> Recent activity
          </h2>
        </div>
        {txLoading ? (
          <div className="home__card home__card--empty">
            <p>Loading…</p>
          </div>
        ) : summary.recent.length === 0 ? (
          <div className="home__card home__card--empty">
            <p>Your latest transactions will show here.</p>
          </div>
        ) : (
          <ul className="home__tx-list">
            {summary.recent.map((tx) => (
              <li key={tx.id} className="home__tx-item">
                <div className="home__tx-info">
                  <span className="home__tx-name">{tx.name}</span>
                  <span className="home__tx-date">{tx.date}</span>
                </div>
                <span
                  className={`home__tx-amount home__tx-amount--${tx.type}`}
                >
                  {tx.type === 'in' ? '+' : '−'}
                  {formatMoney(Number(tx.amount))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
