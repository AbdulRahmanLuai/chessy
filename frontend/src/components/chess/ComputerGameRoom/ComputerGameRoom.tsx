// src/components/chess/ComputerGameRoom/ComputerGameRoom.tsx

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Board             from '@/components/chess/Board';
import PlayerStrip       from '@/components/chess/PlayerStrip';
import MoveList          from '@/components/chess/MoveList';
import GameControls      from '@/features/game/GameControls/GameControls';
import GameResult        from '@/features/game/GameResult/GameResult';
import Modal             from '@/components/ui/Modal';
import Button            from '@/components/ui/Button';
import Spinner           from '@/components/ui/Spinner';
import { useAuthStore }  from '@/store/authStore';
import { useComputerGameStore } from '@/store/computerGameStore';
import { useComputerGame } from '@/hooks/useComputerGame';
import { getActiveColor } from '@/utils/turn';
import type {
  Color,
  GamePlayer,
  Square,
  User,
  ResultReason,
  ComputerGameDifficulty,
} from '@/types';
import styles from './ComputerGameRoom.module.css';
import { Chess } from 'chess.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ComputerGameRoomProps {
  gameId: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Synthetic user id for the bot side — there is no real User record for it.
// Used as the `winner` value in GameResult when the bot wins.
const BOT_USER_ID = 'bot-engine';

const DIFFICULTY_LABELS: Record<ComputerGameDifficulty, string> = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
};

