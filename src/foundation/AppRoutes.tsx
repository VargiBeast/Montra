import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { AppShell } from "./layout/AppShell";
import { ProtectedRoute } from "./ProtectedRoute";
import { HomePage } from "./pages/HomePage";
import { ActivityPage } from "./pages/ActivityPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { GoalsPage } from "./pages/GoalsPage";
import { MorePage } from "./pages/MorePage";
import { LoginPage } from "./pages/LoginPage";
import { RecurringPage } from "./pages/RecurringPage";
import { FeaturePlusPage } from "./pages/FeaturePlusPage";
import { FeatureWishlistPage } from "./pages/FeatureWishlistPage";
import { FeatureReceiptsPage } from "./pages/FeatureReceiptsPage";
import { FeatureProfilePage } from "./pages/FeatureProfilePage";
import { FeaturePersonalizePage } from "./pages/FeaturePersonalizePage";

/* Public marketing site (existing pages — must stay public) */
import { MarketingLayout } from "../pages/public/MarketingLayout";
import { HomePublic } from "../pages/public/HomePublic";
import { FeaturesPublic } from "../pages/public/FeaturesPublic";
import { PricingPublic } from "../pages/public/PricingPublic";
import { SimplePublic } from "../pages/public/SimplePublic";
import { PublicWishlistPage } from "../pages/public/PublicWishlistPage";
import { NotFoundPublic } from "../pages/public/NotFoundPublic";
import { PlusPage } from "../pages/PlusPage";
import { useAuth } from "../hooks/useAuth";
import { usePlusEntitlement } from "../hooks/usePlusEntitlement";
import { useDocumentMeta } from "../lib/seo";
import { useTranslation } from "../lib/i18n";

/** Public Plus marketing page — not behind login. */
function PlusPublic() {
  const t = useTranslation();
  const auth = useAuth();
  const plusEntitlement = usePlusEntitlement(auth.user?.id);
  const navigate = useNavigate();
  useDocumentMeta({
    title: t("seoPlusTitle"),
    description: t("seoPlusDescription"),
    path: "/plus",
  });
  return (
    <main className="marketing-main marketing-plus-page">
      <PlusPage
        hasPlus={plusEntitlement.hasPlus}
        entitlementLoading={plusEntitlement.isLoading}
        entitlementStatus={plusEntitlement.entitlement?.status ?? null}
        onRefreshEntitlement={plusEntitlement.refresh}
        onBack={() => navigate(-1)}
        onOpenAnalytics={() => navigate("/app/analytics")}
        onOpenSavings={() => navigate("/app/goals")}
        onOpenPersonalize={() => navigate("/app/personalize")}
      />
    </main>
  );
}

/**
 * Public marketing site + authenticated app shell.
 * / pricing features plus legal etc. stay public.
 * /app/* requires auth.
 */
export function FoundationRoutes() {
  return (
    <Routes>
      {/* ——— Public website (montra.cash) ——— */}
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
        <Route path="refund-policy" element={<SimplePublic page="refund" />} />
        <Route path="wishlist/:token" element={<PublicWishlistPage />} />
        <Route path="*" element={<NotFoundPublic />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<LoginPage />} />
      <Route path="/forgot-password" element={<Navigate to="/login" replace />} />
      <Route path="/reset-password" element={<Navigate to="/login" replace />} />

      {/* ——— Authenticated app ——— */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="more" element={<MorePage />} />
        <Route path="wishlist" element={<FeatureWishlistPage />} />
        <Route path="recurring" element={<RecurringPage />} />
        <Route path="receipts" element={<FeatureReceiptsPage />} />
        <Route path="personalize" element={<FeaturePersonalizePage />} />
        <Route path="plus" element={<FeaturePlusPage />} />
        <Route path="profile" element={<FeatureProfilePage />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Route>

      {/* Legacy authenticated shortcuts → app shell */}
      <Route path="/home" element={<Navigate to="/app" replace />} />
      <Route path="/activity" element={<Navigate to="/app/activity" replace />} />
      <Route path="/transactions/*" element={<Navigate to="/app/activity" replace />} />
      <Route path="/analytics" element={<Navigate to="/app/analytics" replace />} />
      <Route path="/goals" element={<Navigate to="/app/goals" replace />} />
      <Route path="/more" element={<Navigate to="/app/more" replace />} />
      <Route path="/recurring" element={<Navigate to="/app/recurring" replace />} />
      <Route path="/planned" element={<Navigate to="/app/recurring" replace />} />
      <Route path="/receipts" element={<Navigate to="/app/receipts" replace />} />
      <Route path="/settings" element={<Navigate to="/app/profile" replace />} />
      <Route path="/profile" element={<Navigate to="/app/profile" replace />} />
      <Route path="/personalize" element={<Navigate to="/app/personalize" replace />} />
      {/* Note: /plus and /wishlist stay public (marketing / shared token); app copies live under /app/* */}
    </Routes>
  );
}
