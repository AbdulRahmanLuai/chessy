import { Flag, Handshake, FlipVertical2, Ban } from 'lucide-react';
import Button from '@/components/ui/Button';
import styles from './GameControls.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GameControlsProps {
  /** Called when the user clicks Resign — parent is responsible for confirmation */
  onResign: () => void;
  /** Called when the user clicks Offer Draw */
  onOfferDraw: () => void;
  /** Called when the user clicks Flip Board */
  onFlipBoard: () => void;
  /**
   * Called when the user clicks Abort.
   * Only relevant before both players have made a move.
   */
  onAbort?: () => void;

  /**
   * False when draw cannot be offered:
   * - Draw offer already sent and pending
   * - Game mode does not allow draws (e.g. vs computer in some modes)
   * - Game is over
   */
  canOfferDraw: boolean;

  /**
   * True when a draw offer has been sent and is awaiting the opponent's response.
   * Disables the draw button and shows a pending label.
   */
  drawOfferPending: boolean;

  /**
   * True only before both players have completed their first move.
   * Shows the Abort button instead of Resign.
   */
  canAbort: boolean;

  /**
   * When true all action buttons (resign, draw, abort) are disabled.
   * Flip board remains available at all times.
   */
  isGameOver: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GameControls({
  onResign,
  onOfferDraw,
  onFlipBoard,
  onAbort,
  canOfferDraw,
  drawOfferPending,
  canAbort,
  isGameOver,
}: GameControlsProps) {
  return (
    <div className={styles.root} role="group" aria-label="Game controls">

      {/* ── Flip board — always available ─────────────────────────────────── */}
      <Button
        variant="ghost"
        size="sm"
        iconLeft={<FlipVertical2 size={15} />}
        onClick={onFlipBoard}
        aria-label="Flip board"
        className={styles.flipBtn}
      >
        Flip
      </Button>

      <div className={styles.divider} aria-hidden="true" />

      {/* ── Abort — only before move 1 ────────────────────────────────────── */}
      {canAbort && onAbort ? (
        <Button
          variant="danger"
          size="sm"
          fullWidth
          iconLeft={<Ban size={15} />}
          onClick={onAbort}
          disabled={isGameOver}
          aria-label="Abort game"
        >
          Abort
        </Button>
      ) : (
        /* ── Resign ─────────────────────────────────────────────────────── */
        <Button
          variant="danger"
          size="sm"
          fullWidth
          iconLeft={<Flag size={15} />}
          onClick={onResign}
          disabled={isGameOver}
          aria-label="Resign game"
        >
          Resign
        </Button>
      )}

      {/* ── Offer / pending draw ──────────────────────────────────────────── */}
      <Button
        variant="secondary"
        size="sm"
        fullWidth
        iconLeft={<Handshake size={15} />}
        onClick={onOfferDraw}
        disabled={!canOfferDraw || drawOfferPending || isGameOver}
        aria-label={drawOfferPending ? 'Draw offer sent' : 'Offer draw'}
        aria-busy={drawOfferPending}
      >
        {drawOfferPending ? 'Draw offered…' : 'Offer draw'}
      </Button>

    </div>
  );
}
