import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./layout/AppShell";
import { ProtectedRoute } from "./ProtectedRoute";
import { HomePage } from "./pages/HomePage";
import { ActivityPage } from "./pages/ActivityPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { GoalsPage } from "./pages/GoalsPage";
import { MorePage } from "./pages/MorePage";
import { LoginPage } from "./pages/LoginPage";
import { MarketingHome } from "./pages/MarketingHome";
import { RecurringPage } from "./pages/RecurringPage";
import { FeaturePlusPage } from "./pages/FeaturePlusPage";
import { FeatureWishlistPage } from "./pages/FeatureWishlistPage";
import { FeatureReceiptsPage } from "./pages/FeatureReceiptsPage";
import { FeatureProfilePage } from "./pages/FeatureProfilePage";
import { FeaturePersonalizePage } from "./pages/FeaturePersonalizePage";

/**
 * New route tree with real feature pages wired in.
 */
export function FoundationRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MarketingHome />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<LoginPage />} />

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

      <Route path="/home" element={<Navigate to="/app" replace />} />
      <Route path="/activity" element={<Navigate to="/app/activity" replace />} />
      <Route path="/transactions/*" element={<Navigate to="/app/activity" replace />} />
      <Route path="/analytics" element={<Navigate to="/app/analytics" replace />} />
      <Route path="/goals" element={<Navigate to="/app/goals" replace />} />
      <Route path="/more" element={<Navigate to="/app/more" replace />} />
      <Route path="/wishlist" element={<Navigate to="/app/wishlist" replace />} />
      <Route path="/recurring" element={<Navigate to="/app/recurring" replace />} />
      <Route path="/planned" element={<Navigate to="/app/recurring" replace />} />
      <Route path="/receipts" element={<Navigate to="/app/receipts" replace />} />
      <Route path="/settings" element={<Navigate to="/app/profile" replace />} />
      <Route path="/profile" element={<Navigate to="/app/profile" replace />} />
      <Route path="/personalize" element={<Navigate to="/app/personalize" replace />} />
      <Route path="/plus" element={<Navigate to="/app/plus" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
