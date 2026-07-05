import { createPortal } from 'react-dom';
import { Trophy, RotateCcw, LayoutDashboard, BarChart2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import type { GameResult as GameResultType, GamePlayer, Color, GameStatus } from '@/types';
import styles from './GameResult.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GameResultProps {
  result: GameResultType;
  /** The local player's color — used to determine win/loss perspective */
  myColor: Color;
  players: [GamePlayer, GamePlayer]; // [white, black]
  onPlayAgain?: () => void;
  onReturnToLobby: () => void;
  onViewAnalysis?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Outcome = 'win' | 'loss' | 'draw';

function getOutcome(winner: GameResultType['winner'], myColor: Color): Outcome {
  if (winner === 'draw') return 'draw';
  return winner === myColor ? 'win' : 'loss';
}

const OUTCOME_LABEL: Record<Outcome, string> = {
  win:  'You won!',
  loss: 'You lost.',
  draw: 'Draw',
};

const REASON_LABEL: Partial<Record<GameStatus, string>> = {
  checkmate: 'by checkmate',
  timeout:   'on time',
  resigned:  'by resignation',
  stalemate: 'by stalemate',
  draw:      'by agreement',
  aborted:   'game aborted',
};

function getPlayer(
  players: [GamePlayer, GamePlayer],
  color: Color,
): GamePlayer {
  return players[0].color === color ? players[0] : players[1];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GameResult({
  result,
  myColor,
  players,
  onPlayAgain,
  onReturnToLobby,
  onViewAnalysis,
}: GameResultProps) {
  const outcome     = getOutcome(result.winner, myColor);
  const whitePlayer = getPlayer(players, 'white');
  const blackPlayer = getPlayer(players, 'black');

  const isWhiteWinner = result.winner === 'white';
  const isBlackWinner = result.winner === 'black';

  return createPortal(
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label={`Game over — ${OUTCOME_LABEL[outcome]}`}
    >
      <div className={`${styles.panel} ${styles[outcome]}`}>

        {/* ── Outcome headline ───────────────────────────────────────────── */}
        <div className={styles.headline}>
          <h2 className={styles.outcomeText}>
            {OUTCOME_LABEL[outcome]}
          </h2>
          <p className={styles.reasonText}>
            {REASON_LABEL[result.reason] ?? ''}
          </p>
        </div>

        {/* ── Decorative divider ─────────────────────────────────────────── */}
        <div className={styles.divider} aria-hidden="true" />

        {/* ── Players ───────────────────────────────────────────────────── */}
        <div className={styles.playersBlock}>
          <div
            className={`${styles.playerRow} ${isWhiteWinner ? styles.winnerRow : ''}`}
          >
            <div className={styles.playerRowLeft}>
              {isWhiteWinner && (
                <Trophy size={14} className={styles.trophyIcon} aria-hidden="true" />
              )}
              <span className={styles.colorDot} data-color="white" aria-hidden="true" />
              <span className={styles.playerName}>{whitePlayer.user.username}</span>
            </div>
          </div>

          <div
            className={`${styles.playerRow} ${isBlackWinner ? styles.winnerRow : ''}`}
          >
            <div className={styles.playerRowLeft}>
              {isBlackWinner && (
                <Trophy size={14} className={styles.trophyIcon} aria-hidden="true" />
              )}
              <span className={styles.colorDot} data-color="black" aria-hidden="true" />
              <span className={styles.playerName}>{blackPlayer.user.username}</span>
            </div>
          </div>
        </div>

        {/* ── Actions ───────────────────────────────────────────────────── */}
        <div className={styles.actions}>
          {onPlayAgain && (
            <Button
              variant="primary"
              size="md"
              fullWidth
              iconLeft={<RotateCcw size={15} />}
              onClick={onPlayAgain}
            >
              Play again
            </Button>
          )}

          {onViewAnalysis && (
            <Button
              variant="secondary"
              size="md"
              fullWidth
              iconLeft={<BarChart2 size={15} />}
              onClick={onViewAnalysis}
            >
              Analyse game
            </Button>
          )}

          <Button
            variant="ghost"
            size="md"
            fullWidth
            iconLeft={<LayoutDashboard size={15} />}
            onClick={onReturnToLobby}
          >
            Return to lobby
          </Button>
        </div>

      </div>
    </div>,
    document.body,
  );
}
