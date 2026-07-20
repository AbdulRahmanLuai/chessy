// src/pages/PlayComputerPage/PlayComputerPage.tsx

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Board from '@/components/chess/Board';
import { ComputerGameSetupPanel } from '@/features/game/ComputerGameSetupPanel';
import Spinner from '@/components/ui/Spinner';
import { computerService } from '@/services/computer.service';
import type { CreateComputerGameRequest } from '@/types';
import styles from './PlayComputerPage.module.css';

// No game exists yet at this point (unless one is already in progress —
// see the active-game check below) — the board is a disabled preview at
// the starting position, same convention as PlayOnlinePage.
const STARTING_POSITION_FEN =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function noopMoveAttempt(): boolean {
  return false;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PlayComputerPage() {
  const navigate = useNavigate();

  // Distinguishes "still checking for an active game" from "no active game,
  // show setup" — avoids flashing the setup panel before the check resolves.
  const [isCheckingActive, setIsCheckingActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── On mount: redirect immediately if a computer game is already in progress ──
  useEffect(() => {
    let isActive = true;

    const checkActiveGame = async () => {
      try {
        const activeGame = await computerService.getActiveGame();
        if (!isActive) return;

        if (activeGame) {
          navigate(`/play/computer/${activeGame.id}`, { replace: true });
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

  // ── Submit settings → create game → navigate to the room ──────────────────
  const handleSubmit = useCallback(
    async (settings: CreateComputerGameRequest) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const game = await computerService.createOrGetGame(settings);
        navigate(`/play/computer/${game.id}`);
      } catch {
        setError('Could not start the game. Please try again.');
        setIsSubmitting(false);
      }
    },
    [navigate],
  );

  if (isCheckingActive) {
    return (
      <div className={styles.loadingState}>
        <Spinner size="lg" label="Checking for a game in progress…" />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>Play Computer</h1>

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
          <ComputerGameSetupPanel
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
          {error && <p className={styles.errorText}>{error}</p>}
        </div>
      </div>
    </div>
  );
}