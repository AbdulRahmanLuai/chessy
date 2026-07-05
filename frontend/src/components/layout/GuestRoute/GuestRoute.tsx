import { Navigate, Outlet } from 'react-router-dom';
import { useIsAuthenticated, useAuthLoading } from '@/store/authStore';
import AuthLayout from '../AuthLayout';

export interface GuestRouteProps {
  redirectTo?: string;
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  children?: React.ReactNode; // ← optional
}

export default function GuestRoute({
  redirectTo = '/lobby',
  title,
  subtitle,
  footer,
  children,
}: GuestRouteProps) {
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthLoading();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <AuthLayout title={title} subtitle={subtitle} footer={footer}>
      {children ?? <Outlet />}
    </AuthLayout>
  );
}