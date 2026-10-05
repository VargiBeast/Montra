import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  user: unknown;
  isLoading: boolean;
  children: ReactNode;
}

/** Redirects unauthenticated users to /login, preserving the intended destination. */
export function ProtectedRoute({ user, isLoading, children }: ProtectedRouteProps) {
  const location = useLocation();
  if (isLoading) {
    return (
      <main className="app-shell">
        <div className="app-frame" role="status" aria-label="Loading">
          <div className="loading-block" style={{ height: 250, borderRadius: 28 }} />
        </div>
      </main>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <>{children}</>;
}
