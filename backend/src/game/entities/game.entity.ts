export class Game {
  id: string;
  fen: string;
//  turn: 'white' | 'black';
  players: {
    white: string;
    black: string;
  }
  status: 'active' | 'checkmate' | 'draw';
}