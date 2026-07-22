import { useCallback, useEffect } from 'react';
import { useAuthStore, useUser, useAuthLoading, useIsAuthenticated } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { setAccessToken, resetRefreshState } from '@/services/api';
import type { LoginCredentials, RegisterCredentials, User, AuthResponse } from '@/types';

const log = {
  info:  (msg: string, data?: unknown) => console.log( `%c[useAuth] ${msg}`, 'color:#34d399;font-weight:bold', ...(data !== undefined ? [data] : [])),
  warn:  (msg: string, data?: unknown) => console.warn(`%c[useAuth] ${msg}`, 'color:#fbbf24;font-weight:bold', ...(data !== undefined ? [data] : [])),
  error: (msg: string, data?: unknown) => console.error(`%c[useAuth] ${msg}`, 'color:#f87171;font-weight:bold', ...(data !== undefined ? [data] : [])),
};

function mapResponseToUser(data: AuthResponse): User {
  return {
    id: data.userId,
    username: data.username,
    email: data.email,
    displayName: data.displayName,
    createdAt: '',
  };
}

export function useAuth() {
  // const navigate = useNavigate();


  const user            = useUser();
  const isAuthenticated = useIsAuthenticated();
  const isLoading       = useAuthLoading();

  // ── Actions via getState() — always stable, never trigger re-renders ───────
  // Zustand actions defined with `set` are already stable references, but
  // destructuring from useAuthStore() returns a new object each render.
  // getState() bypasses the subscription entirely and is safe to call here
  // because actions themselves never change identity.
  const { login, logout, setLoading } = useAuthStore.getState();

  // ── Sync access token to the Axios layer whenever auth state changes ───────
  // (Silent refresh is handled once globally in App.tsx — NOT here)
  useEffect(() => {
    const token = useAuthStore.getState().accessToken;
    log.info('useEffect[tokenSync] fired', { hasToken: !!token, isAuthenticated });
    setAccessToken(token);
  }, [isAuthenticated]); // ← only re-sync when auth status actually changes

  // ── Login ──────────────────────────────────────────────────────────────────
  const loginUser = useCallback(
    async (credentials: LoginCredentials) => {
      log.info('loginUser called');
      setLoading(true);
      try {
        const response = await authService.login(credentials);
        const user = mapResponseToUser(response);
        log.info('loginUser succeeded', { userId: user.id });
        resetRefreshState();
        login(user, response.accessToken);
        setAccessToken(response.accessToken);
        return { success: true };
      } catch (error) {
        log.error('loginUser failed', error);
        setLoading(false);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Login failed',
        };
      }
    },
    [login, setLoading]
  );

  // ── Register ───────────────────────────────────────────────────────────────
  const registerUser = useCallback(
    async (credentials: RegisterCredentials) => {
      log.info('registerUser called');
      setLoading(true);
      try {
        const response = await authService.register(credentials);
        const user = mapResponseToUser(response);
        log.info('registerUser succeeded', { userId: user.id });
        resetRefreshState();
        login(user, response.accessToken);
        setAccessToken(response.accessToken);
        return { success: true };
      } catch (error) {
        log.error('registerUser failed', error);
        setLoading(false);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Registration failed',
        };
      }
    },
    [login, setLoading]
  );

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logoutUser = useCallback(async () => {
    log.info('logoutUser called');
    setLoading(true);
    try {
      await authService.logout();
      log.info('logoutUser — server logout succeeded');
    } catch (err) {
      log.warn('logoutUser — server logout failed (still clearing local state)', err);
    } finally {
      setAccessToken(null);
      logout();
      setLoading(false);
      // navigate('/login');
    }
  }, [logout, setLoading]);

  // ── Google Login ───────────────────────────────────────────────────────────
  const handleGoogleLogin = useCallback(() => {
    log.info('handleGoogleLogin — redirecting to Google OAuth');
    window.location.href = authService.getGoogleAuthUrl();
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    login: loginUser,
    register: registerUser,
    logout: logoutUser,
    googleLogin: handleGoogleLogin,
  };
}