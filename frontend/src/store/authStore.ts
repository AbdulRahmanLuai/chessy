import { create } from 'zustand';
import type { User } from '@/types';

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authInitialized: boolean;

  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  setAuthInitialized: (initialized: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  authInitialized: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  setAccessToken: (accessToken) =>
    set({ accessToken }),

  setLoading: (isLoading) =>
    set({ isLoading }),

  setAuthInitialized: (authInitialized) =>
    set({ authInitialized }),

  login: (user, accessToken) =>
    set({
      user,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
    }),

  logout: () =>
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      authInitialized: false,
    }),
}));

// ─── Selectors (unchanged) ─────────────────────────────────────────────────
export const useUser = () => useAuthStore((s) => s.user);
export const useAccessToken = () => useAuthStore((s) => s.accessToken);
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const useAuthLoading = () => useAuthStore((s) => s.isLoading);
export const useAuthActions = () => {
  const store = useAuthStore();
  return {
    login: store.login,
    logout: store.logout,
    setUser: store.setUser,
    setAccessToken: store.setAccessToken,
    setLoading: store.setLoading,
  };
};