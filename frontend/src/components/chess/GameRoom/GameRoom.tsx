import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Board             from '@/components/chess/Board';
import PlayerStrip       from '@/components/chess/PlayerStrip';
import MoveList          from '@/components/chess/MoveList';
import GameControls      from '@/features/game/GameControls/GameControls';
import GameResult        from '@/features/game/GameResult/GameResult';
import DrawOfferBanner   from '@/features/game/DrawOfferBanner';
import Modal             from '@/components/ui/Modal';
import Button            from '@/components/ui/Button';
import Spinner           from '@/components/ui/Spinner';
import { useAuthStore }  from '@/store/authStore';
import { useGameStore }  from '@/store/gameStore';
import { useGame }       from '@/hooks/useGame';
import type { Color, GamePlayer, Square } from '@/types';
import styles from './GameRoom.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GameRoomProps {
  gameId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Derives whose turn it is from the FEN active color field. */
function getTurnFromFen(fen: string): Color {
  return fen.split(' ')[1] === 'b' ? 'black' : 'white';
}

/** Returns the square of the active king if it is in check, otherwise null. */
function findCheckSquare(fen: string): Square | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Chess } = require('chess.js') as typeof import('chess.js');
    const chess = new Chess(fen);
    if (!chess.inCheck()) return null;
    const turn  = chess.turn(); // 'w' | 'b'
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function GameRoom({ gameId }: GameRoomProps) {
  const navigate = useNavigate();

  // ── Store access ─────────────────────────────────────────────────────────
  const currentUser = useAuthStore((s) => s.user);
  const game        = useGameStore((s) => s.game);
  const isLoading   = useGameStore((s) => s.isLoading);

  // ── Game hook ────────────────────────────────────────────────────────────
  const {
    handleMoveAttempt,
    handleResign,
    handleOfferDraw,
    handleAbort,
    handleAcceptDraw,
    handleDeclineDraw,
    drawOfferReceived,
    drawOfferSent,
  } = useGame(gameId);

  // ── Local UI state ───────────────────────────────────────────────────────
  const [isBoardFlipped,    setIsBoardFlipped]    = useState(false);
  const [isResignModalOpen, setIsResignModalOpen] = useState(false);
  const [isAbortModalOpen,  setIsAbortModalOpen]  = useState(false);

  // ── Derived: which color am I? ────────────────────────────────────────────
  const myColor = useMemo<Color>(() => {
    if (!game || !currentUser) return 'white';
    return game.whitePlayer.id === currentUser.id ? 'white' : 'black';
  }, [game, currentUser]);

  // ── Derived: construct GamePlayer objects expected by child components ────
  // GamePlayer is an ephemeral UI shape — built here from the flat Game fields.
  const whiteGamePlayer = useMemo<GamePlayer | null>(() => {
    if (!game) return null;
    return {
      user:             game.whitePlayer,
      color:            'white',
      timeRemainingMs:  game.whiteTimeRemainingMs,
      isConnected:      true, // updated by useGame via socket events
    };
  }, [game]);

  const blackGamePlayer = useMemo<GamePlayer | null>(() => {
    if (!game || !game.blackPlayer) return null;
    return {
      user:             game.blackPlayer,
      color:            'black',
      timeRemainingMs:  game.blackTimeRemainingMs,
      isConnected:      true,
    };
  }, [game]);

  // ── Derived: board state ──────────────────────────────────────────────────
  const turn = game ? getTurnFromFen(game.currentFen) : 'white';

  const boardOrientation: Color = isBoardFlipped
    ? (myColor === 'white' ? 'black' : 'white')
    : myColor;

  const isGameOver = !!game && (
    game.status === 'COMPLETED' || game.status === 'ABORTED'
  );

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

  const canAbort     = !!game && game.moves.length < 2 && game.status === 'IN_PROGRESS';
  // Without a game mode field, allow draw offers whenever the game is in progress.
  // The backend enforces per-mode rules.
  const canOfferDraw = !!game && game.status === 'IN_PROGRESS';

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

  // ─── Loading / waiting state ──────────────────────────────────────────────

  if (isLoading || !game || !currentUser) {
    return (
      <div className={styles.loadingState}>
        <Spinner size="lg" label="Loading game…" />
      </div>
    );
  }

  // While waiting for opponent to join, blackPlayer is null
  if (game.status === 'WAITING' || !blackGamePlayer || !whiteGamePlayer) {
    return (
      <div className={styles.loadingState}>
        <Spinner size="lg" label="Waiting for opponent…" />
      </div>
    );
  }

  // ── Which strip is on top vs bottom? ─────────────────────────────────────
  // Bottom = the player whose color matches boardOrientation.
  const bottomPlayer = boardOrientation === 'white' ? whiteGamePlayer : blackGamePlayer;
  const topPlayer    = boardOrientation === 'white' ? blackGamePlayer : whiteGamePlayer;
  const bottomTimeMs = boardOrientation === 'white' ? game.whiteTimeRemainingMs : game.blackTimeRemainingMs;
  const topTimeMs    = boardOrientation === 'white' ? game.blackTimeRemainingMs : game.whiteTimeRemainingMs;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={styles.root}>

      {/* ── Board column ─────────────────────────────────────────────────── */}
      <div className={styles.boardColumn}>

        <PlayerStrip
          player={topPlayer}
          isActive={turn !== myColor}
          timeRemainingMs={topTimeMs}
        />

        {drawOfferReceived && (
          <DrawOfferBanner
            onAccept={handleAcceptDraw}
            onDecline={handleDeclineDraw}
          />
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
          timeRemainingMs={bottomTimeMs}
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
          onOfferDraw={handleOfferDraw}
          onFlipBoard={() => setIsBoardFlipped((f) => !f)}
          onAbort={() => setIsAbortModalOpen(true)}
          canAbort={canAbort}
          canOfferDraw={canOfferDraw}
          drawOfferPending={drawOfferSent}
          isGameOver={isGameOver}
        />
      </aside>

      {/* ── Resign modal ──────────────────────────────────────────────────── */}
      <Modal
        isOpen={isResignModalOpen}
        onClose={() => setIsResignModalOpen(false)}
        title="Resign game?"
        description="Your opponent will be declared the winner. This cannot be undone."
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
      {isGameOver && game.result && (
        <GameResult
          result={game.result}
          myColor={myColor}
          players={[whiteGamePlayer, blackGamePlayer]}
          onPlayAgain={() => navigate('/lobby')}
          onReturnToLobby={() => navigate('/lobby')}
        />
      )}
    </div>
  );
}