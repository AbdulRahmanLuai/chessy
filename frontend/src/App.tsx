import { useEffect, useRef } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { authService } from '@/services/auth.service';
import { setAccessToken, resetRefreshState } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types';
import { useSocketConnection } from '@/hooks/useSocketConnection';

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

    const { login, setAuthInitialized } = useAuthStore.getState();

    const attemptRefresh = async () => {
      try {
        const data = await authService.refreshToken();
        const user = mapResponseToUser(data);
        resetRefreshState();
        login(user, data.accessToken);
        setAccessToken(data.accessToken);
      } catch {
        // No valid session — that's fine, stay on current page
      } finally {
        console.log('[AUTH INIT] complete');
        setAuthInitialized(true);
      }
    };

    attemptRefresh();
  }, []);

  return null;
}

export default function App() {
  useSocketConnection();

  return (
    <>
      <SilentRefresh />
      <RouterProvider router={router} />
    </>
  );
}