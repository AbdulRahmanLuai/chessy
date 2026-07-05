import api from './api';
import type {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
} from '@/types';

// Root server URL (without /api) – needed for Google OAuth redirect
const SERVER_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8080';

export const authService = {
  
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await api.post('/auth/register', credentials);
    return response.data;
  },

  async logout(): Promise<void> {
    // Server invalidates refresh token and clears cookie
    await api.post('/auth/logout');
  },

  async refreshToken(): Promise<AuthResponse> {
    // withCredentials is already enabled globally on `api`
    const response = await api.post('/auth/refresh');
    return response.data;
  },

  getGoogleAuthUrl(): string {
    // Spring Security OAuth2 endpoint lives at the server root, not under /api
    return `${SERVER_BASE_URL}/oauth2/authorization/google`;
  },
};

export default authService;