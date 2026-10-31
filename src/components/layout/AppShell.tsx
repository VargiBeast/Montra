import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, List, Plus, Receipt, MoreHorizontal } from 'lucide-react';
import './AppShell.css';

type NavItem =
  | { to: string; label: string; icon: typeof Home; end?: boolean; isCentral?: false }
  | { to: string; label: string; icon: typeof Plus; isCentral: true };

const navItems: NavItem[] = [
  { to: '/app', label: 'Home', icon: Home, end: true },
  { to: '/app/activity', label: 'Activity', icon: List },
  { to: '/add', label: 'Add', icon: Plus, isCentral: true },
  { to: '/app/receipts', label: 'Receipts', icon: Receipt },
  { to: '/app/more', label: 'More', icon: MoreHorizontal },
];

export function AppShell() {
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <main className="app-shell__main">
        <Outlet />
      </main>

      <nav className="app-shell__nav" aria-label="Main">
        {navItems.map((item) =>
          item.isCentral ? (
            <button
              key={item.to}
              type="button"
              className="app-shell__central"
              onClick={() => navigate('/app/activity?action=add')}
              aria-label="Add transaction"
            >
              <Plus size={28} strokeWidth={2.5} />
            </button>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `app-shell__item${isActive ? ' app-shell__item--active' : ''}`
              }
            >
              <item.icon size={22} strokeWidth={1.75} />
              <span>{item.label}</span>
            </NavLink>
          ),
        )}
      </nav>
    </div>
  );
}
