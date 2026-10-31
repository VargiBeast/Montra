import { useAuth } from '@/features/authentication/AuthProvider';
import {
  User, Globe, Palette, CreditCard, Shield, HelpCircle, LogOut, ChevronRight, Target, Gift,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoalsSection } from '@/features/goals/GoalsSection';
import { WishlistSection } from '@/features/wishlist/WishlistSection';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { SUPPORTED_CURRENCIES } from '@/lib/currency';
import './MorePage.css';

export function MorePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { currency, setCurrency } = useDisplayCurrency();

  async function handleLogout() {
    await signOut();
    navigate('/login');
  }

  return (
    <div className="more">
      <header className="more__header">
        <h1>More</h1>
        <p className="more__email">{user?.email}</p>
      </header>

      <section className="more__section">
        <h2><Target size={14} style={{display:'inline',marginRight:6}} />Goals</h2>
        <GoalsSection />
      </section>

      <section className="more__section">
        <h2><Gift size={14} style={{display:'inline',marginRight:6}} />Wishlist</h2>
        <WishlistSection />
      </section>

      <section className="more__section">
        <h2>Display currency</h2>
        <select
          className="more__select"
          value={currency}
          onChange={(e) => setCurrency(e.target.value as typeof currency)}
        >
          {SUPPORTED_CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <p className="more__hint">Amounts are stored in NOK and converted for display.</p>
      </section>

      <section className="more__section">
        <h2>Account</h2>
        <ul className="more__list">
          <li>
            <button type="button" className="more__item" onClick={() => navigate('/plus')}>
              <CreditCard size={20} /><span>Montra Plus</span><ChevronRight size={18} className="more__chevron" />
            </button>
          </li>
        </ul>
      </section>

      <section className="more__section">
        <h2>Support</h2>
        <ul className="more__list">
          <li>
            <button type="button" className="more__item">
              <HelpCircle size={20} /><span>Help & legal</span><ChevronRight size={18} className="more__chevron" />
            </button>
          </li>
        </ul>
      </section>

      <button type="button" className="more__logout" onClick={handleLogout}>
        <LogOut size={20} /> Sign out
      </button>
    </div>
  );
}
