import { useEffect, useState } from "react";
import { ArrowDownUp, Home, Moon, Plus, Receipt, UserRound } from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { useTransactions } from "./hooks/useTransactions";
import { useReceipts } from "./hooks/useReceipts";
import type { Transaction, TransactionInput } from "./types/transaction";
import { HomePage } from "./pages/HomePage";
import { TransactionsPage } from "./pages/TransactionsPage";
import { MorePage } from "./pages/MorePage";
import { ProfilePage } from "./pages/ProfilePage";
import { ReceiptsPage } from "./pages/ReceiptsPage";
import { LoginPage } from "./pages/LoginPage";
import { TransactionForm } from "./components/TransactionForm";
import { TransactionDetail } from "./components/TransactionDetail";
import { ReceiptDetail } from "./components/ReceiptDetail";
import { ReceiptCapture } from "./components/ReceiptCapture";
import { UserAvatar } from "./components/UserAvatar";
import { useDisplayCurrency } from "./lib/currency";
import { useLanguage, useTranslation } from "./lib/i18n";
import { fetchUserPreferences } from "./lib/preferences";

type Page = "home" | "transactions" | "more" | "profile" | "receipts";
type Theme = "light" | "dark" | "system";

function initialTheme(): Theme {
  try {
    const saved = window.localStorage.getItem("saldo-theme") ?? window.localStorage.getItem("saldo_theme");
    return saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
  } catch { return "system"; }
}

function LoadingView() {
  const t = useTranslation();
  return (
    <main className="app-shell">
      <div className="app-frame" role="status" aria-label={t("loadingAccount")}>
        <span className="visually-hidden">{t("loadingTransactions")}</span>
        <div className="topbar"><div className="brand"><span className="brand-mark" aria-hidden="true"><img className="mark-light" src="/branding/mark-light.png" alt="" /><img className="mark-dark" src="/branding/mark-dark.png" alt="" /></span>MONTRA</div><span className="loading-block" style={{ width: 42, height: 42, margin: 0, borderRadius: 15 }} /></div>
        <div className="loading-block" style={{ height: 250, borderRadius: 28 }} />
        <div className="loading-block" style={{ height: 180, borderRadius: 24 }} />
      </div>
    </main>
  );
}

