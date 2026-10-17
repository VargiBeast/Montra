import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./layout/AppShell";
import { ProtectedRoute } from "./ProtectedRoute";
import { HomePage } from "./pages/HomePage";
import { ActivityPage } from "./pages/ActivityPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { GoalsPage } from "./pages/GoalsPage";
import { MorePage } from "./pages/MorePage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { LoginPage } from "./pages/LoginPage";
import { MarketingHome } from "./pages/MarketingHome";

/**
 * Completely new route tree for the recreated frontend.
 * Does not import or wrap the previous AppRoutes / App.tsx page hierarchy.
 */
export function FoundationRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<MarketingHome />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<LoginPage />} />

      {/* Authenticated app shell */}
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
        <Route path="wishlist" element={<PlaceholderPage title="Wishlist" subtitle="Save and share what you want" />} />
        <Route path="recurring" element={<PlaceholderPage title="Recurring" subtitle="Planned payments (not auto-applied to balances)" />} />
        <Route path="receipts" element={<PlaceholderPage title="Receipts" subtitle="Capture and confirm before creating transactions" />} />
        <Route path="personalize" element={<PlaceholderPage title="Personalize" subtitle="Themes, language, currency" />} />
        <Route path="plus" element={<PlaceholderPage title="Montra Plus" subtitle="Entitlement is verified from the backend" />} />
        <Route path="profile" element={<PlaceholderPage title="Profile" subtitle="Account and preferences" />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Route>

      {/* Legacy path redirects into the new shell */}
      <Route path="/home" element={<Navigate to="/app" replace />} />
      <Route path="/activity" element={<Navigate to="/app/activity" replace />} />
      <Route path="/transactions/*" element={<Navigate to="/app/activity" replace />} />
      <Route path="/analytics" element={<Navigate to="/app/analytics" replace />} />
      <Route path="/goals" element={<Navigate to="/app/goals" replace />} />
      <Route path="/more" element={<Navigate to="/app/more" replace />} />
      <Route path="/wishlist" element={<Navigate to="/app/wishlist" replace />} />
      <Route path="/recurring" element={<Navigate to="/app/recurring" replace />} />
      <Route path="/receipts" element={<Navigate to="/app/receipts" replace />} />
      <Route path="/settings" element={<Navigate to="/app/profile" replace />} />
      <Route path="/profile" element={<Navigate to="/app/profile" replace />} />
      <Route path="/personalize" element={<Navigate to="/app/personalize" replace />} />
      <Route path="/app/plus" element={<Navigate to="/app/plus" replace />} />
      <Route path="/app/personalize" element={<Navigate to="/app/personalize" replace />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
