import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { MatchmakingService } from '../matchmaking/matchmaking.service';

@Controller('matchmaking')
export class MatchmakingController {
  constructor(
    private readonly matchmakingService: MatchmakingService
  ) {}

  @Post('join')
  joinQueue(@Body('playerId') playerId: string) {
    return this.matchmakingService.joinQueue(playerId);
  }

  @Post('leave')
  leaveQueue(@Body('playerId') playerId: string) {
    return this.matchmakingService.leaveQueue(playerId);
  }

  @Get('status/:playerId')
  checkStatus(@Param('playerId') playerId: string) {
    return this.matchmakingService.checkStatus(playerId);
  }
}
