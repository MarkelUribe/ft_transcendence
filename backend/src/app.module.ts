import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { GameModule } from './game/game.module';

@Module({
  imports: [UsersModule, AuthModule, DatabaseModule, GameModule],
})
export class AppModule {}
