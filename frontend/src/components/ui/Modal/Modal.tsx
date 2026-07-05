import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ModalSize = 'sm' | 'md' | 'lg';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Modal heading — also used as the accessible dialog label */
  title: string;
  /** Optional subtitle rendered below the title */
  description?: string;
  size?: ModalSize;
  /** Slot for action buttons rendered in the footer */
  footer?: React.ReactNode;
  /** When true, clicking the backdrop does not close the modal */
  persistent?: boolean;
  children?: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  footer,
  persistent = false,
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // ── Focus management ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;

    // Store whatever was focused before opening so we can restore it on close
    previouslyFocusedRef.current = document.activeElement as HTMLElement;

    // Move focus into the dialog on the next frame (after paint)
    const frame = requestAnimationFrame(() => {
      const focusable = dialogRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      focusable?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) return;
    // Restore focus to the trigger element when modal closes
    previouslyFocusedRef.current?.focus();
  }, [isOpen]);

  // ── Escape key ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen || persistent) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, persistent, onClose]);

  // ── Scroll lock ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ── Focus trap ────────────────────────────────────────────────────────────

  function handleTabKey(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'Tab' || !dialogRef.current) return;

    const focusableSelectors =
      'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

    const focusableElements = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(focusableSelectors),
    );

    if (focusableElements.length === 0) return;

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  // ── Backdrop click ────────────────────────────────────────────────────────

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!persistent && e.target === e.currentTarget) onClose();
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (!isOpen) return null;

  const dialogId = 'modal-dialog';
  const titleId  = 'modal-title';
  const descId   = 'modal-desc';

  return createPortal(
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      // Backdrop itself is not interactive for AT — the dialog handles it
      aria-hidden="false"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        id={dialogId}
        className={`${styles.dialog} ${styles[size]}`}
        onKeyDown={handleTabKey}
        // Dialog must be focusable to receive keydown events when no child is focused
        tabIndex={-1}
      >
        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className={styles.header}>
          <div className={styles.headerText}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            {description && (
              <p id={descId} className={styles.description}>
                {description}
              </p>
            )}
          </div>

          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Body ─────────────────────────────────────────────────────── */}
        {children && <div className={styles.body}>{children}</div>}

        {/* ── Footer ───────────────────────────────────────────────────── */}
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
