// src/pages/PlayOnlinePage/PlayOnlinePage.tsx
import Board from '@/components/chess/Board';
import { ChallengeSetupPanel } from '@/features/game/ChallengeSetupPanel';
import { WaitingForOpponent } from '@/features/game/WaitingForOpponent';
import { useChallenge } from '@/hooks/useChallenge';
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
  const { outgoingChallenge } = useChallenge();

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