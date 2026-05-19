import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GameService } from './game.service';
import { GameController } from './game.controller';
import { GameGateway } from './game.gateway';
import { Game } from './entities/game.entity';
import { User } from '../users/user.entity';
import { Move } from './entities/move.entity';
import { ChessClockService } from './chess-clock/chess-clock.service';

@Module({
  imports: [TypeOrmModule.forFeature([Game, User, Move])],
  controllers: [GameController],
  providers: [GameService, GameGateway, ChessClockService],
  exports: [GameService], 
})
export class GameModule {}
