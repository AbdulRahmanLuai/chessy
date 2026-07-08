import { useChallenge } from '@/hooks/useChallenge';
import { useNotificationStore, useToasts } from '@/store/notificationStore';
import Toast from '@/components/ui/Toast';
import styles from './ToastContainer.module.css';

const MAX_VISIBLE_TOASTS = 3;

/**
 * Mounted once globally (see AppLayout).
 *
 * Responsibilities:
 * - Reads the notification queue from notificationStore.
 * - Displays the newest notifications first.
 * - Limits visible toasts.
 * - Connects toast actions to domain actions.
 *
 * Toast itself stays a dumb UI primitive.
 */
export default function ToastContainer() {
  const toasts = useToasts();
  const dismiss = useNotificationStore((s) => s.dismiss);

// TODO: Avoid using useChallenge() here because it registers socket listeners.
// Extract challenge actions (accept/decline) into a lightweight action hook or service
// so ToastContainer can trigger domain actions without creating duplicate listeners.
  const { acceptChallenge, declineChallenge } = useChallenge();

  // Store keeps notifications oldest-first.
  // Display newest notifications on top.
  const visibleToasts = toasts.slice(-MAX_VISIBLE_TOASTS).reverse();

  if (visibleToasts.length === 0) {
    return null;
  }

  return (
    <div className={styles.container} aria-live="polite">
      {visibleToasts.map((toast, index) => {
        const stackClass =
          index === 0
            ? styles.stack0
            : index === 1
              ? styles.stack1
              : styles.stack2;

        return (
          <div
            key={toast.id}
            className={`${styles.item} ${stackClass}`}
          >
            {toast.kind === 'challenge' ? (
              <Toast
                title={toast.fromDisplayName}
                message="Sent you a challenge"
                avatarUsername={toast.fromUsername}
                onDismiss={() => dismiss(toast.id)}
                actions={[
                  {
                    label: 'Decline',
                    variant: 'ghost',
                    onClick: () => declineChallenge(toast.challengeId),
                  },
                  {
                    label: 'Accept',
                    variant: 'primary',
                    onClick: () => acceptChallenge(toast.challengeId),
                  },
                ]}
              />
            ) : (
              <Toast
                title={toast.fromUsername}
                message="Sent you a friend request"
                avatarUsername={toast.fromUsername}
                onDismiss={() => dismiss(toast.id)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}