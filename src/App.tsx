import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './features/authentication/AuthProvider';
import { ProtectedRoute } from './features/authentication/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './features/authentication/LoginPage';
import { HomePage } from './features/dashboard/HomePage';
import { ActivityPage } from './features/transactions/ActivityPage';
import { ReceiptsPage } from './features/receipts/ReceiptsPage';
import { MorePage } from './features/settings/MorePage';
import { PlusPage } from './features/plus/PlusPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/plus" element={<PlusPage />} />
        <Route
          path="/"
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
