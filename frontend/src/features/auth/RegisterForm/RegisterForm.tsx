import { useState, FormEvent } from 'react';
import { Mail, Lock, User, UserCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { RegisterCredentials } from '@/types';
import styles from './RegisterForm.module.css';

export interface RegisterFormProps {
  onSuccess?: () => void;
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { register, isLoading, googleLogin } = useAuth();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState(''); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username || !displayName || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (username.length > 30) {
      setError('Username must be at most 30 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }

    if (displayName.length < 1) {
      setError('Display name is required');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const credentials: RegisterCredentials = {
      username,
      displayName, 
      email,
      password,
    };

    const result = await register(credentials);

    if (!result.success) {
      setError(result.error || 'Registration failed');
    } else {
      onSuccess?.();
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {/* ── Username ───────────────────────────────────────────────────── */}
      <div className={styles.field}>
        <label htmlFor="username" className={styles.label}>
          Username
        </label>
        <div className={styles.inputWrapper}>
          <User className={styles.inputIcon} size={18} aria-hidden="true" />
          <input
            id="username"
            type="text"
            className={styles.input}
            placeholder="grandmaster2026"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            autoComplete="username"
            minLength={3}
            maxLength={30}
            pattern="[a-zA-Z0-9_]+"
            required
          />
        </div>
        <span className={styles.hint}>
          Letters, numbers, and underscores only
        </span>
      </div>

      {/* ── Display Name ────────────────────────────────────────────────── */}
      <div className={styles.field}>
        <label htmlFor="displayName" className={styles.label}>
          Display name
        </label>
        <div className={styles.inputWrapper}>
          <UserCircle className={styles.inputIcon} size={18} aria-hidden="true" />
          <input
            id="displayName"
            type="text"
            className={styles.input}
            placeholder="Your public display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={isLoading}
            autoComplete="name"
            required
          />
        </div>
      </div>

      {/* ── Email ──────────────────────────────────────────────────────── */}
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

      {/* ── Password ───────────────────────────────────────────────────── */}
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
            autoComplete="new-password"
            minLength={6}
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
        <span className={styles.hint}>Minimum 6 characters</span>
      </div>

      {/* ── Confirm Password ───────────────────────────────────────────── */}
      <div className={styles.field}>
        <label htmlFor="confirmPassword" className={styles.label}>
          Confirm password
        </label>
        <div className={styles.inputWrapper}>
          <Lock className={styles.inputIcon} size={18} aria-hidden="true" />
          <input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            className={styles.input}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            autoComplete="new-password"
            required
          />
        </div>
      </div>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <button type="submit" className={styles.submit} disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className={styles.spinner} size={18} aria-hidden="true" />
            Creating account...
          </>
        ) : (
          'Create account'
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
        Sign up with Google
      </button>
    </form>
  );
}