import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Wallet,
  PieChart,
  Calendar,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/features/authentication/AuthProvider';
import { useTransactions } from '@/hooks/useTransactions';
import { usePlusEntitlement } from '@/hooks/usePlusEntitlement';
import { buildAnalytics } from '@/lib/analytics';
import { formatMoney } from '@/lib/utils';
import './AnalyticsPage.css';

export function AnalyticsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { transactions, loading: txLoading } = useTransactions();
  const { hasPlus, isLoading: plusLoading } = usePlusEntitlement(user?.id);

  const snap = useMemo(() => buildAnalytics(transactions), [transactions]);

  if (plusLoading || txLoading) {
    return (
      <div className="an">
        <header className="an__top">
          <button type="button" className="an__back" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} /> Back
          </button>
          <h1>Analytics</h1>
        </header>
        <div className="an__loading">Loading insights…</div>
      </div>
    );
  }

  if (!hasPlus) {
    return (
      <div className="an">
        <header className="an__top">
          <button type="button" className="an__back" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} /> Back
          </button>
          <h1>Analytics</h1>
        </header>
        <div className="an__gate">
          <div className="an__gate-icon">
            <Sparkles size={28} />
          </div>
          <h2>Advanced analytics is a Plus feature</h2>
          <p>
            Unlock spending breakdowns, month-over-month trends and a simple forecast based on your
            real transactions — not demos.
          </p>
          <button type="button" className="an__gate-cta" onClick={() => navigate('/plus')}>
            Explore Montra Plus
          </button>
        </div>
      </div>
    );
  }

  const maxBar = Math.max(...snap.months.map((m) => Math.max(m.income, m.expenses)), 1);
  const mom = snap.expenseMomPct;

  return (
    <div className="an">
      <header className="an__top">
        <button type="button" className="an__back" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} /> Back
        </button>
        <div>
          <h1>Analytics</h1>
          <p className="an__sub">{snap.periodLabel} · from your data</p>
        </div>
      </header>

      {snap.txCount === 0 ? (
        <div className="an__empty">
          <AlertCircle size={22} />
          <p>No transactions yet. Add a few to see real insights here.</p>
        </div>
      ) : (
        <>
          {/* Hero KPIs */}
          <section className="an__hero">
            <div className="an__kpi an__kpi--wide">
              <span className="an__kpi-label">
                <Wallet size={14} /> Balance
              </span>
              <strong className="an__kpi-value">{formatMoney(snap.balance)}</strong>
              <span className="an__kpi-hint">{snap.txCount} transactions loaded</span>
            </div>
            <div className="an__kpi">
              <span className="an__kpi-label">Income</span>
              <strong className="an__kpi-value an__pos">{formatMoney(snap.incomeMonth)}</strong>
              <span className="an__kpi-hint">This month</span>
            </div>
            <div className="an__kpi">
              <span className="an__kpi-label">Expenses</span>
              <strong className="an__kpi-value an__neg">{formatMoney(snap.expensesMonth)}</strong>
              <span className="an__kpi-hint">
                {mom == null
                  ? 'This month'
                  : mom >= 0
                    ? `↑ ${mom.toFixed(0)}% vs last month`
                    : `↓ ${Math.abs(mom).toFixed(0)}% vs last month`}
              </span>
            </div>
            <div className="an__kpi">
              <span className="an__kpi-label">Net</span>
              <strong className={`an__kpi-value ${snap.netMonth >= 0 ? 'an__pos' : 'an__neg'}`}>
                {formatMoney(snap.netMonth)}
              </strong>
              <span className="an__kpi-hint">
                {snap.savingsRateMonth == null
                  ? 'This month'
                  : `Savings rate ${(snap.savingsRateMonth * 100).toFixed(0)}%`}
              </span>
            </div>
          </section>

          {/* Cashflow chart */}
          <section className="an__card">
            <div className="an__card-head">
              <h2>
                <TrendingUp size={18} /> Cashflow
              </h2>
              <span className="an__legend">
                <i className="an__dot an__dot--in" /> Income{' '}
                <i className="an__dot an__dot--out" /> Expenses
              </span>
            </div>
            <div className="an__chart">
              {snap.months.map((m) => (
                <div key={m.key} className="an__chart-col">
                  <div className="an__chart-bars">
                    <div
                      className="an__chart-bar an__chart-bar--in"
                      style={{ height: `${Math.max(3, (m.income / maxBar) * 100)}%` }}
                      title={`Income ${formatMoney(m.income)}`}
                    />
                    <div
                      className="an__chart-bar an__chart-bar--out"
                      style={{ height: `${Math.max(3, (m.expenses / maxBar) * 100)}%` }}
                      title={`Expenses ${formatMoney(m.expenses)}`}
                    />
                  </div>
                  <span className="an__chart-label">{m.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Methods */}
          <section className="an__card">
            <div className="an__card-head">
              <h2>
                <PieChart size={18} /> Where it goes
              </h2>
              <span className="an__muted">By payment method · this month</span>
            </div>
            {snap.methods.length === 0 ? (
              <p className="an__muted">No expenses recorded this month.</p>
            ) : (
              <ul className="an__methods">
                {snap.methods.map((m) => (
                  <li key={m.name}>
                    <div className="an__method-row">
                      <span className="an__method-name">{m.name}</span>
                      <span className="an__method-amt">{formatMoney(m.amount)}</span>
                    </div>
                    <div className="an__method-track">
                      <div
                        className="an__method-fill"
                        style={{ width: `${Math.round(m.share * 100)}%` }}
                      />
                    </div>
                    <span className="an__method-share">{(m.share * 100).toFixed(0)}%</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Highlights */}
          <section className="an__grid2">
            <div className="an__card an__card--compact">
              <h3>Avg. expense</h3>
              <p className="an__big">
                {snap.expenseCountMonth > 0 ? formatMoney(snap.avgExpenseMonth) : '—'}
              </p>
              <p className="an__muted">
                {snap.expenseCountMonth} expense{snap.expenseCountMonth === 1 ? '' : 's'} this month
              </p>
            </div>
            <div className="an__card an__card--compact">
              <h3>Largest expense</h3>
              <p className="an__big">
                {snap.topExpenseName ? formatMoney(snap.topExpenseAmount) : '—'}
              </p>
              <p className="an__muted">{snap.topExpenseName ?? 'No expenses yet'}</p>
            </div>
          </section>

          {/* Forecast */}
          <section className="an__card an__card--forecast">
            <div className="an__card-head">
              <h2>
                <Calendar size={18} /> Simple forecast
              </h2>
            </div>
            <p className="an__forecast-note">
              Average of your last {Math.min(3, snap.months.filter((m) => m.income > 0 || m.expenses > 0).length || 1)}{' '}
              active month{snap.months.filter((m) => m.income > 0 || m.expenses > 0).length === 1 ? '' : 's'} — not a
              promise, just a baseline from your history.
            </p>
            {snap.forecastExpenseNext == null ? (
              <p className="an__muted">Need a bit more history to forecast.</p>
            ) : (
              <div className="an__forecast-grid">
                <div>
                  <span>Expected income</span>
                  <strong className="an__pos">{formatMoney(snap.forecastIncomeNext ?? 0)}</strong>
                </div>
                <div>
                  <span>Expected expenses</span>
                  <strong className="an__neg">{formatMoney(snap.forecastExpenseNext)}</strong>
                </div>
                <div>
                  <span>Expected net</span>
                  <strong
                    className={
                      (snap.forecastNetNext ?? 0) >= 0 ? 'an__pos' : 'an__neg'
                    }
                  >
                    {formatMoney(snap.forecastNetNext ?? 0)}
                  </strong>
                </div>
              </div>
            )}
          </section>

          <p className="an__disclaimer">
            <TrendingDown size={14} /> All figures use your stored transactions (NOK). Insights update when you add or
            change activity.
          </p>
        </>
      )}
    </div>
  );
}
