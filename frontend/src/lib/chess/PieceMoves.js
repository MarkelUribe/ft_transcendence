import * as utils from './Utils.js';

function pawn(board, r, c) {
  const moves = [];
  const piece = board[r][c];
  const dir = piece === 'P' ? -1 : 1;
  const startRow = piece === 'P' ? 6 : 1;

  const nr = r + dir;

  // forward one
  if (utils.inBounds(nr, c) && board[nr][c] === null) {
    moves.push({ row: nr, col: c, capture: false });

    // forward two
    const nr2 = r + dir * 2;
    if (
      r === startRow &&
      utils.inBounds(nr2, c) &&
      board[nr2][c] === null
    ) {
      moves.push({ row: nr2, col: c, capture: false });
    }
  }

  // captures
  for (const dc of [-1, 1]) {
    const nc = c + dc;
    if (!utils.inBounds(nr, nc)) continue;

    const target = board[nr][nc];
    if (target && utils.isEnemy(piece, target)) {
      moves.push({ row: nr, col: nc, capture: true });
    }
  }

  return moves;
}


function rook() {
  return { dirs: [[1,0], [-1,0], [0,1], [0,-1]], maxSteps: 8 };
}

function bishop() {
  return { dirs: [[1,1],[1,-1],[-1,1],[-1,-1]], maxSteps: 8 };
}

function queen() {
  return { dirs: [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]], maxSteps: 8 };
}

function king() {
  return { dirs: [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]], maxSteps: 1 };
}

function knight() {
  return { dirs: [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]], maxSteps: 1 };
}

function slideMoves(board, r, c, directions, maxSteps = 8) {
  const moves = [];
  const piece = board[r][c];

  for (const [dr, dc] of directions)
  {
    let nr = r + dr;
    let nc = c + dc;

    let moved = 1;

    while (utils.inBounds(nr, nc) && board[nr][nc] === null)
    {
      moves.push({ row: nr, col: nc, capture: false});
      if (moved == maxSteps)
        break ;
      nr += dr;
      nc += dc;
      moved ++;
    }
    if (utils.inBounds(nr, nc) && utils.isEnemy(piece, board[nr][nc]))
      moves.push({ row: nr, col: nc, capture: true});
  }
  return moves;
}

export {
  pawn,
  rook,
  bishop,
  queen,
  king,
  knight,
  slideMoves
};
