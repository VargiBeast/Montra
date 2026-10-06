import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowDownUp, Home, Moon, Plus, Receipt, UserRound } from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { useTransactions } from "./hooks/useTransactions";
import { useReceipts } from "./hooks/useReceipts";
import { useSavingsGoals } from "./hooks/useSavingsGoals";
import { useWishlist } from "./hooks/useWishlist";
import type { Transaction, TransactionInput } from "./types/transaction";
import { HomePage } from "./pages/HomePage";
import { TransactionsPage } from "./pages/TransactionsPage";
import { MorePage } from "./pages/MorePage";
import { ProfilePage } from "./pages/ProfilePage";
import { ReceiptsPage } from "./pages/ReceiptsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { SavingsGoalsPage } from "./pages/SavingsGoalsPage";
import { WishlistPage } from "./pages/WishlistPage";
import { PlusPage } from "./pages/PlusPage";
import { LoginPage } from "./pages/LoginPage";
import { OnboardingFlow } from "./pages/OnboardingFlow";
import { TransactionForm } from "./components/TransactionForm";
import { TransactionDetail } from "./components/TransactionDetail";
import { ReceiptDetail } from "./components/ReceiptDetail";
import { ReceiptCapture } from "./components/ReceiptCapture";
import { UserAvatar } from "./components/UserAvatar";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { useDisplayCurrency } from "./lib/currency";
import { useLanguage, useTranslation } from "./lib/i18n";
import { fetchUserPreferences } from "./lib/preferences";
import { hasPlusAccess } from "./lib/plus";
import {
  clearGuestTransactions,
  dismissAccountPrompt,
  isAccountPromptDismissed,
  isOnboardingComplete,
  readGuestTransactions,
} from "./lib/onboarding";

