import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import type { ApiError } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
  withCredentials: true,
});

// ─── Token Management ─────────────────────────────────────────────────────────

let accessToken: string | null = null;
let isRefreshing = false;
let refreshFailed = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  config: InternalAxiosRequestConfig;
}> = [];

// ─── Debug Logger ─────────────────────────────────────────────────────────────

const log = {
  info:  (msg: string, data?: unknown) => console.log( `%c[AUTH] ${msg}`, 'color:#60a5fa;font-weight:bold', ...(data !== undefined ? [data] : [])),
  warn:  (msg: string, data?: unknown) => console.warn(`%c[AUTH] ${msg}`, 'color:#fbbf24;font-weight:bold', ...(data !== undefined ? [data] : [])),
  error: (msg: string, data?: unknown) => console.error(`%c[AUTH] ${msg}`, 'color:#f87171;font-weight:bold', ...(data !== undefined ? [data] : [])),
};

//   ────────────────────────────────────────────────────────────────────────────

export function setAccessToken(token: string | null): void {
  log.info(`setAccessToken → ${token ? '(token set)' : 'null'}`);
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function resetRefreshState(): void {
  log.info('resetRefreshState — circuit breaker re-armed');
  refreshFailed = false;
  isRefreshing = false;
  failedQueue = [];
}

function processQueue(error: Error | null): void {
  log.info(`processQueue — draining ${failedQueue.length} queued request(s), error=${error?.message ?? 'none'}`);
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(undefined);
    }
  });
  failedQueue = [];
}

// ─── Request Interceptor ─────────────────────────────────────────────────────

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ────────────────────────────────────────────────────

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ApiError>) => { 
    const status = error.response?.status;
    const url    = error.config?.url ?? '(no url)';

    log.warn(`Response error — ${status ?? 'NO_STATUS'} on ${url}`);

    // ── Guard: no config (network error / timeout / cancelled) ───────────────
    if (!error.config) {
      log.error('No error.config — network error or cancelled request, bailing');
      return Promise.reject(error);
    }

    // ── Not a 401 ────────────────────────────────────────────────────────────
    if (status !== 401) {
      log.info(`Non-401 (${status}) on ${url} — passing through`);
      return Promise.reject(error);
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // ── Auth endpoint — never refresh on /auth/* ──────────────────────────────
    if (originalRequest.url?.includes('/auth/')) {
      log.warn(`401 on auth endpoint (${url}) — not refreshing`);
      return Promise.reject(error);
    }

    // ── Circuit breaker ───────────────────────────────────────────────────────
    if (refreshFailed) {
      log.error(`Circuit breaker OPEN — refresh already failed this session, redirecting. Triggered by: ${url}`);
      redirectToLogin();
      return Promise.reject(error);
    }

    // ── Already retried this exact request ───────────────────────────────────
    if (originalRequest._retry) {
      log.warn(`Request already retried once (${url}) — not retrying again`);
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // ── Queue behind in-flight refresh ───────────────────────────────────────
    if (isRefreshing) {
      log.info(`Refresh in flight — queuing request: ${url} (queue length now ${failedQueue.length + 1})`);
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject, config: originalRequest });
      }).then(() => {
        log.info(`Retrying queued request: ${url}`);
        return api(originalRequest);
      });
    }

    // ── Attempt refresh ───────────────────────────────────────────────────────
    isRefreshing = true;
    log.info(`Starting token refresh (triggered by 401 on ${url})`);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );

      const newToken = response.data.accessToken;
      if (!newToken) {
        throw new Error('Refresh response contained no accessToken');
      }

      log.info('Token refresh succeeded — new token received');
      setAccessToken(newToken);
      processQueue(null);
      return api(originalRequest);

    } catch (refreshError) {
      const e = refreshError as Error;
      log.error(`Token refresh FAILED — tripping circuit breaker. Reason: ${e?.message ?? refreshError}`);
      log.error('State at failure', { isRefreshing, refreshFailed, queueLength: failedQueue.length });

      refreshFailed = true;
      setAccessToken(null);
      processQueue(e);
      redirectToLogin();
      return Promise.reject(refreshError);

    } finally {
      isRefreshing = false;
      log.info(`isRefreshing reset to false. refreshFailed=${refreshFailed}`);
    }
  }
);

function redirectToLogin(): void {
  log.info(`redirectToLogin — current path: ${window.location.pathname}`);
  if (!window.location.pathname.startsWith('/login')) {
    log.info('Redirecting to /login via window.location.replace');
    window.location.replace('/login');
  } else {
    log.info('Already on /login — skipping redirect');
  }
}

export default api;