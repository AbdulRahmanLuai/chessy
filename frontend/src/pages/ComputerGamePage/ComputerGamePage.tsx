// src/pages/ComputerGamePage/ComputerGamePage.tsx

import { useParams, Navigate } from 'react-router-dom';
import ComputerGameRoom from '@/components/chess/ComputerGameRoom';
import { useEffect } from 'react';

// ─── Component ────────────────────────────────────────────────────────────────

// Pages are thin. No logic, no state, no store access.
// Validate the param and delegate everything to ComputerGameRoom.

export default function ComputerGamePage() {
  const { gameId } = useParams<{ gameId: string }>();
    console.log('ComputerGamePage rendered');



  // If the route somehow fires without a gameId, redirect to setup
  if (!gameId) return <Navigate to="/play/computer" replace />;

  
  return <ComputerGameRoom gameId={gameId} />;
}