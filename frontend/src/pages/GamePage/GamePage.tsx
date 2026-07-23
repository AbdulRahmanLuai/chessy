import { useParams, Navigate } from 'react-router-dom';
import GameRoom from '@/components/chess/GameRoom/GameRoom';

// ─── Component ────────────────────────────────────────────────────────────────

// Pages are thin. No logic, no state, no store access.
// Validate the param and delegate everything to GameRoom.

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();

  // If the route somehow fires without a gameId, redirect to lobby
  if (!gameId) return <Navigate to="/play/online" replace />;

  return <GameRoom gameId={gameId} />;
}