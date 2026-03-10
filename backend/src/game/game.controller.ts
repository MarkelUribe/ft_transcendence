import { Controller, Post, Get, Param, Body, Delete, UseGuards } from '@nestjs/common';
import { GameService } from './game.service';
import { PassportJwtAuthGuard } from 'src/auth/guards/passport-jwt.guard';

@UseGuards(PassportJwtAuthGuard)
@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.gameService.findOne(id);
  }

  @Get('player/:playerId')
  async getGameByPlayer(@Param('playerId') playerId: string) {
    return this.gameService.findByPlayer(playerId);
  }

  @Post()
  async createGame(@Body() body: { whiteId: string; blackId: string }) {
    return this.gameService.createGame(body.whiteId, body.blackId);
  }

  @Delete(':id')
  async deleteGame(@Param('id') id: string) {
    return this.gameService.deleteGame(id);
  }
}
