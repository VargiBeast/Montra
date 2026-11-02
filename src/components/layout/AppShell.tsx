import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, List, Plus, Receipt, MoreHorizontal, BarChart3, PanelLeftClose, PanelLeftOpen, Sparkles } from 'lucide-react';
import './AppShell.css';

type Item = { to: string; label: string; icon: typeof Home; end?: boolean };
const items: Item[] = [
  { to: '/app', label: 'Home', icon: Home, end: true },
  { to: '/app/activity', label: 'Activity', icon: List },
  { to: '/app/receipts', label: 'Receipts', icon: Receipt },
  { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/app/more', label: 'More', icon: MoreHorizontal },
];

function NavItem({ item, compact = false }: { item: Item; compact?: boolean }) {
  return <NavLink to={item.to} end={item.end} title={compact ? item.label : undefined} className={({ isActive }) => `app-shell__link${isActive ? ' app-shell__link--active' : ''}`}><item.icon size={19} strokeWidth={1.8} /><span>{item.label}</span></NavLink>;
}

export function AppShell() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  return <div className={`app-shell${collapsed ? ' app-shell--collapsed' : ''}`}>
    <aside className="app-shell__sidebar" aria-label="Primary navigation">
      <div className="app-shell__brand"><img src="/branding/mark-light.png" alt="" /><span>montra</span></div>
      <button className="app-shell__collapse" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}>{collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</button>
      <div className="app-shell__label">Workspace</div>
      <nav className="app-shell__links">{items.map((item) => <NavItem key={item.to} item={item} compact={collapsed} />)}</nav>
      <button type="button" className="app-shell__plus" onClick={() => navigate('/app/activity?action=add')}><Sparkles size={17} /><span>Montra Plus</span></button>
      <button type="button" className="app-shell__desktop-add" onClick={() => navigate('/app/activity?action=add')}><Plus size={18} /><span>Add transaction</span></button>
    </aside>
    <main className="app-shell__main"><Outlet /></main>
    <nav className="app-shell__nav" aria-label="Main navigation">{items.slice(0, 2).map((item) => <NavItem key={item.to} item={item} />)}<button type="button" className="app-shell__central" onClick={() => navigate('/app/activity?action=add')} aria-label="Add transaction"><Plus size={25} /></button>{items.slice(2, 4).map((item) => <NavItem key={item.to} item={item} />)}</nav>
  </div>;
}
