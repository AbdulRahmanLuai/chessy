import { useEffect, useRef } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { authService } from '@/services/auth.service';
import { setAccessToken, resetRefreshState } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types';

function mapResponseToUser(data: Awaited<ReturnType<typeof authService.refreshToken>>): User {
  return {
    id: data.userId,
    username: data.username,
    email: data.email,
    displayName: data.displayName,
    createdAt: '',
  };
}

/**
 * Mounted exactly once at the app root.
 * Attempts a silent token refresh on startup — and nowhere else.
 */
function SilentRefresh() {
  const hasTriedRefresh = useRef(false);

  useEffect(() => {
    // Strict-mode / double-invoke guard
    if (hasTriedRefresh.current) return;
    hasTriedRefresh.current = true;

    // Use getState() — stable, no subscription, no re-render triggers
    const { login, setLoading } = useAuthStore.getState();

    const attemptRefresh = async () => {
      setLoading(true);
      try {
        const data = await authService.refreshToken();
        const user = mapResponseToUser(data);
        resetRefreshState();
        login(user, data.accessToken);
        setAccessToken(data.accessToken);
      } catch {
        // No valid session — that's fine, stay on current page
      } finally {
        setLoading(false);
      }
    };

    attemptRefresh();
  }, []); // ← empty: runs exactly once on app mount

  return null;
}

export default function App() {
  return (
    <>
      <SilentRefresh />
      <RouterProvider router={router} />
    </>
  );
}