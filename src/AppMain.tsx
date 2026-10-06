import { lazy, Suspense, useEffect, useState } from "react";
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
import { SavingsGoalsPage } from "./pages/SavingsGoalsPage";
import { WishlistPage } from "./pages/WishlistPage";
import { PlusPage } from "./pages/PlusPage";
import { PersonalizePage } from "./pages/PersonalizePage";
import { LoginPage } from "./pages/LoginPage";
import { OnboardingFlow } from "./pages/OnboardingFlow";
import { TransactionForm } from "./components/TransactionForm";
import { TransactionDetail } from "./components/TransactionDetail";
import { ReceiptDetail } from "./components/ReceiptDetail";
import { UserAvatar } from "./components/UserAvatar";
import { ConfirmDialog } from "./components/ConfirmDialog";

const AnalyticsPage = lazy(() =>
  import("./pages/AnalyticsPage").then((m) => ({ default: m.AnalyticsPage })),
);
const ReceiptCapture = lazy(() =>
  import("./components/ReceiptCapture").then((m) => ({ default: m.ReceiptCapture })),
);
import { useDisplayCurrency } from "./lib/currency";
import { useLanguage, useTranslation } from "./lib/i18n";
import { fetchUserPreferences } from "./lib/preferences";
import { hasPlusAccess } from "./lib/plus";
import {
  applyAccentTheme,
  DEFAULT_PERSONALIZATION,
  readPersonalization,
  type PersonalizationSettings,
} from "./lib/personalization";
import {
  clearGuestTransactions,
  dismissAccountPrompt,
  isAccountPromptDismissed,
  isOnboardingComplete,
  readGuestTransactions,
} from "./lib/onboarding";

type Page = "home" | "transactions" | "more" | "profile" | "receipts" | "analytics" | "savings" | "wishlist" | "plus" | "personalize";
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

export default function AppMain() {
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
  // Minimal shell to restore production; full App restored via hasPlusAccess shim (false until usePlusEntitlement is wired).
  if (auth.isLoading) return <LoadingView />;
  if (!auth.user) {
    return (
      <div className="app-shell">
        <LoginPage
          authError={auth.authError}
          busy={false}
          isConfigured={auth.isConfigured}
          onGoogle={() => auth.signInWithProvider("google")}
          onMagicLink={(email) => auth.signInWithEmail(email)}
          onRetry={auth.retrySession}
        />
      </div>
    );
  }
  return (
    <div className="app-shell">
      <div className="app-frame">
        <header className="topbar">
          <div className="brand"><span className="brand-mark" aria-hidden="true"><img className="mark-light" src="/branding/mark-light.png" alt="" /><img className="mark-dark" src="/branding/mark-dark.png" alt="" /></span>MONTRA</div>
        </header>
        <HomePage
          transactions={data.transactions}
          getImageUrl={data.getImageUrl}
          name={auth.user.email?.split("@")[0] || t("nameFallback")}
          onAdd={() => undefined}
          onSelect={() => undefined}
          onViewAll={() => undefined}
          hasPlus={plusUnlocked}
        />
      </div>
    </div>
  );
}
