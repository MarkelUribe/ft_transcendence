import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { GameModule } from './game/game.module';
import { MatchmakingModule } from './matchmaking/matchmaking.module';
import { FriendsModule } from './friends/friends.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'db', // nombre del contenedor
      port: +(process.env.DB_PORT || 5432),
      username: process.env.DB_USER || 'transcendence',
      password: process.env.DB_PASSWORD || 'mypassword',
      database: process.env.DB_NAME || 'transcendence',
      autoLoadEntities: true,
      synchronize: true, // solo dev
    }),
    UsersModule,
    AuthModule,
    GameModule,
    MatchmakingModule,
    FriendsModule,
  ],
})
export class AppModule {}
/*
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
*/
