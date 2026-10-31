import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';
import { startPlusCheckout, type PlusInterval } from '@/lib/stripe';
import './PlusPage.css';

const features = [
  'Advanced analytics & trends',
  'Financial forecasts',
  'Personalized insights',
  'Priority support',
];

export function PlusPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const checkout = params.get('checkout');
  const [loading, setLoading] = useState<PlusInterval | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout(interval: PlusInterval) {
    setError(null);
    setLoading(interval);
    const result = await startPlusCheckout(interval);
    setLoading(null);
    if ('url' in result) {
      window.location.href = result.url;
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="plus">
      <button type="button" className="plus__back" onClick={() => navigate(-1)}>
        ← Back
      </button>

      {checkout === 'success' && (
        <div className="plus__banner plus__banner--success">
          Welcome to Montra Plus! Your subscription is active.
        </div>
      )}
      {checkout === 'cancelled' && (
        <div className="plus__banner">Checkout was cancelled. You can try again anytime.</div>
      )}
      {error && <div className="plus__banner">{error}</div>}

      <div className="plus__hero">
        <div className="plus__icon"><Sparkles size={28} /></div>
        <h1>Montra Plus</h1>
        <p>Unlock advanced planning, forecasts and deeper insights.</p>
      </div>

      <div className="plus__pricing">
        <div className="plus__plan plus__plan--featured">
          <span className="plus__badge">Popular</span>
          <h2>Yearly</h2>
          <p className="plus__price">329 <span>NOK</span></p>
          <p className="plus__period">per year · 7-day trial</p>
          <button type="button" className="plus__cta" disabled={!!loading} onClick={() => handleCheckout('year')}>
            {loading === 'year' ? 'Redirecting…' : 'Start free trial'}
          </button>
        </div>
        <div className="plus__plan">
          <h2>Monthly</h2>
          <p className="plus__price">39 <span>NOK</span></p>
          <p className="plus__period">per month · 7-day trial</p>
          <button type="button" className="plus__cta plus__cta--secondary" disabled={!!loading} onClick={() => handleCheckout('month')}>
            {loading === 'month' ? 'Redirecting…' : 'Start free trial'}
          </button>
        </div>
      </div>

      <ul className="plus__features">
        {features.map((f) => (
          <li key={f}><Check size={18} />{f}</li>
        ))}
      </ul>

      <p className="plus__note">
        Checkout is handled by the existing Edge Function. Entitlements are verified server-side.
      </p>
    </div>
  );
}
