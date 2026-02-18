export class Game {
  id: string;
  fen: string;
//  turn: 'white' | 'black';
  status: 'active' | 'checkmate' | 'draw';
}