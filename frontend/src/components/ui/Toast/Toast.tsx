import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import Button from '../Button';
import Avatar from '../Avatar';
import type { ButtonVariant } from '../Button';
import styles from './Toast.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: ButtonVariant;
}

export interface ToastProps {
  /** Primary line — e.g. sender's display name or username */
  title: string;
  /** Secondary line — e.g. "wants to challenge you" */
  message?: string;
  /** Passed straight to Avatar for initials/alt text fallback */
  avatarUsername?: string;
  /** Optional action buttons (e.g. Accept / Decline) */
  actions?: ToastAction[];
  /**
   * Called once the exit animation has finished — this is where the
   * consumer should actually remove the toast from its store. Toast does
   * not remove itself from any store; it just tells you when it's safe to.
   */
  onDismiss: () => void;
  /** Optional — clicking the toast body (not the action buttons) */
  onClick?: () => void;
  /** Auto-dismiss delay in ms. Pass 0 to disable. Defaults to 5000. */
  autoDismissMs?: number;
}

const DEFAULT_AUTO_DISMISS_MS = 5000;
// Keep in sync with the exit animation duration in Toast.module.css
// (uses --duration-normal, 200ms) so onDismiss fires after the animation completes.
const EXIT_ANIMATION_MS = 200;

// ─── Component ────────────────────────────────────────────────────────────────

export default function Toast({
  title,
  message,
  avatarUsername,
  actions,
  onDismiss,
  onClick,
  autoDismissMs = DEFAULT_AUTO_DISMISS_MS,
}: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAutoDismissTimer = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  const requestClose = useCallback(() => {
    setIsExiting((already) => {
      if (already) return already;
      exitTimerRef.current = setTimeout(onDismiss, EXIT_ANIMATION_MS);
      return true;
    });
  }, [onDismiss]);

  const startAutoDismissTimer = useCallback(() => {
    if (autoDismissMs <= 0) return;
    dismissTimerRef.current = setTimeout(requestClose, autoDismissMs);
  }, [autoDismissMs, requestClose]);

  // Start the auto-dismiss clock once on mount.
  useEffect(() => {
    startAutoDismissTimer();
    return () => {
      clearAutoDismissTimer();
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pause the countdown while the user is hovering — a toast with
  // Accept/Decline buttons shouldn't vanish while they're reaching for it.
  const handleMouseEnter = () => clearAutoDismissTimer();
  const handleMouseLeave = () => startAutoDismissTimer();

  const handleActionClick = (action: ToastAction) => {
    action.onClick();
    requestClose();
  };

  const handleBodyKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  const rootClassNames = [styles.toast, isExiting ? styles.exiting : styles.entering]
    .filter(Boolean)
    .join(' ');

  const bodyClassNames = [styles.body, onClick ? styles.clickable : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={rootClassNames}
      role="status"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        className={styles.closeButton}
        onClick={requestClose}
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>

      <div
        className={bodyClassNames}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? handleBodyKeyDown : undefined}
      >
        <Avatar username={avatarUsername} size="md" />

        <div className={styles.textBlock}>
          <p className={styles.title}>{title}</p>
          {message && <p className={styles.message}>{message}</p>}
        </div>
      </div>

      {actions && actions.length > 0 && (
        <div className={styles.actions}>
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant ?? 'secondary'}
              size="sm"
              onClick={() => handleActionClick(action)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
