import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Chess } from 'chess.js';
import { randomUUID } from 'crypto';
import { Game } from './entities/game.entity';

@Injectable()
export class GameService {
  private games = new Map<string, Game>();

  create(): Game {
    const chess = new Chess();

    const game: Game = {
      id: randomUUID(),
//      id: "test",
      fen: chess.fen(),
      status: 'active',
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

/*
@Injectable()
export class GameService {
  create(createGameDto: CreateGameDto) {
    return 'This action adds a new game';
  }

  findAll() {
    return `This action returns all game`;
  }

  findOne(id: number) {
    return `This action returns a #${id} game`;
  }

  update(id: number, updateGameDto: UpdateGameDto) {
    return `This action updates a #${id} game`;
  }

  remove(id: number) {
    return `This action removes a #${id} game`;
  }
}
*/
