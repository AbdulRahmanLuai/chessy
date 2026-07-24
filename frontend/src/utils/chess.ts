import type { Color } from '../types';
import { Chess } from 'chess.js';
import type { Move } from '@/types';

/**
 * Derives the active color from a FEN string's active-color field.
 * FEN format: "<pieces> <active-color> <castling> <en-passant> <halfmove> <fullmove>"
 */
export function getActiveColor(fen: string): Color {
  const activeColorField = fen.split(' ')[1];
  return activeColorField === 'b' ? 'black' : 'white';
}



/**
 * Replays `moves` up to and including `ply` (0-based) from `startFen`
 * (or the standard starting position) and returns the resulting FEN.
 * ply === -1 returns the start position.
 */
export function computeFenAtPly(
  moves: Move[],
  ply: number,
  startFen?: string,
): string {
  const chess = startFen ? new Chess(startFen) : new Chess();

  const end = Math.min(ply, moves.length - 1);
  for (let i = 0; i <= end; i++) {
    const m = moves[i];
    const moveInput = m.promotion
      ? { from: m.from.toLowerCase(), to: m.to.toLowerCase(), promotion: m.promotion }
      : { from: m.from.toLowerCase(), to: m.to.toLowerCase() };

    try {
      chess.move(moveInput);
    } catch (err) {
      console.error('computeFenAtPly: failed to replay move', i, m, err);
      break;
    }
  }

  return chess.fen();
}