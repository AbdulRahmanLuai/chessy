import { useEffect } from 'react';
import { useIsAuthenticated, useAuthStore } from '@/store/authStore';
import { startClockSync, stopClockSync } from '@/services/clockSync.service';

/** Starts clock sync once auth is initialized and the user is logged in;
 *  stops it on logout or unmount. Mirrors useSocketConnection's pattern. */
export function useClockSyncLifecycle() {
  const isAuthenticated = useIsAuthenticated();
  const authInitialized = useAuthStore((s) => s.authInitialized);

  useEffect(() => {
    if (authInitialized && isAuthenticated) {
      startClockSync();
    } else {
      stopClockSync();
    }

    return () => {
      stopClockSync();
    };
  }, [authInitialized, isAuthenticated]);
}