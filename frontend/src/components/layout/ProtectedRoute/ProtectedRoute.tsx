import { useCallback } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import {
  useIsAuthenticated,
  useUser,
  useAuthStore,
} from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { setAccessToken } from '@/services/api';
import AppLayout from '../AppLayout';

export interface ProtectedRouteProps {
  redirectTo?: string;
  children?: React.ReactNode;
}

export default function ProtectedRoute({
  redirectTo = '/login',
  children,
}: ProtectedRouteProps) {
  const isAuthenticated = useIsAuthenticated();
  const user = useUser();
  const authInitialized = useAuthStore((s) => s.authInitialized);
  const navigate = useNavigate();

  console.log('ProtectedRoute path:', window.location.pathname);

  // ── Logout inline — avoids importing useAuth() which would spawn another
  //    silent refresh attempt for every protected page rendered ──────────────
  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // server-side failure is non-fatal; clear local state regardless
    } finally {
      setAccessToken(null);
      useAuthStore.getState().logout();
      navigate('/login');
    }
  }, [navigate]);

  console.log('[ProtectedRoute]', {
  authInitialized,
  isAuthenticated,
  path: window.location.pathname,
});
  if (!authInitialized) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <AppLayout user={user} onLogout={handleLogout}>
      {children ?? <Outlet />}
    </AppLayout>
  );
}