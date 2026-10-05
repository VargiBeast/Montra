import { useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import App from "./App";
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
import { hasPlusAccess } from "./lib/plus";
import { useDocumentMeta } from "./lib/seo";
import { useTranslation } from "./lib/i18n";

function PlusPublic() {
  const t = useTranslation();
  const auth = useAuth();
  useDocumentMeta({
    title: t("seoPlusTitle"),
    description: t("seoPlusDescription"),
    path: "/plus",
  });
  const navigate = useNavigate();
  return (
    <main className="marketing-main marketing-plus-page">
      <PlusPage
        hasPlus={hasPlusAccess(auth.user?.email)}
        onBack={() => navigate(-1)}
        onOpenAnalytics={() => navigate("/analytics")}
        onOpenSavings={() => navigate("/goals")}
      />
    </main>
  );
}

function AuthLogin() {
  const auth = useAuth();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const from = (location.state as { from?: string } | null)?.from || "/app";

  useDocumentMeta({
    title: "Sign in · Montra",
    description: "Sign in to your Montra account.",
    path: "/login",
    noIndex: true,
  });

  // After Google OAuth or Magic Link callback, session is restored and we leave /login.
  if (!auth.isLoading && auth.user) {
    return <Navigate to={from.startsWith("/") ? from : "/app"} replace />;
  }

  async function startGoogle() {
    setBusy(true);
    try {
      // Redirects away to Google; session lands back via detectSessionInUrl + onAuthStateChange.
      await auth.signInWithProvider("google");
    } catch {
      /* authError set in useAuth */
    } finally {
      setBusy(false);
    }
  }

  return (
    <LoginPage
      authError={auth.authError}
      busy={busy}
      isConfigured={auth.isConfigured}
      onGoogle={() => startGoogle()}
      onMagicLink={(email) => auth.signInWithEmail(email)}
      onRetry={auth.retrySession}
    />
  );
}

function AuthSignup() {
  return <AuthLogin />;
}

function ProtectedApp() {
  return <App />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MarketingLayout />}>
        <Route index element={<HomePublic />} />
        <Route path="features" element={<FeaturesPublic />} />
        <Route path="pricing" element={<PricingPublic />} />
        <Route path="plus" element={<PlusPublic />} />
        <Route path="about" element={<SimplePublic page="about" />} />
        <Route path="contact" element={<SimplePublic page="contact" />} />
        <Route path="faq" element={<SimplePublic page="faq" />} />
        <Route path="help" element={<SimplePublic page="help" />} />
        <Route path="privacy" element={<SimplePublic page="privacy" />} />
        <Route path="terms" element={<SimplePublic page="terms" />} />
        <Route path="cookies" element={<SimplePublic page="cookies" />} />
        <Route path="security" element={<SimplePublic page="security" />} />
        <Route path="wishlist/:token" element={<PublicWishlistPage />} />
        <Route path="*" element={<NotFoundPublic />} />
      </Route>

      <Route path="/login" element={<AuthLogin />} />
      <Route path="/signup" element={<AuthSignup />} />
      {/* Password auth removed — redirect legacy links to login (Google + magic link). */}
      <Route path="/forgot-password" element={<Navigate to="/login" replace />} />
      <Route path="/reset-password" element={<Navigate to="/login" replace />} />

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
    </Routes>
  );
}
