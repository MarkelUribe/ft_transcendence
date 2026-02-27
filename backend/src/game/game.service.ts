import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Chess } from 'chess.js';
import { randomUUID } from 'crypto';
import { Game } from './entities/game.entity';

@Injectable()
export class GameService {
  private games = new Map<string, Game>();

  createGame(white: string, black: string): Game {
    const chess = new Chess();

    const game: Game = {
      id: randomUUID(),
      fen: chess.fen(),
      status: 'active',
      players: { white, black },
    };

    this.games.set(game.id, game);
    return game;
  }

  findOne(id: string): Game {
    const game = this.games.get(id);
    if (!game) {
      throw new NotFoundException('Game not found');
    }
    return game;
  }

  findByPlayer(playerId: string): { gameId: string; fen: string } | null {
    for (const game of this.games.values()) {
      if (game.players.white === playerId || game.players.black === playerId) {
        return { gameId: game.id, fen: game.fen };
      }
    }
    return null;
  }

  makeMove(id: string, from: string, to: string): Game {
    const game = this.findOne(id);

    const chess = new Chess(game.fen);

    const move = chess.move({ from, to });

    if (!move) {
      throw new BadRequestException('Invalid move');
    }

    game.fen = chess.fen();

    if (chess.isCheckmate()) {
      game.status = 'checkmate';
    } else if (chess.isDraw()) {
      game.status = 'draw';
    }
    return game;
  }
}
