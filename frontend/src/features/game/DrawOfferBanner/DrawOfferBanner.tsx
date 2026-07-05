import { Handshake } from 'lucide-react';
import Button from '@/components/ui/Button';
import styles from './DrawOfferBanner.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DrawOfferBannerProps {
  onAccept: () => void;
  onDecline: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DrawOfferBanner({
  onAccept,
  onDecline,
}: DrawOfferBannerProps) {
  return (
    <div
      className={styles.banner}
      role="alert"
      aria-live="polite"
      aria-label="Your opponent is offering a draw"
    >
      <div className={styles.message}>
        <Handshake size={16} className={styles.icon} aria-hidden="true" />
        <span className={styles.text}>Draw offered</span>
      </div>

      <div className={styles.actions}>
        <Button
          variant="secondary"
          size="sm"
          onClick={onDecline}
          aria-label="Decline draw offer"
        >
          Decline
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={onAccept}
          aria-label="Accept draw offer"
        >
          Accept
        </Button>
      </div>
    </div>
  );
}