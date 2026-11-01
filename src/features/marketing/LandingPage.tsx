import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Shield,
  TrendingUp,
  Receipt,
  Target,
  Sparkles,
} from 'lucide-react';
import './LandingPage.css';

const features = [
  {
    icon: TrendingUp,
    title: 'Clear balance',
    body: 'Income, expenses and net in one view. Always in NOK, always yours.',
  },
  {
    icon: Receipt,
    title: 'Receipts + OCR',
    body: 'Photograph a receipt. We suggest details — you confirm before anything is saved.',
  },
  {
    icon: Target,
    title: 'Goals that stick',
    body: 'Track progress toward what you actually want. Linked to wishlist when it helps.',
  },
  {
    icon: Shield,
    title: 'Private by default',
    body: 'Your data is isolated per account. No shared feeds, no ads in the product.',
  },
];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      <header className="landing__nav">
        <div className="landing__brand">
          <span className="landing__mark">M</span>
          Montra
        </div>
        <div className="landing__nav-actions">
          <Link to="/login" className="landing__link">
            Sign in
          </Link>
          <Link to="/login" className="landing__cta landing__cta--sm">
            Get started
          </Link>
        </div>
      </header>

      <section className="landing__hero">
        <div className="landing__hero-copy">
          <p className="landing__eyebrow">
            <Sparkles size={14} /> Personal finance, refined
          </p>
          <h1>
            Track your money.
            <br />
            <span className="landing__accent">Understand it.</span>
            <br />
            Plan it.
          </h1>
          <p className="landing__lead">
            A private space for transactions, receipts, goals and clear insights —
            without the noise of a typical banking app.
          </p>
          <div className="landing__hero-actions">
            <Link to="/login" className="landing__cta">
              Open Montra <ArrowRight size={18} />
            </Link>
            <a href="#features" className="landing__ghost">
              See features
            </a>
          </div>
        </div>

        <div className="landing__mock" aria-hidden>
          <div className="landing__mock-card">
            <div className="landing__mock-label">Total balance</div>
            <div className="landing__mock-balance">12 480 kr</div>
            <div className="landing__mock-row">
              <div className="landing__mock-chip landing__mock-chip--in">
                <span>Income</span>
                <strong>8 200</strong>
              </div>
              <div className="landing__mock-chip landing__mock-chip--out">
                <span>Expenses</span>
                <strong>5 640</strong>
              </div>
            </div>
            <div className="landing__mock-bar">
              <div className="landing__mock-fill" style={{ width: '62%' }} />
            </div>
            <div className="landing__mock-meta">MacBook goal · 62%</div>
          </div>
        </div>
      </section>

      <section id="features" className="landing__features">
        <h2>Built for clarity</h2>
        <div className="landing__bento">
          {features.map((f, i) => (
            <article
              key={f.title}
              className={`landing__card${i === 0 ? ' landing__card--wide' : ''}`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="landing__icon">
                <f.icon size={22} strokeWidth={1.75} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing__plus-wrap">
        <div className="landing__plus">
          <div className="landing__plus-badge">
            <Sparkles size={14} /> Montra Plus
          </div>
          <h2>See where your money really goes</h2>
          <p>
            Category breakdowns, trends and forecasts — so you understand patterns, not just
            balances. Try Plus free for 7 days.
          </p>
          <div className="landing__plus-bars" aria-hidden>
            <div><i style={{ width: '48%' }} /><span>Food & dining</span></div>
            <div><i style={{ width: '31%' }} /><span>Transport</span></div>
            <div><i style={{ width: '21%' }} /><span>Shopping</span></div>
          </div>
          <button type="button" className="landing__cta landing__cta--on-dark" onClick={() => navigate('/plus')}>
            Explore Plus <ArrowRight size={18} />
          </button>
        </div>
      </section>

      <section className="landing__cta-block">
        <h2>Ready when you are</h2>
        <p>Create an account in under a minute. Your data stays yours.</p>
        <Link to="/login" className="landing__cta landing__cta--on-dark">
          Get started free <ArrowRight size={18} />
        </Link>
      </section>

      <footer className="landing__footer">
        <div className="landing__footer-top">
          <span className="landing__footer-brand">Montra</span>
          <nav className="landing__footer-links" aria-label="Legal">
            <Link to="/legal/privacy">Privacy</Link>
            <Link to="/legal/terms">Terms</Link>
            <Link to="/legal/refund">Refunds</Link>
          </nav>
        </div>
        <p className="landing__footer-copy">© {new Date().getFullYear()} Montra</p>
      </footer>
    </div>
  );
}
