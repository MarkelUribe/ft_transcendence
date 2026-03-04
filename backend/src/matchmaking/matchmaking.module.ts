import { Module } from '@nestjs/common';

import { MatchmakingService } from '../matchmaking/matchmaking.service';
import { MatchmakingController } from './matchmaking.controller';
import { MatchmakingGateway } from './matchmaking.gateway';
import { GameModule } from '../game/game.module';

@Module({
  imports: [GameModule],
  controllers: [MatchmakingController],
  providers: [MatchmakingService, MatchmakingGateway],
})
export class MatchmakingModule {}