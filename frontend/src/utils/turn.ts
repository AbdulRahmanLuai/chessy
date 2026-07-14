import type { Color } from '../types';

/**
 * Derives the active color from a FEN string's active-color field.
 * FEN format: "<pieces> <active-color> <castling> <en-passant> <halfmove> <fullmove>"
 */
export function getActiveColor(fen: string): Color {
  const activeColorField = fen.split(' ')[1];
  return activeColorField === 'b' ? 'black' : 'white';
}