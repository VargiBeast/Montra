import { useAuth } from '@/features/authentication/AuthProvider';
import {
  User,
  Globe,
  Palette,
  CreditCard,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Target,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoalsSection } from '@/features/goals/GoalsSection';
import './MorePage.css';

const sections = [
  {
    title: 'Account',
    items: [
      { icon: User, label: 'Profile', path: '/more/profile' },
      { icon: CreditCard, label: 'Montra Plus', path: '/plus' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: Globe, label: 'Language & currency', path: '/more/preferences' },
      { icon: Palette, label: 'Appearance', path: '/more/appearance' },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: Shield, label: 'Security', path: '/more/security' },
      { icon: HelpCircle, label: 'Help & legal', path: '/more/help' },
    ],
  },
];

export function MorePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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

      {sections.map((section) => (
        <section key={section.title} className="more__section">
          <h2>{section.title}</h2>
          <ul className="more__list">
            {section.items.map((item) => (
              <li key={item.label}>
                <button
                  type="button"
                  className="more__item"
                  onClick={() => navigate(item.path)}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                  <ChevronRight size={18} className="more__chevron" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <button type="button" className="more__logout" onClick={handleLogout}>
        <LogOut size={20} />
        Sign out
      </button>
    </div>
  );
}
