// src/pages/PlayOnlinePage/PlayOnlinePage.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Board from '@/components/chess/Board';
import { ChallengeSetupPanel } from '@/features/game/ChallengeSetupPanel';
import { WaitingForOpponent } from '@/features/game/WaitingForOpponent';
import Spinner from '@/components/ui/Spinner';
import { useChallenge } from '@/hooks/useChallenge';
import { gameService } from '@/services/game.service';
import styles from './PlayOnlinePage.module.css';

// No game exists yet at this point — the board is a disabled preview at the
// starting position. Once challenge:accepted fires, useAcceptedChallengeRedirect
// (global, in AppLayout) navigates to /game/:gameId, where the real GameRoom
// takes over with live FEN/moves.
const STARTING_POSITION_FEN =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function noopMoveAttempt(): boolean {
  return false;
}

export default function PlayOnlinePage() {
  const navigate = useNavigate();
  const { outgoingChallenge } = useChallenge();

  // Distinguishes "still checking for an active game" from "no active game,
  // show setup" — avoids flashing the setup panel before the check resolves.
  const [isCheckingActive, setIsCheckingActive] = useState(true);

  // ── On mount: redirect immediately if a game is already in progress ─────────
  useEffect(() => {
    let isActive = true;

    const checkActiveGame = async () => {
      try {
        const activeGame = await gameService.getActiveGame();
        if (!isActive) return;

        if (activeGame) {
          navigate(`/game/${activeGame.id}`, { replace: true });
          return;
        }
      } catch {
        // No active game (or lookup failed) — fall through to setup panel.
      } finally {
        if (isActive) setIsCheckingActive(false);
      }
    };

    checkActiveGame();

    return () => {
      isActive = false;
    };
  }, [navigate]);

  if (isCheckingActive) {
    return (
      <div className={styles.loadingState}>
        <Spinner size="lg" label="Checking for a game in progress…" />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>Play Online</h1>

      <div className={styles.layout}>
        <div className={styles.boardColumn}>
          <Board
            fen={STARTING_POSITION_FEN}
            orientation="white"
            onMoveAttempt={noopMoveAttempt}
            disabled
          />
        </div>

        <div className={styles.panelColumn}>
          {outgoingChallenge ? <WaitingForOpponent /> : <ChallengeSetupPanel />}
        </div>
      </div>
    </div>
  );
}