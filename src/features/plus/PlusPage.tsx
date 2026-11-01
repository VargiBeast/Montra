import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check, Sparkles, BarChart3, LineChart, Shield, Settings } from 'lucide-react';
import { startPlusCheckout, openBillingPortal, type PlusPlan } from '@/lib/stripe';
import './PlusPage.css';

const freeFeatures = [
  'Transactions & balance',
  'Receipts with OCR',
  'Savings goals & wishlist',
  'Multi-currency display',
];

const plusFeatures = [
  { icon: BarChart3, text: 'Spending breakdowns by category' },
  { icon: LineChart, text: 'Trends and monthly forecasts' },
  { icon: Sparkles, text: 'Personalized insights' },
  { icon: Shield, text: 'Priority support' },
];

export function PlusPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const checkout = params.get('checkout');
  const [loading, setLoading] = useState<PlusPlan | 'portal' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout(plan: PlusPlan) {
    setError(null);
    setLoading(plan);
    const result = await startPlusCheckout(plan);
    setLoading(null);
    if ('url' in result) window.location.href = result.url;
    else setError(result.error);
  }

  async function handleManage() {
    setError(null);
    setLoading('portal');
    const result = await openBillingPortal();
    setLoading(null);
    if ('url' in result) window.location.href = result.url;
    else setError(result.error);
  }

  return (
    <div className="plus">
      <button type="button" className="plus__back" onClick={() => navigate(-1)}>
        ← Back
      </button>

      {checkout === 'success' && (
        <div className="plus__banner plus__banner--success">
          Welcome to Montra Plus. Your subscription is active.
        </div>
      )}
      {checkout === 'cancelled' && (
        <div className="plus__banner">Checkout was cancelled. You can start again anytime.</div>
      )}
      {error && <div className="plus__banner">{error}</div>}

      <div className="plus__hero">
        <div className="plus__icon">
          <Sparkles size={28} />
        </div>
        <h1>Montra Plus</h1>
        <p>Deeper clarity on spending, trends and what comes next — without the noise.</p>
      </div>

      <div className="plus__compare">
        <div className="plus__col">
          <h3>Free</h3>
          <ul>
            {freeFeatures.map((f) => (
              <li key={f}>
                <Check size={16} /> {f}
              </li>
            ))}
          </ul>
        </div>
        <div className="plus__col plus__col--plus">
          <h3>Plus</h3>
          <ul>
            {plusFeatures.map((f) => (
              <li key={f.text}>
                <f.icon size={16} /> {f.text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="plus__pricing">
        <div className="plus__plan plus__plan--featured">
          <span className="plus__badge">Best value</span>
          <h2>Yearly</h2>
          <p className="plus__price">
            329 <span>NOK</span>
          </p>
          <p className="plus__period">per year · 7-day free trial</p>
          <button
            type="button"
            className="plus__cta"
            disabled={!!loading}
            onClick={() => handleCheckout('yearly')}
          >
            {loading === 'yearly' ? 'Redirecting…' : 'Start free trial'}
          </button>
        </div>
        <div className="plus__plan">
          <h2>Monthly</h2>
          <p className="plus__price">
            39 <span>NOK</span>
          </p>
          <p className="plus__period">per month · 7-day free trial</p>
          <button
            type="button"
            className="plus__cta plus__cta--secondary"
            disabled={!!loading}
            onClick={() => handleCheckout('monthly')}
          >
            {loading === 'monthly' ? 'Redirecting…' : 'Start free trial'}
          </button>
        </div>
      </div>

      <button
        type="button"
        className="plus__manage"
        disabled={loading === 'portal'}
        onClick={handleManage}
      >
        <Settings size={18} />
        {loading === 'portal' ? 'Opening…' : 'Manage subscription'}
      </button>

      <p className="plus__note">
        Trial first, then billed via Stripe. Cancel anytime. See{' '}
        <a href="/legal/refund">Refund policy</a> and <a href="/legal/terms">Terms</a>.
      </p>
    </div>
  );
}
