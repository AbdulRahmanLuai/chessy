import { useState, FormEvent } from 'react';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { LoginCredentials } from '@/types';
import styles from './SignInForm.module.css';

export interface SignInFormProps {
  onSuccess?: () => void;
  showForgotPassword?: boolean;
}

export default function SignInForm({
  onSuccess,
  showForgotPassword = true,
}: SignInFormProps) {
  const { login, isLoading, googleLogin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    const credentials: LoginCredentials = { login: email, password };
    const result = await login(credentials);

    if (!result.success) {
      setError(result.error || 'Login failed');
    } else {
      onSuccess?.();
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.field}>
        <label htmlFor="email" className={styles.label}>
          Email
        </label>
        <div className={styles.inputWrapper}>
          <Mail className={styles.inputIcon} size={18} aria-hidden="true" />
          <input
            id="email"
            type="email"
            className={styles.input}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            autoComplete="email"
            required
          />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="password" className={styles.label}>
          Password
        </label>
        <div className={styles.inputWrapper}>
          <Lock className={styles.inputIcon} size={18} aria-hidden="true" />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            className={styles.input}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className={styles.togglePassword}
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            disabled={isLoading}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      {showForgotPassword && (
        <div className={styles.forgotRow}>
          <a href="/forgot-password" className={styles.forgotLink}>
            Forgot password?
          </a>
        </div>
      )}

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <button type="submit" className={styles.submit} disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className={styles.spinner} size={18} aria-hidden="true" />
            Signing in...
          </>
        ) : (
          'Sign in'
        )}
      </button>

      <div className={styles.divider}>
        <span className={styles.dividerLine} aria-hidden="true" />
        <span className={styles.dividerText}>or</span>
        <span className={styles.dividerLine} aria-hidden="true" />
      </div>

      <button
        type="button"
        className={styles.googleButton}
        onClick={googleLogin}
        disabled={isLoading}
      >
        <svg
          className={styles.googleIcon}
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
          />
          <path
            fill="#FBBC05"
            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
          />
        </svg>
        Sign in with Google
      </button>
    </form>
  );
}