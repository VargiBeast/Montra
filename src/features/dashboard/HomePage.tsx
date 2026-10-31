import { useAuth } from '@/features/authentication/AuthProvider';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Target, Radar } from 'lucide-react';
import './HomePage.css';

export function HomePage() {
  const { user } = useAuth();
  const firstName =
    user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'there';

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

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
          <p className="home__balance-value">—</p>
          <p className="home__balance-hint">Sign in and add transactions to see your balance</p>

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
          <h2>Overview</h2>
        </div>
        <div className="home__stats">
          <div className="home__stat">
            <div className="home__stat-icon home__stat-icon--in">
              <ArrowDownRight size={18} />
            </div>
            <div>
              <p className="home__stat-label">Income</p>
              <p className="home__stat-value">—</p>
            </div>
          </div>
          <div className="home__stat">
            <div className="home__stat-icon home__stat-icon--out">
              <ArrowUpRight size={18} />
            </div>
            <div>
              <p className="home__stat-label">Expenses</p>
              <p className="home__stat-value">—</p>
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
          <p>Insights appear here once you have transaction history.</p>
        </div>
      </section>

      <section className="home__section">
        <div className="home__section-header">
          <h2>
            <Target size={18} /> Goals
          </h2>
          <button type="button" className="home__link">
            View all
          </button>
        </div>
        <div className="home__card home__card--empty">
          <p>Create a savings goal to start tracking progress.</p>
        </div>
      </section>

      <section className="home__section">
        <div className="home__section-header">
          <h2>
            <TrendingUp size={18} /> Recent activity
          </h2>
          <button type="button" className="home__link">
            See all
          </button>
        </div>
        <div className="home__card home__card--empty">
          <p>Your latest transactions will show here.</p>
        </div>
      </section>
    </div>
  );
}
