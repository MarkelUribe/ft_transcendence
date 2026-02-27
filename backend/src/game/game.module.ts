import { Module } from '@nestjs/common';

import { GameService } from './game.service';
import { GameController } from './game.controller';

import { MatchmakingService } from './matchmaking.service';
import { MatchmakingController } from './matchmaking.controller';

@Module({
  controllers: [GameController, MatchmakingController],
  providers: [GameService, MatchmakingService],
})
export class GameModule {}