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
import { LoginPage } from "./pages/LoginPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
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
      navigate(from.startsWith("/") ? from : "/app", { replace: true });
    } catch {
      /* error shown via auth.authError / local */
    } finally {
      setBusy(false);
    }
  }

  return (
    <LoginPage
      authError={auth.authError}
      busy={busy}
      isConfigured={auth.isConfigured}
      onGoogle={() => wrap(() => auth.signInWithProvider("google"))}
      onEmail={(email) => auth.signInWithEmail(email)}
      onVerifyCode={(email, token) => wrap(() => auth.verifyEmailCode(email, token))}
      onPassword={(email, password) => wrap(() => auth.signInWithPassword(email, password))}
      onSignUp={async (email, password) => {
        setBusy(true);
        try {
          const result = await auth.signUpWithPassword(email, password);
          if (!result.needsConfirmation) {
            navigate("/app", { replace: true });
          }
          return result;
        } finally {
          setBusy(false);
        }
      }}
      onRetry={auth.retrySession}
    />
  );
}

function AuthSignup() {
  return <AuthLogin />;
}

function AuthForgot() {
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  return (
    <ForgotPasswordPage
      busy={busy}
      isConfigured={auth.isConfigured}
      authError={auth.authError}
      onSubmit={async (email) => {
        setBusy(true);
        try {
          await auth.requestPasswordReset(email);
        } finally {
          setBusy(false);
        }
      }}
    />
  );
}

function AuthReset() {
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  return (
    <ResetPasswordPage
      busy={busy}
      isConfigured={auth.isConfigured}
      authError={auth.authError}
      onSubmit={async (password) => {
        setBusy(true);
        try {
          await auth.updatePassword(password);
        } finally {
          setBusy(false);
        }
      }}
    />
  );
}

function ProtectedApp() {
  // App already owns onboarding, guest mode, and login prompts.
  return <App />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MarketingLayout />}>
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
      </Route>

      <Route path="/login" element={<AuthLogin />} />
      <Route path="/signup" element={<AuthSignup />} />
      <Route path="/forgot-password" element={<AuthForgot />} />
      <Route path="/reset-password" element={<AuthReset />} />

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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
