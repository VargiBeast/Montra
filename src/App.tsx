import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/authentication/AuthProvider';
import { ProtectedRoute } from './features/authentication/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './features/authentication/LoginPage';
import { HomePage } from './features/dashboard/HomePage';
import { ActivityPage } from './features/transactions/ActivityPage';
import { ReceiptsPage } from './features/receipts/ReceiptsPage';
import { MorePage } from './features/settings/MorePage';
import { PlusPage } from './features/plus/PlusPage';
import { LandingPage } from './features/marketing/LandingPage';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#0f172a', borderRadius: '50%' }} />
      </div>
    );
  }
  // Logged-in users go to app; others see landing
  return user ? <Navigate to="/app" replace /> : <LandingPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/plus" element={<PlusPage />} />

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
          <Route path="receipts" element={<ReceiptsPage />} />
          <Route path="more" element={<MorePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
