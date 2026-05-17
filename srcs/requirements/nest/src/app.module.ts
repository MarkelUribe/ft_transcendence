import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { GameModule } from './game/game.module';
import { MatchmakingModule } from './matchmaking/matchmaking.module';
import { FriendsModule } from './friends/friends.module';
import { HealthController } from './health.controller';


@Module({
  imports: [UsersModule, AuthModule, DatabaseModule, GameModule, MatchmakingModule, FriendsModule],
  controllers: [HealthController],
})
export class AppModule {}
