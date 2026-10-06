import { lazy, Suspense, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { MarketingLayout } from "./pages/public/MarketingLayout";
import { HomePublic } from "./pages/public/HomePublic";
import { FeaturesPublic } from "./pages/public/FeaturesPublic";
import { PricingPublic } from "./pages/public/PricingPublic";
import { SimplePublic } from "./pages/public/SimplePublic";
import { PublicWishlistPage } from "./pages/public/PublicWishlistPage";
import { NotFoundPublic } from "./pages/public/NotFoundPublic";
import { LoginPage } from "./pages/LoginPage";
import { PlusPage } from "./pages/PlusPage";
import { usePlusEntitlement } from "./hooks/usePlusEntitlement";
import { useDocumentMeta } from "./lib/seo";
import { useTranslation } from "./lib/i18n";

const App = lazy(() => import("./App"));

function RouteFallback() {
  return (
    <div className="app-shell route-fallback" role="status" aria-live="polite">
      <div className="panel route-fallback-panel">
        <p className="eyebrow">Montra</p>
        <p>Loading…</p>
      </div>
    </div>
  );
}

function PlusPublic() {
  const t = useTranslation();
  const auth = useAuth();
  const plusEntitlement = usePlusEntitlement(auth.user?.id);
  useDocumentMeta({
    title: t("seoPlusTitle"),
    description: t("seoPlusDescription"),
    path: "/plus",
  });
  const navigate = useNavigate();
  return (
    <main className="marketing-main marketing-plus-page">
      <PlusPage
        hasPlus={plusEntitlement.hasPlus}
        entitlementLoading={plusEntitlement.isLoading}
        entitlementStatus={plusEntitlement.entitlement?.status ?? null}
        onRefreshEntitlement={plusEntitlement.refresh}
        onBack={() => navigate(-1)}
        onOpenAnalytics={() => navigate("/analytics")}
        onOpenSavings={() => navigate("/goals")}
        onOpenPersonalize={() => navigate("/app/personalize")}
      />
    </main>
  );
}

function AuthLogin() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const from = (location.state as { from?: string } | null)?.from || "/app";

  useDocumentMeta({
    title: "Sign in · Montra",
    description: "Sign in to your Montra account.",
    path: "/login",
    noIndex: true,
  });

  if (!auth.isLoading && auth.user) {
    return <Navigate to={from.startsWith("/") ? from : "/app"} replace />;
  }

  async function wrap(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }

  return (
    <LoginPage
      busy={busy || auth.isLoading}
      error={auth.authError}
      onGoogle={() => wrap(() => auth.signInWithProvider("google"))}
      onEmail={(email) => wrap(() => auth.signInWithEmail(email))}
      onVerify={(email, token) => wrap(() => auth.verifyEmailCode(email, token))}
    />
  );
}

function ProtectedApp() {
  const auth = useAuth();
  const location = useLocation();

  if (auth.isLoading) {
    return <RouteFallback />;
  }

  if (!auth.user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      <App />
    </Suspense>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MarketingLayout />}>
        <Route index element={<HomePublic />} />
        <Route path="features" element={<FeaturesPublic />} />
        <Route path="pricing" element={<PricingPublic />} />
        <Route path="plus" element={<PlusPublic />} />
        <Route path="privacy" element={<SimplePublic kind="privacy" />} />
        <Route path="terms" element={<SimplePublic kind="terms" />} />
        <Route path="support" element={<SimplePublic kind="support" />} />
        <Route path="w/:shareId" element={<PublicWishlistPage />} />
        <Route path="*" element={<NotFoundPublic />} />
      </Route>

      <Route path="/login" element={<AuthLogin />} />

      <Route path="/app/*" element={<ProtectedApp />} />
      <Route path="/home" element={<ProtectedApp />} />
      <Route path="/activity" element={<ProtectedApp />} />
      <Route path="/transactions/*" element={<ProtectedApp />} />
      <Route path="/receipts" element={<ProtectedApp />} />
      <Route path="/wishlist" element={<ProtectedApp />} />
      <Route path="/goals" element={<ProtectedApp />} />
      <Route path="/more" element={<ProtectedApp />} />
      <Route path="/settings" element={<ProtectedApp />} />
      <Route path="/profile" element={<ProtectedApp />} />
      <Route path="/analytics" element={<ProtectedApp />} />
      <Route path="/app/plus" element={<ProtectedApp />} />
      <Route path="/app/personalize" element={<ProtectedApp />} />
      <Route path="/personalize" element={<ProtectedApp />} />
    </Routes>
  );
}
