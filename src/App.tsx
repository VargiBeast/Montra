import { useEffect, useState } from "react";
import { ArrowDownUp, Home, Moon, Plus, UserRound, WalletCards } from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { useTransactions } from "./hooks/useTransactions";
import type { Transaction, TransactionInput } from "./types/transaction";
import { HomePage } from "./pages/HomePage";
import { TransactionsPage } from "./pages/TransactionsPage";
import { MorePage } from "./pages/MorePage";
import { ProfilePage } from "./pages/ProfilePage";
import { LoginPage } from "./pages/LoginPage";
import { TransactionForm } from "./components/TransactionForm";
import { TransactionDetail } from "./components/TransactionDetail";
import { UserAvatar } from "./components/UserAvatar";

type Page = "home" | "transactions" | "more" | "profile";
type Theme = "light" | "dark" | "system";

function initialTheme(): Theme {
  try {
    const saved = window.localStorage.getItem("saldo-theme") ?? window.localStorage.getItem("saldo_theme");
    return saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
  } catch { return "system"; }
}

function LoadingView() {
  return (
    <main className="app-shell">
      <div className="app-frame" role="status" aria-label="Loading your Saldo account">
        <span className="visually-hidden">Loading your account and transactions…</span>
        <div className="topbar"><div className="brand"><span className="brand-mark"><WalletCards size={18} /></span>saldo</div><span className="loading-block" style={{ width: 42, height: 42, margin: 0, borderRadius: 15 }} /></div>
        <div className="loading-block" style={{ height: 250, borderRadius: 28 }} />
        <div className="loading-block" style={{ height: 180, borderRadius: 24 }} />
      </div>
    </main>
  );
}

