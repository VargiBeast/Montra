import { Link } from 'react-router-dom';
import { ArrowRight, Shield, TrendingUp, Receipt, Target } from 'lucide-react';
import './LandingPage.css';

const features = [
  {
    icon: TrendingUp,
    title: 'Track everything',
    body: 'Income, expenses and balance in one clean view. Always up to date.',
  },
  {
    icon: Receipt,
    title: 'Receipts with OCR',
    body: 'Snap a receipt. We extract the details — you confirm before anything is saved.',
  },
  {
    icon: Target,
    title: 'Goals & wishlist',
    body: 'Save toward what matters and keep wishlists linked to real progress.',
  },
  {
    icon: Shield,
    title: 'Private by design',
    body: 'Your data is isolated per account. No shared feeds, no surprises.',
  },
];

export function LandingPage() {
  return (
    <div className="landing">
      <header className="landing__nav">
        <div className="landing__brand">Montra</div>
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
        <p className="landing__eyebrow">Personal finance, refined</p>
        <h1>
          Track your money.
          <br />
          Understand it.
          <br />
          Plan it.
        </h1>
        <p className="landing__lead">
          Montra is a private space for transactions, receipts, goals and clear insights —
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
      </section>

      <section id="features" className="landing__features">
        <h2>Built for clarity</h2>
        <div className="landing__grid">
          {features.map((f) => (
            <article key={f.title} className="landing__card">
              <div className="landing__icon">
                <f.icon size={22} strokeWidth={1.75} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing__cta-block">
        <h2>Ready when you are</h2>
        <p>Create an account in under a minute. Your data stays yours.</p>
        <Link to="/login" className="landing__cta">
          Get started free
        </Link>
      </section>

      <footer className="landing__footer">
        <span>Montra</span>
        <span className="landing__footer-meta">© {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}