type Page = "home" | "transactions" | "more" | "profile" | "receipts" | "analytics" | "savings" | "wishlist" | "plus";
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
  const savings = useSavingsGoals(auth.user?.id);
  const wishlist = useWishlist(auth.user?.id);
  const plusUnlocked = hasPlusAccess(auth.user?.email);
  const receipts = useReceipts(auth.user?.id);
  const navigate = useNavigate();
  const location = useLocation();
  const pathToPage = (pathname: string): Page => {
    if (pathname.startsWith("/activity")) return "transactions";
    if (pathname.startsWith("/transactions")) return "transactions";
    if (pathname.startsWith("/receipts")) return "receipts";
    if (pathname.startsWith("/wishlist")) return "wishlist";
    if (pathname.startsWith("/goals")) return "savings";
    if (pathname.startsWith("/profile")) return "profile";
    if (pathname.startsWith("/plus") || pathname.startsWith("/app/plus")) return "plus";
    if (pathname.startsWith("/analytics")) return "analytics";
    if (pathname.startsWith("/more") || pathname.startsWith("/settings")) return "more";
    if (pathname.startsWith("/home") || pathname === "/app" || pathname === "/app/") return "home";
    return "home";
  };
  const page = pathToPage(location.pathname);
  const setPage = (next: Page) => {
    const map: Record<Page, string> = {
      home: "/app",
      transactions: "/activity",
      more: "/more",
      profile: "/profile",
      receipts: "/receipts",
      analytics: "/analytics",
      savings: "/goals",
      wishlist: "/wishlist",
      plus: "/app/plus",
    };
    navigate(map[next] ?? "/app");
  };

  useEffect(() => {
    if (location.pathname.startsWith("/transactions/new")) {
      setEditing(null);
      setSelected(null);
      setFormOpen(true);
    }
  }, [location.pathname]);
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
  const [forceLogin, setForceLogin] = useState(false);
  const [guestTick, setGuestTick] = useState(0);
  const [accountPromptOpen, setAccountPromptOpen] = useState(() => !isAccountPromptDismissed());
  const [pendingDeleteTx, setPendingDeleteTx] = useState<Transaction | null>(null);
  const [pendingDeleteReceipt, setPendingDeleteReceipt] = useState<import("./types/receipt").Receipt | null>(null);
  const guestTransactions = guestTick >= 0 ? readGuestTransactions() : [];

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

  useEffect(() => {
    const userId = auth.user?.id;
    if (!userId) return;
    const guests = readGuestTransactions();
    if (guests.length === 0) return;
    let cancelled = false;
    void (async () => {
      try {
        for (const guest of guests) {
          if (cancelled) return;
          await data.save({
            type: guest.type,
            name: guest.name,
            amount: guest.amount,
            date: guest.date,
            method: guest.method,
            link: guest.link,
            note: guest.note,
            image: null,
          });
        }
        if (!cancelled) clearGuestTransactions();
      } catch (reason) {
        console.error("Could not migrate guest transactions.", reason);
      }
    })();
    return () => { cancelled = true; };
  }, [auth.user?.id]);

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

  function requestDeleteTransaction(transaction: Transaction) {
    setPendingDeleteTx(transaction);
  }

  async function confirmDeleteTransaction() {
    const transaction = pendingDeleteTx;
    if (!transaction) return;
    setDeleting(true);
    try {
      await data.remove(transaction);
      setSelected(null);
      setPendingDeleteTx(null);
      setToast(t("transactionDeleted"));
    } catch (reason) {
      setToast(reason instanceof Error ? reason.message : t("deleteFailed"));
    } finally {
      setDeleting(false);
    }
  }

  function requestDeleteReceipt(receipt: import("./types/receipt").Receipt) {
    setPendingDeleteReceipt(receipt);
  }

  async function confirmDeleteReceipt() {
    const receipt = pendingDeleteReceipt;
    if (!receipt) return;
    setDeletingReceipt(true);
    try {
      await receipts.remove(receipt);
      setSelectedReceipt(null);
      setPendingDeleteReceipt(null);
      setToast(t("receiptDeleted"));
    } catch (reason) {
      setToast(reason instanceof Error ? reason.message : t("receiptDeleteFailed"));
    } finally {
      setDeletingReceipt(false);
    }
  }



  async function doSignOut() {
    setSigningOut(true);
    try {
      await auth.signOut();
    } catch (reason) {
      console.error("Could not sign out.", reason);
      setToast(t("signOutFailed"));
    } finally { setSigningOut(false); }
  }

  async function signInGoogle() {
    setAuthBusy(true);
    try { await auth.signInWithProvider("google"); } catch { /* auth hook surfaces error */ }
    finally { setAuthBusy(false); }
  }

  async function signInMagicLink(email: string) {
    setAuthBusy(true);
    try { await auth.signInWithEmail(email); }
    finally { setAuthBusy(false); }
  }

  function changeTheme(next: Theme) {
    setTheme(next);
    const appearance = t(next === "system" ? "systemTheme" : next === "dark" ? "darkTheme" : "lightTheme");
    setToast(t("appearanceSelected", { appearance }));
  }

  if (auth.isLoading) return <LoadingView />;
  if (!auth.user) {
    const showOnboarding = !isOnboardingComplete() && !forceLogin;
    if (showOnboarding) {
      return (
        <>
          <OnboardingFlow
            onFinished={() => {
              setGuestTick((n) => n + 1);
              setAccountPromptOpen(true);
            }}
            onSignIn={() => setForceLogin(true)}
          />
          {toast && <div className="toast" role="status">{toast}</div>}
        </>
      );
    }
    if (forceLogin || !isOnboardingComplete()) {
      return (
        <div className="app-shell">
          <LoginPage
            authError={auth.authError}
            busy={authBusy}
            isConfigured={auth.isConfigured}
            onGoogle={signInGoogle}
            onMagicLink={signInMagicLink}
            onRetry={auth.retrySession}
          />
          {isOnboardingComplete() && (
            <button type="button" className="text-button" style={{ display: "block", margin: "12px auto", textAlign: "center" }} onClick={() => setForceLogin(false)}>
              {t("back")}
            </button>
          )}
          {toast && <div className="toast" role="status">{toast}</div>}
        </div>
      );
    }
    const guestName = t("nameFallback");
    return (
      <div className="app-shell">
        <div className="app-frame">
          <header className="topbar">
            <div className="brand">
              <span className="brand-mark" aria-hidden="true">
                <img className="mark-light" src="/branding/mark-light.png" alt="" />
                <img className="mark-dark" src="/branding/mark-dark.png" alt="" />
              </span>
              MONTRA
            </div>
            <div className="top-actions">
              <button className="secondary-button" type="button" onClick={() => setForceLogin(true)}>
                {t("onboardingSignIn")}
              </button>
            </div>
          </header>
          {accountPromptOpen && (
            <section className="panel guest-account-banner" aria-label={t("onboardingAccountTitle")}>
              <div>
                <strong>{t("onboardingAccountTitle")}</strong>
                <p>{t("onboardingAccountBody")}</p>
              </div>
              <div className="guest-account-actions">
                <button className="primary-button" type="button" onClick={() => setForceLogin(true)}>
                  {t("onboardingAccountCta")}
                </button>
                <button type="button" className="secondary-button" onClick={() => { dismissAccountPrompt(); setAccountPromptOpen(false); }}>
                  {t("onboardingAccountLater")}
                </button>
              </div>
            </section>
          )}
          <HomePage
            transactions={guestTransactions}
            getImageUrl={async () => ""}
            name={guestName}
            onAdd={() => setForceLogin(true)}
            onSelect={() => undefined}
            onViewAll={() => setForceLogin(true)}
            hasPlus={false}
          />
        </div>
        {toast && <div className="toast" role="status">{toast}</div>}
      </div>
    );
  }

  const accountName = typeof auth.user.user_metadata?.full_name === "string"
    ? auth.user.user_metadata.full_name
    : typeof auth.user.user_metadata?.name === "string"
      ? auth.user.user_metadata.name
      : auth.user.email?.split("@")[0] || t("nameFallback");
  const initials = accountName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return (
    <div className="app-shell">
      <div className="app-frame">
        <header className="topbar">
          <div className="brand"><span className="brand-mark" aria-hidden="true"><img className="mark-light" src="/branding/mark-light.png" alt="" /><img className="mark-dark" src="/branding/mark-dark.png" alt="" /></span>MONTRA</div>
          <div className="top-actions">
            <button className="icon-button" type="button" aria-label={t("openAppearance")} onClick={() => setPage("more")}><Moon size={18} /></button>
            <button className="avatar" type="button" aria-label={t("openProfile")} onClick={() => setPage("profile")}><UserAvatar user={auth.user} fallback={initials || <UserRound size={17} />} /></button>
          </div>
        </header>
        {data.isLoading ? <section aria-label={t("loadingTransactions")} role="status">
          <span className="visually-hidden">{t("loadingTransactions")}</span>
          <div className="loading-block" style={{ height: 250, borderRadius: 28 }} />
          <div className="loading-block" style={{ height: 180, borderRadius: 24 }} />
        </section> : data.error ? <div className="error-screen">
          <section className="panel error-card">
            <span className="empty-art" style={{ margin: "0 auto 16px" }}><ArrowDownUp size={22} /></span>
            <h2>{t("entriesDidNotLoad")}</h2>
            <p>{t("transactionError")}</p>
            <button className="primary-button" type="button" onClick={() => void data.refresh()}>{t("tryAgain")}</button>
          </section>
        </div> : <>
          {page === "home" && <HomePage
            transactions={data.transactions}
            getImageUrl={data.getImageUrl}
            name={accountName}
            onAdd={startAdd}
            onSelect={setSelected}
            onViewAll={() => setPage("transactions")}
            onGetPlus={() => setPage("plus")}
            hasPlus={plusUnlocked}
            onOpenAnalytics={() => setPage("analytics")}
            onOpenSavingsGoals={() => setPage("savings")}
            onOpenWishlist={() => setPage("wishlist")}
            savingsGoals={savings.goals}
            wishlistItems={wishlist.items}
          />}
          {page === "transactions" && <TransactionsPage transactions={data.transactions} getImageUrl={data.getImageUrl} onAdd={startAdd} onSelect={setSelected} />}
          {page === "more" && <MorePage
            userId={auth.user.id}
            theme={theme}
            onThemeChange={changeTheme}
            transactions={data.transactions}
            onImport={data.importBackup}
            onProfile={() => setPage("profile")}
            onSignOut={doSignOut}
            onSavingsGoals={() => setPage("savings")}
            onWishlist={() => setPage("wishlist")}
            onOpenPlus={() => setPage("plus")}
            hasPlus={plusUnlocked}
          />}
          {page === "receipts" && (
            receipts.error ? (
              <div className="error-screen">
                <section className="panel error-card">
                  <h2>{t("receiptsDidNotLoad")}</h2>
                  <p>{t("receiptError")}</p>
                  <button className="primary-button" type="button" onClick={() => void receipts.refresh()}>{t("tryAgain")}</button>
                </section>
              </div>
            ) : (
              <ReceiptsPage
                receipts={receipts.receipts}
                getImageUrl={receipts.getImageUrl}
                uploading={uploadingReceipt}
                onAdd={() => setCaptureOpen(true)}
                onSelect={setSelectedReceipt}
              />
            )
          )}
          {page === "analytics" &&
            (plusUnlocked ? (
              <AnalyticsPage transactions={data.transactions} />
            ) : (
              <PlusPage hasPlus={false} onBack={() => setPage("home")} onOpenAnalytics={() => setPage("analytics")} onOpenSavings={() => setPage("savings")} />
            ))}
          {page === "plus" && (
            <PlusPage hasPlus={plusUnlocked} onBack={() => setPage("home")} onOpenAnalytics={() => setPage("analytics")} onOpenSavings={() => setPage("savings")} />
          )}
          {page === "savings" && (
            <SavingsGoalsPage
              goals={savings.goals}
              isLoading={savings.isLoading}
              error={savings.error}
              onBack={() => setPage("home")}
              onSave={savings.save}
              onDelete={savings.remove}
              onRetry={savings.refresh}
              hasPlus={plusUnlocked}
            />
          )}
          {page === "wishlist" && (
            <WishlistPage
              items={wishlist.items}
              goals={savings.goals}
              isLoading={wishlist.isLoading}
              error={wishlist.error}
              onBack={() => setPage("home")}
              onSave={wishlist.save}
              onDelete={wishlist.remove}
              getImageUrl={wishlist.getImageUrl}
              onRetry={wishlist.refresh}
            />
          )}
          {page === "profile" && <ProfilePage user={auth.user} busy={signingOut} onBack={() => setPage("more")} onSignOut={doSignOut} />}
        </>}
      </div>
      <nav className="bottom-nav" aria-label={t("mainNavigation")}>
        <button type="button" className={`nav-item ${page === "home" ? "active" : ""}`} aria-current={page === "home" ? "page" : undefined} onClick={() => setPage("home")}><Home size={19} /><span>{t("home")}</span></button>
        <button type="button" className={`nav-item ${page === "transactions" ? "active" : ""}`} aria-current={page === "transactions" ? "page" : undefined} onClick={() => setPage("transactions")}><ArrowDownUp size={19} /><span>{t("activity")}</span></button>
        <button type="button" className="nav-item nav-add" aria-label={t("addTransaction")} onClick={startAdd}><Plus size={22} /></button>
        <button type="button" className={`nav-item ${page === "receipts" ? "active" : ""}`} aria-current={page === "receipts" ? "page" : undefined} onClick={() => setPage("receipts")}><Receipt size={19} /><span>{t("receipts")}</span></button>
        <button type="button" className={`nav-item ${page === "more" || page === "profile" || page === "savings" || page === "wishlist" || page === "plus" ? "active" : ""}`} aria-current={page === "more" ? "page" : undefined} onClick={() => setPage("more")}><UserRound size={19} /><span>{t("more")}</span></button>
      </nav>
      {formOpen && (
        <TransactionForm
          open={formOpen}
          existing={editing}
          busy={saving}
          onClose={() => setFormOpen(false)}
          onSave={(input) => saveTransaction(input, editing ?? undefined)}
        />
      )}
      <TransactionDetail transaction={selected} getImageUrl={data.getImageUrl} onClose={() => setSelected(null)} onEdit={startEdit} onDelete={requestDeleteTransaction} deleting={deleting} />
      {toast && <div className="toast" role="status">{toast}</div>}
      <ConfirmDialog
        open={Boolean(pendingDeleteTx)}
        title={t("delete")}
        body={pendingDeleteTx
          ? t("deleteConfirm", { name: pendingDeleteTx.name })
          : t("deleteConfirm", { name: "" })}
        confirmLabel={t("delete")}
        busy={deleting}
        onConfirm={() => void confirmDeleteTransaction()}
        onCancel={() => setPendingDeleteTx(null)}
      />
      <ConfirmDialog
        open={Boolean(pendingDeleteReceipt)}
        title={t("delete")}
        body={pendingDeleteReceipt
          ? t("receiptDeleteConfirmNamed", {
              merchant: pendingDeleteReceipt.merchant?.trim() || t("receipt"),
            })
          : t("receiptDeleteConfirm")}
        confirmLabel={t("delete")}
        busy={deletingReceipt}
        onConfirm={() => void confirmDeleteReceipt()}
        onCancel={() => setPendingDeleteReceipt(null)}
      />
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
        onDelete={requestDeleteReceipt}
        deleting={deletingReceipt}
      />
    </div>
  );
}

export default App;
