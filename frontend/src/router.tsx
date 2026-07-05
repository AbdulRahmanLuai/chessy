import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from './components/layout/ProtectedRoute';
import GuestRoute from './components/layout/GuestRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import LobbyPage from './pages/LobbyPage/LobbyPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage/OAuthCallbackPage';
import GamePage from './pages/GamePage/GamePage';
// import GamePage from './pages/GamePage/GamePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },

  // ── Auth callback — must be outside GuestRoute/ProtectedRoute ─────────────
  // The backend's app.frontend-redirect-url should point to this path,
  // e.g. http://localhost:5173/auth/callback
  {
    path: '/auth/callback',
    element: <OAuthCallbackPage />,
  },

  // ── Guest-only routes ──────────────────────────────────────────────────────
  {
    path: '/login',
    element: (
      <GuestRoute
        title="Welcome back"
        subtitle="Sign in to continue playing"
        footer={
          <span>
            Don't have an account?{' '}
            <a href="/register" style={{ color: 'var(--color-accent)' }}>
              Get started
            </a>
          </span>
        }
      >
        <LoginPage />
      </GuestRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <GuestRoute
        title="Create your account"
        subtitle="Join the Chessy community"
        footer={
          <span>
            Already have an account?{' '}
            <a href="/login" style={{ color: 'var(--color-accent)' }}>
              Sign in
            </a>
          </span>
        }
      >
        <RegisterPage />
      </GuestRoute>
    ),
  },

  // ── Protected routes ───────────────────────────────────────────────────────
  {
    path: '/lobby',
    element: <ProtectedRoute />,
    children: [{ index: true, element: <LobbyPage /> }],
  },

  {
    path: '/game/:gameId',
    element: <GamePage />,
  },

  // ── 404 ───────────────────────────────────────────────────────────────────
  {
    path: '*',
    element: (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}
      >
        <span style={{ fontSize: 'var(--text-4xl)' }}>404</span>
        <p style={{ color: 'var(--color-text-secondary)' }}>Page not found</p>
        <a href="/" style={{ color: 'var(--color-accent)' }}>
          Go home
        </a>
      </div>
    ),
  },
]);