const ENGINE_LABELS: Record<string, string> = {
  RANDOM: 'Random Engine',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the square of the active king if it is in check, otherwise null. */
function findCheckSquare(fen: string): Square | null {
  try {
    const chess = new Chess(fen);
    if (!chess.inCheck()) return null;

    const turn = chess.turn();
    const board = chess.board();

    for (const row of board) {
      for (const cell of row) {
        if (cell && cell.type === 'k' && cell.color === turn) {
          return cell.square as Square;
        }
      }
    }
  } catch {
    // Malformed FEN — skip highlight
  }

  return null;
}

/** Builds a display-only pseudo-user for the bot side (no real User record exists). */
function buildBotUser(engine: string, difficulty: ComputerGameDifficulty): User {
  const engineLabel = ENGINE_LABELS[engine] ?? engine;
  return {
    id: BOT_USER_ID,
    username: 'engine',
    email: '',
    displayName: `${engineLabel} (${DIFFICULTY_LABELS[difficulty]})`,
    createdAt: '',
  };
}

/** Maps the backend's "1-0" / "0-1" / "1/2-1/2" result string to a winner user id. */
function resolveWinnerId(
  result: string | null,
  userColor: 'WHITE' | 'BLACK',
  currentUserId: string,
): string | null {
  if (result === '1-0') return userColor === 'WHITE' ? currentUserId : BOT_USER_ID;
  if (result === '0-1') return userColor === 'BLACK' ? currentUserId : BOT_USER_ID;
  return null; // "1/2-1/2" or unrecognized → treat as draw
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ComputerGameRoom({ gameId }: ComputerGameRoomProps) {
  const navigate = useNavigate();

  // ── Store access ─────────────────────────────────────────────────────────
  const currentUser = useAuthStore((s) => s.user);
  const game        = useComputerGameStore((s) => s.game);
  const isLoading   = useComputerGameStore((s) => s.isLoading);

  // ── Game hook ────────────────────────────────────────────────────────────
  const {
    handleMoveAttempt,
    handleResign,
    handleAbort,
    botMoveError,
    clearBotMoveError,
  } = useComputerGame(gameId);

  // ── Local UI state ───────────────────────────────────────────────────────
  const [isBoardFlipped,    setIsBoardFlipped]    = useState(false);
  const [isResignModalOpen, setIsResignModalOpen] = useState(false);
  const [isAbortModalOpen,  setIsAbortModalOpen]  = useState(false);

  // ── Derived: which color am I? ────────────────────────────────────────────
  const myColor = useMemo<Color>(() => {
    if (!game) return 'white';
    return game.userColor === 'WHITE' ? 'white' : 'black';
  }, [game]);

  // ── Derived: construct GamePlayer objects expected by child components ────
  const botUser = useMemo<User | null>(() => {
    if (!game) return null;
    return buildBotUser(game.engine, game.difficulty);
  }, [game]);

  const whiteGamePlayer = useMemo<GamePlayer | null>(() => {
    if (!game || !currentUser || !botUser) return null;
    const isUserWhite = game.userColor === 'WHITE';
    return {
      user:            isUserWhite ? currentUser : botUser,
      color:           'white',
      timeRemainingMs: game.whiteTimeRemainingMs,
      isConnected:     true,
    };
  }, [game, currentUser, botUser]);

  const blackGamePlayer = useMemo<GamePlayer | null>(() => {
    if (!game || !currentUser || !botUser) return null;
    const isUserBlack = game.userColor === 'BLACK';
    return {
      user:            isUserBlack ? currentUser : botUser,
      color:           'black',
      timeRemainingMs: game.blackTimeRemainingMs,
      isConnected:     true,
    };
  }, [game, currentUser, botUser]);

  // ── Derived: board state ──────────────────────────────────────────────────
  const turn = game ? getActiveColor(game.currentFen) : 'white';

  const boardOrientation: Color = isBoardFlipped
    ? (myColor === 'white' ? 'black' : 'white')
    : myColor;

  const isGameOver = !!game && game.status === 'COMPLETED';

  const isMyTurn = game?.status === 'IN_PROGRESS' && turn === myColor;

  const lastMove = useMemo(() => {
    if (!game || game.moves.length === 0) return null;
    const last = game.moves[game.moves.length - 1];
    return { from: last.from as Square, to: last.to as Square };
  }, [game]);

  const checkSquare = useMemo<Square | null>(() => {
    if (!game || game.status !== 'IN_PROGRESS') return null;
    return findCheckSquare(game.currentFen);
  }, [game]);

  const canAbort = !!game && game.moves.length < 2 && game.status === 'IN_PROGRESS';

  const gameResult = useMemo(() => {
    if (!game || !currentUser || game.status !== 'COMPLETED') return null;
    return {
      winner: resolveWinnerId(game.result, game.userColor, currentUser.id),
      reason: (game.resultReason ?? 'CHECKMATE') as ResultReason,
    };
  }, [game, currentUser]);

  // ── Resign handlers ──────────────────────────────────────────────────────
  function confirmResign() {
    handleResign();
    setIsResignModalOpen(false);
  }

  // ── Abort handlers ───────────────────────────────────────────────────────
  function confirmAbort() {
    handleAbort();
    setIsAbortModalOpen(false);
  }

  // ─── Loading state ────────────────────────────────────────────────────────

  if (isLoading || !game || !currentUser || !whiteGamePlayer || !blackGamePlayer) {
    return (
      <div className={styles.loadingState}>
        <Spinner size="lg" label="Loading game…" />
      </div>
    );
  }

  // ── Which strip is on top vs bottom? ─────────────────────────────────────
  const bottomPlayer = boardOrientation === 'white' ? whiteGamePlayer : blackGamePlayer;
  const topPlayer    = boardOrientation === 'white' ? blackGamePlayer : whiteGamePlayer;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={styles.root}>

      {/* ── Board column ─────────────────────────────────────────────────── */}
      <div className={styles.boardColumn}>

        <PlayerStrip
          player={topPlayer}
          isActive={turn !== myColor}
          anchorTimestamp={game.lastMoveAt ?? game.createdAt}
        />

        {botMoveError && (
          <div className={styles.botMoveErrorBanner}>
            <span>{botMoveError}</span>
            <Button variant="ghost" onClick={clearBotMoveError}>
              Dismiss
            </Button>
          </div>
        )}

        <div className={styles.boardWrapper}>
          <Board
            fen={game.currentFen}
            orientation={boardOrientation}
            onMoveAttempt={handleMoveAttempt}
            lastMove={lastMove}
            checkSquare={checkSquare}
            disabled={!isMyTurn || isGameOver}
          />
        </div>

        <PlayerStrip
          player={bottomPlayer}
          isActive={isMyTurn}
          anchorTimestamp={game.lastMoveAt ?? game.createdAt}
        />
      </div>

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className={styles.sidebar}>
        <MoveList
          moves={game.moves}
          className={styles.moveList}
        />

        <GameControls
          onResign={() => setIsResignModalOpen(true)}
          onOfferDraw={() => {}}
          onFlipBoard={() => setIsBoardFlipped((f) => !f)}
          onAbort={() => setIsAbortModalOpen(true)}
          canAbort={canAbort}
          canOfferDraw={false}
          drawOfferPending={false}
          isGameOver={isGameOver}
        />
      </aside>

      {/* ── Resign modal ──────────────────────────────────────────────────── */}
      <Modal
        isOpen={isResignModalOpen}
        onClose={() => setIsResignModalOpen(false)}
        title="Resign game?"
        description="The engine will be declared the winner. This cannot be undone."
        size="sm"
        persistent
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsResignModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmResign}>
              Resign
            </Button>
          </>
        }
      />

      {/* ── Abort modal ───────────────────────────────────────────────────── */}
      <Modal
        isOpen={isAbortModalOpen}
        onClose={() => setIsAbortModalOpen(false)}
        title="Abort game?"
        description="The game will be cancelled with no consequences."
        size="sm"
        persistent
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsAbortModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmAbort}>
              Abort
            </Button>
          </>
        }
      />

      {/* ── Game result ───────────────────────────────────────────────────── */}
      {isGameOver && gameResult && (
        <GameResult
          result={gameResult}
          myColor={myColor}
          players={[whiteGamePlayer, blackGamePlayer]}
          onPlayAgain={() => navigate('/play/computer')}
          onReturnToLobby={() => navigate('/lobby')}
        />
      )}
    </div>
  );
}