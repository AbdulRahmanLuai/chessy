import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { setAccessToken, resetRefreshState } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import type { AuthResponse } from '@/types';
import type { User } from '@/types';

function mapResponseToUser(data: AuthResponse): User {
  return {
    id: data.userId,
    username: data.username,
    email: data.email,
    displayName: data.displayName,
    createdAt: '',
  };
}

/**
 * Landing page after Google OAuth.
 *
 * The Spring backend already set the `rt` httpOnly cookie before redirecting
 * here — there is nothing in the URL to parse. This page simply calls
 * /api/auth/refresh to exchange that cookie for an access token, writes the
 * result into the auth store, then forwards the user to /lobby.
 *
 * On any failure it falls back to /login so the user is never stuck.
 */
export default function OAuthCallbackPage() {
  const navigate  = useNavigate();
  const attempted = useRef(false);

  useEffect(() => {
    // Guard against React Strict Mode double-invoke
    if (attempted.current) return;
    attempted.current = true;

    const { login, setLoading } = useAuthStore.getState();

    const finish = async () => {
      setLoading(true);
      try {
        const data = await authService.refreshToken();
        const user = mapResponseToUser(data);

        resetRefreshState();
        login(user, data.accessToken);
        setAccessToken(data.accessToken);

        navigate('/lobby', { replace: true });
      } catch (err) {
        console.error('[OAuthCallback] Failed to exchange cookie for token', err);
        // Cookie missing / expired / server error — send back to login
        navigate('/login?error=oauth_failed', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    finish();
  }, [navigate]);

  // Render a centered spinner while the exchange is in flight.
  // Swap this for your <Spinner /> component if you prefer.
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 'var(--space-3)',
      }}
    >
      <span
        style={{
          width: 40,
          height: 40,
          border: '3px solid var(--color-border)',
          borderTopColor: 'var(--color-accent)',
          borderRadius: '50%',
          animation: 'spin 0.75s linear infinite',
          display: 'inline-block',
        }}
      />
      <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
        Signing you in…
      </p>

      {/* Scoped keyframe — avoids polluting global CSS */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
