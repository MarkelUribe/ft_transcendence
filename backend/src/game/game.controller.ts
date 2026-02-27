import { Controller, Post, Get, Param, Body, Req} from '@nestjs/common';
import { GameService } from './game.service';
import { MakeMoveDto } from './dto/make-move.dto';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}
  
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gameService.findOne(id);
  }

  @Get('player/:playerId')
  getGameByPlayer(@Param('playerId') playerId: string) {
    return this.gameService.findByPlayer(playerId);
  }

  @Post(':id/move')
  makeMove(
    @Param('id') gameId: string,
    @Body() dto: { from: string; to: string },
  ) {
    return this.gameService.makeMove(gameId, dto.from, dto.to);
  }
}