function App() {
  const auth = useAuth();
  const data = useTransactions(auth.user?.id);
  const [page, setPage] = useState<Page>("home");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [toast, setToast] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let isDark = theme === "dark";
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    if (theme === "system") isDark = media.matches;
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    if (theme === "system") {
      const update = (event: MediaQueryListEvent) => { document.documentElement.dataset.theme = event.matches ? "dark" : "light"; };
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }
    return undefined;
  }, [theme]);

  useEffect(() => {
    try { window.localStorage.setItem("saldo-theme", theme); } catch { /* Theme still works for this session. */ }
  }, [theme]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function startAdd() {
    setEditing(null);
    setSelected(null);
    setFormOpen(true);
  }

  function startEdit(transaction: Transaction) {
    setSelected(null);
    setEditing(transaction);
    setFormOpen(true);
  }

  async function saveTransaction(input: TransactionInput, existing?: Transaction) {
    setSaving(true);
    try {
      await data.save(input, existing);
      setToast(existing ? "Transaction updated." : "Transaction saved.");
    } finally { setSaving(false); }
  }

  async function deleteTransaction(transaction: Transaction) {
    if (!window.confirm(`Delete “${transaction.name}”? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await data.remove(transaction);
      setSelected(null);
      setToast("Transaction deleted.");
    } catch (reason) {
      console.error("Could not delete a transaction.", reason);
      setToast("We couldn’t delete that transaction. Check your connection and try again.");
    } finally { setDeleting(false); }
  }

  async function doSignOut() {
    setSigningOut(true);
    try {
      await auth.signOut();
      setPage("home");
    } catch (reason) {
      console.error("Could not sign out.", reason);
      setToast("We couldn’t sign out. Check your connection and try again.");
    } finally { setSigningOut(false); }
  }

  async function signIn(provider: "google" | "apple") {
    setAuthBusy(true);
    try { await auth.signInWithProvider(provider); } catch { /* The auth hook exposes the actionable error. */ }
    finally { setAuthBusy(false); }
  }

  async function signInEmail(email: string) {
    setAuthBusy(true);
    try { await auth.signInWithEmail(email); }
    finally { setAuthBusy(false); }
  }

  function changeTheme(next: Theme) {
    setTheme(next);
    setToast(`${next === "system" ? "System" : next === "dark" ? "Dark" : "Light"} appearance selected.`);
  }

  if (auth.isLoading) return <LoadingView />;
  if (!auth.user) return <div className="app-shell"><LoginPage
    authError={auth.authError}
    busy={authBusy}
    isConfigured={auth.isConfigured}
    onGoogle={() => signIn("google")}
    onApple={() => signIn("apple")}
    onEmail={signInEmail}
    onRetry={auth.retrySession}
  />{toast && <div className="toast" role="status">{toast}</div>}</div>;

  const accountName = typeof auth.user.user_metadata?.full_name === "string"
    ? auth.user.user_metadata.full_name
    : typeof auth.user.user_metadata?.name === "string"
      ? auth.user.user_metadata.name
      : auth.user.email?.split("@")[0] || "there";
  const initials = accountName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return (
    <div className="app-shell">
      <div className="app-frame">
        <header className="topbar">
          <div className="brand"><span className="brand-mark"><WalletCards size={18} /></span>saldo</div>
          <div className="top-actions">
            <button className="icon-button" type="button" aria-label="Open appearance settings" onClick={() => setPage("more")}><Moon size={17} /></button>
          <button className="avatar" type="button" aria-label="Open profile" onClick={() => setPage("profile")}><UserAvatar user={auth.user} fallback={initials || <UserRound size={17} />} /></button>
          </div>
        </header>
        {data.isLoading ? <section aria-label="Loading transactions" role="status">
          <span className="visually-hidden">Loading your transactions…</span>
          <div className="loading-block" style={{ height: 250, borderRadius: 28 }} />
          <div className="loading-block" style={{ height: 180, borderRadius: 24 }} />
        </section> : data.error ? <div className="error-screen">
          <section className="panel error-card">
            <span className="empty-art" style={{ margin: "0 auto 16px" }}><ArrowDownUp size={22} /></span>
            <h2>Your entries didn’t come through</h2>
            <p>{data.error}</p>
            <button className="primary-button" type="button" onClick={() => void data.refresh()}>Try again</button>
          </section>
        </div> : <>
          {page === "home" && <HomePage transactions={data.transactions} getImageUrl={data.getImageUrl} name={accountName} onAdd={startAdd} onSelect={setSelected} onViewAll={() => setPage("transactions")} />}
          {page === "transactions" && <TransactionsPage transactions={data.transactions} getImageUrl={data.getImageUrl} onAdd={startAdd} onSelect={setSelected} />}
          {page === "more" && <MorePage
            theme={theme}
            onThemeChange={changeTheme}
            transactions={data.transactions}
            onImport={data.importBackup}
            onProfile={() => setPage("profile")}
            onSignOut={doSignOut}
          />}
          {page === "profile" && <ProfilePage user={auth.user} busy={signingOut} onBack={() => setPage("more")} onSignOut={doSignOut} />}
        </>}
      </div>
      <nav className="bottom-nav" aria-label="Main navigation">
        <button type="button" className={`nav-item ${page === "home" ? "active" : ""}`} aria-current={page === "home" ? "page" : undefined} onClick={() => setPage("home")}><Home size={19} /><span>Home</span></button>
        <button type="button" className={`nav-item ${page === "transactions" ? "active" : ""}`} aria-current={page === "transactions" ? "page" : undefined} onClick={() => setPage("transactions")}><ArrowDownUp size={19} /><span>Transactions</span></button>
        <button type="button" className="nav-add" aria-label="Add transaction" onClick={startAdd}><Plus size={23} /></button>
        <button type="button" className={`nav-item ${page === "more" || page === "profile" ? "active" : ""}`} aria-current={page === "more" ? "page" : undefined} onClick={() => setPage("more")}><WalletCards size={19} /><span>More</span></button>
      </nav>
      <TransactionForm open={formOpen} existing={editing} busy={saving} onClose={() => setFormOpen(false)} onSave={saveTransaction} />
      <TransactionDetail transaction={selected} getImageUrl={data.getImageUrl} onClose={() => setSelected(null)} onEdit={startEdit} onDelete={(transaction) => void deleteTransaction(transaction)} deleting={deleting} />
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

export default App;