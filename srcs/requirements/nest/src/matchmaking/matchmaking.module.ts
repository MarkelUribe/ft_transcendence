import { Module } from '@nestjs/common';

import { MatchmakingService } from './matchmaking.service';
import { MatchmakingController } from './matchmaking.controller';
import { MatchmakingGateway } from './matchmaking.gateway';
import { GameModule } from '../game/game.module';
import { UsersModule } from '../users/users.module'
import { FriendsModule } from '../friends/friends.module';

@Module({
  imports: [GameModule, UsersModule, FriendsModule],
  controllers: [MatchmakingController],
  providers: [MatchmakingService, MatchmakingGateway],
})
export class MatchmakingModule {}