function App() {
  const t = useTranslation();
  const { setLanguage } = useLanguage();
  const { currency, setCurrency, convertToBase } = useDisplayCurrency();
  const auth = useAuth();
  const data = useTransactions(auth.user?.id);
  const receipts = useReceipts(auth.user?.id);
  const [page, setPage] = useState<Page>("home");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<import("./types/receipt").Receipt | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [deletingReceipt, setDeletingReceipt] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [toast, setToast] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let isDark = theme === "dark";
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    if (theme === "system") isDark = media.matches;
    function applyColorScheme(dark: boolean) {
      document.documentElement.dataset.theme = dark ? "dark" : "light";
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#111214" : "#f2f0eb");
    }
    applyColorScheme(isDark);
    if (theme === "system") {
      const update = (event: MediaQueryListEvent) => applyColorScheme(event.matches);
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }
    return undefined;
  }, [theme]);

  useEffect(() => {
    try { window.localStorage.setItem("saldo-theme", theme); } catch { /* Theme still works for this session. */ }
  }, [theme]);

  useEffect(() => {
    const userId = auth.user?.id;
    if (!userId) return;
    let active = true;
    void fetchUserPreferences(userId)
      .then((preferences) => {
        if (!active || !preferences) return;
        setLanguage(preferences.locale);
        setCurrency(preferences.currency);
      })
      .catch((reason: unknown) => {
        console.error("Could not load Montra preferences.", reason);
      });
    return () => { active = false; };
  }, [auth.user?.id, setCurrency, setLanguage]);

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
      setFormOpen(false);
      setToast(existing ? t("transactionUpdated") : t("transactionSaved"));
    } finally {
      setSaving(false);
    }
  }

  async function deleteTransaction(transaction: Transaction) {
    if (!window.confirm(t("deleteConfirm"))) return;
    setDeleting(true);
    try {
      await data.remove(transaction);
      setSelected(null);
    } catch (reason) {
      setToast(reason instanceof Error ? reason.message : t("deleteFailed"));
    } finally {
      setDeleting(false);
    }
  }

  async function deleteReceipt(receipt: import("./types/receipt").Receipt) {
    if (!window.confirm(t("receiptDeleteConfirm"))) return;
    setDeletingReceipt(true);
    try {
      await receipts.remove(receipt);
      setSelectedReceipt(null);
      setToast(t("receiptDeleted"));
    } catch (reason) {
      setToast(reason instanceof Error ? reason.message : t("receiptDeleteFailed"));
    } finally {
      setDeletingReceipt(false);
    }
  }

  if (auth.loading) return <LoadingView />;
  if (!auth.user) {
    return (
      <LoginPage
        busy={authBusy}
        onGoogle={async () => { setAuthBusy(true); try { await auth.signInWithGoogle(); } finally { setAuthBusy(false); } }}
        onApple={async () => { setAuthBusy(true); try { await auth.signInWithApple(); } finally { setAuthBusy(false); } }}
        onEmail={async (email) => { setAuthBusy(true); try { await auth.signInWithEmail(email); } finally { setAuthBusy(false); } }}
        onVerify={async (email, token) => { setAuthBusy(true); try { await auth.verifyEmailOtp(email, token); } finally { setAuthBusy(false); } }}
      />
    );
  }

  if (data.error) {
    return (
      <main className="app-shell">
        <div className="app-frame error-screen">
          <div className="error-card panel">
            <h1>{t("entriesDidNotLoad")}</h1>
            <p>{data.error.message || t("transactionError")}</p>
            <button className="primary-button" type="button" onClick={() => window.location.reload()}>{t("tryAgain")}</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-frame">
        <header className="topbar">
          <div className="brand"><span className="brand-mark" aria-hidden="true"><img className="mark-light" src="/branding/mark-light.png" alt="" /><img className="mark-dark" src="/branding/mark-dark.png" alt="" /></span>MONTRA</div>
          <div className="top-actions">
            <button className="icon-button" type="button" aria-label={t("openAppearance")} onClick={() => setPage("more")}><Moon size={18} /></button>
            <button className="avatar" type="button" aria-label={t("openProfile")} onClick={() => setPage("profile")}><UserAvatar user={auth.user} fallback={(auth.user.email ?? "M").slice(0, 1).toUpperCase()} /></button>
          </div>
        </header>

        {page === "home" && (
          <HomePage
            transactions={data.transactions}
            getImageUrl={data.getImageUrl}
            name={auth.user.user_metadata?.full_name || auth.user.user_metadata?.name || auth.user.email || t("nameFallback")}
            onAdd={startAdd}
            onSelect={setSelected}
            onViewAll={() => setPage("transactions")}
          />
        )}
        {page === "transactions" && (
          <TransactionsPage transactions={data.transactions} getImageUrl={data.getImageUrl} onAdd={startAdd} onSelect={setSelected} />
        )}
        {page === "receipts" && (
          <ReceiptsPage
            receipts={receipts.receipts}
            getImageUrl={receipts.getImageUrl}
            uploading={uploadingReceipt}
            onAdd={() => setCaptureOpen(true)}
            onSelect={setSelectedReceipt}
          />
        )}
        {page === "more" && (
          <MorePage
            userId={auth.user.id}
            theme={theme}
            onThemeChange={setTheme}
            transactions={data.transactions}
            onImport={async (records) => { await data.importRecords(records); }}
            onProfile={() => setPage("profile")}
            onSignOut={async () => { setSigningOut(true); try { await auth.signOut(); } finally { setSigningOut(false); } }}
          />
        )}
        {page === "profile" && (
          <ProfilePage
            user={auth.user}
            busy={signingOut}
            onBack={() => setPage("more")}
            onSignOut={async () => { setSigningOut(true); try { await auth.signOut(); } finally { setSigningOut(false); } }}
          />
        )}
      </div>
      <nav className="bottom-nav" aria-label={t("mainNavigation")}>
        <button type="button" className={`nav-item ${page === "home" ? "active" : ""}`} aria-current={page === "home" ? "page" : undefined} onClick={() => setPage("home")}><Home size={19} /><span>{t("home")}</span></button>
        <button type="button" className={`nav-item ${page === "transactions" ? "active" : ""}`} aria-current={page === "transactions" ? "page" : undefined} onClick={() => setPage("transactions")}><ArrowDownUp size={19} /><span>{t("activity")}</span></button>
        <button type="button" className="nav-add" aria-label={t("addTransaction")} onClick={startAdd}><Plus size={23} /></button>
        <button type="button" className={`nav-item ${page === "receipts" ? "active" : ""}`} aria-current={page === "receipts" ? "page" : undefined} onClick={() => setPage("receipts")}><Receipt size={19} /><span>{t("receipts")}</span></button>
        <button type="button" className={`nav-item ${page === "more" || page === "profile" ? "active" : ""}`} aria-current={page === "more" ? "page" : undefined} onClick={() => setPage("more")}><UserRound size={19} /><span>{t("more")}</span></button>
      </nav>
      <TransactionForm open={formOpen} existing={editing} busy={saving} onClose={() => setFormOpen(false)} onSave={saveTransaction} />
      <TransactionDetail transaction={selected} getImageUrl={data.getImageUrl} onClose={() => setSelected(null)} onEdit={startEdit} onDelete={(transaction) => void deleteTransaction(transaction)} deleting={deleting} />
      {toast && <div className="toast" role="status">{toast}</div>}
      <ReceiptCapture
        open={captureOpen}
        currency={currency}
        onClose={() => setCaptureOpen(false)}
        onUpload={async (file) => {
          setUploadingReceipt(true);
          try {
            return await receipts.upload(file);
          } finally {
            setUploadingReceipt(false);
          }
        }}
        onSave={async (receipt, fields) => {
          await receipts.update(receipt, {
            merchant: fields.merchant || null,
            total_amount: fields.totalAmount,
            currency: fields.currency,
            receipt_date: fields.receiptDate || null,
            status: fields.status,
          });

          if (
            fields.status === "confirmed" &&
            fields.deductFromBalance &&
            fields.totalAmount != null &&
            Number.isFinite(fields.totalAmount) &&
            fields.totalAmount > 0
          ) {
            const marker = `montra:receipt:${receipt.id}`;
            const alreadyLinked = data.transactions.some(
              (transaction) => typeof transaction.note === "string" && transaction.note.includes(marker),
            );
            if (!alreadyLinked) {
              const amountInBase = Math.round(convertToBase(fields.totalAmount, fields.currency) * 100) / 100;
              const merchantName = fields.merchant.trim() || t("receiptUntitled");
              const transactionDate = fields.receiptDate || new Date().toISOString().slice(0, 10);
              await data.save({
                type: "out",
                name: merchantName,
                amount: amountInBase,
                date: transactionDate,
                method: null,
                link: null,
                note: marker,
                image: null,
              });
            }
          }

          setToast(fields.status === "confirmed" ? t("receiptConfirmed") : t("receiptUploaded"));
        }}
      />
      <ReceiptDetail
        receipt={selectedReceipt}
        getImageUrl={receipts.getImageUrl}
        onClose={() => setSelectedReceipt(null)}
        onDelete={(receipt) => void deleteReceipt(receipt)}
        deleting={deletingReceipt}
      />
    </div>
  );
}

export default App;
