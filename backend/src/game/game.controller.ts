import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { GameService } from './game.service';
import { MakeMoveDto } from './dto/make-move.dto';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post()
  create() {
    return this.gameService.create();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gameService.findOne(id);
  }

  @Post(':id/move')
  makeMove(
    @Param('id') id: string,
    @Body() moveDto: MakeMoveDto,
  ) {
    return this.gameService.makeMove(id, moveDto.from, moveDto.to);
  }
}
