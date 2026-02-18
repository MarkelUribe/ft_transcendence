import * as moves from './PieceMoves.js';

const pieceMovement = {
  r: moves.rook,
  b: moves.bishop,
  q: moves.queen,
  k: moves.king,
  n: moves.knight
};

export function getMoves(board, r, c)
{
  const piece = board[r][c];

  if (!piece)
    return [];

  if (piece.toLowerCase() === 'p')
    return moves.pawn(board, r, c);

  const movementFn = pieceMovement[piece.toLowerCase()];

  if (!movementFn)
    return [];

  const movement = movementFn();

  return moves.slideMoves(board, r, c, movement.dirs, movement.maxSteps);
}
