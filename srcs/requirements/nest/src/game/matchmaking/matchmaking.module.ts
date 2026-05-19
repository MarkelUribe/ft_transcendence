import { Module } from '@nestjs/common';

import { MatchmakingService } from './matchmaking.service';
import { MatchmakingController } from './matchmaking.controller';
import { MatchmakingGateway } from './matchmaking.gateway';
import { GameModule } from '../game.module';
import { UsersModule } from '../../users/users.module'

@Module({
  imports: [GameModule, UsersModule],
  controllers: [MatchmakingController],
  providers: [MatchmakingService, MatchmakingGateway],
})
export class MatchmakingModule {}