// src/hooks/useAcceptedChallengeRedirect.ts
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChallengeStore } from '@/store/challengeStore';

// Single global place that reacts to a challenge being accepted (whichever
// side accepted it) and navigates into the game. Deliberately NOT handled
// inside WaitingForOpponent or IncomingChallengesButton — both of those are
// mounted simultaneously (Navbar is global), so having each navigate
// independently would risk a double-navigate or race. This hook is called
// once, from AppLayout, which sits above both.
export function useAcceptedChallengeRedirect(): void {
  const navigate = useNavigate();
  const acceptedGameId = useChallengeStore((s) => s.acceptedGameId);
  const clearAcceptedGameId = useChallengeStore((s) => s.clearAcceptedGameId);

  useEffect(() => {
    if (!acceptedGameId) return;
    navigate(`/game/${acceptedGameId}`);
    clearAcceptedGameId();
  }, [acceptedGameId, navigate, clearAcceptedGameId]);
}