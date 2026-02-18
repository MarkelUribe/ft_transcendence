function fenToBoard(fen) {
  const board = [];
  const rows = fen.split(' ')[0].split('/');

  for (const row of rows) {
    const boardRow = [];
    for (const char of row) {
      if (char >= '1' && char <= '8') {
        boardRow.push(...Array(Number(char)).fill(null));
      } else {
        boardRow.push(char);
      }
    }
    board.push(boardRow);
  }

  return board;
}

function color(piece) {
  if (!piece) return null;
  return piece === piece.toUpperCase() ? 'w' : 'b';
}

function isEnemy(a, b) {
  if (!a || !b) return false;
  return color(a) !== color(b);
}

function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function pieceImage(piece) {
  if (!piece) return '';
  return `/pieces/${piece}.png`;
}

export {
  fenToBoard,
  color,
  isEnemy,
  inBounds,
  pieceImage,
};