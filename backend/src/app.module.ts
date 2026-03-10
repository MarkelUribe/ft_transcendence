import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { GameModule } from './game/game.module';
import { MatchmakingModule } from './matchmaking/matchmaking.module';
import { FriendsModule } from './friends/friends.module';


@Module({
  imports: [UsersModule, AuthModule, DatabaseModule, GameModule, MatchmakingModule, FriendsModule],
})
export class AppModule {}
