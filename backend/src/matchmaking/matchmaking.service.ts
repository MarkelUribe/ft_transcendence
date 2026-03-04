import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { GameService } from '../game/game.service';

@Injectable()
export class MatchmakingService {
  private queue: string[] = [];

  constructor(private readonly gameService: GameService) {}

  joinQueue(playerId: string) {
    if (this.queue.includes(playerId)) {
      throw new BadRequestException('Already in queue');
    }

    if (this.queue.length > 0) {
      const opponentId = this.queue.shift()!;
      return this.gameService.createGame(opponentId, playerId);
    }
    this.queue.push(playerId); 
    return null;
  }

  leaveQueue(playerId: string) {
    this.queue = this.queue.filter(id => id !== playerId);
  }

  checkStatus(playerId: string) {
    if (this.queue.includes(playerId)){
      return { status: 'waiting' };
    }
    return { status: 'matched' };
  }
}
