import { Controller, Post, Get, Param, Body, UseGuards} from '@nestjs/common';
import { MatchmakingService } from '../matchmaking/matchmaking.service';
import { PassportJwtAuthGuard } from 'src/auth/guards/passport-jwt.guard';

@UseGuards(PassportJwtAuthGuard)
@Controller('matchmaking')
export class MatchmakingController {
  constructor(
    private readonly matchmakingService: MatchmakingService
  ) {}

  @Post('join')
  async joinQueue(@Body('playerId') playerId: string) {
    return await this.matchmakingService.joinQueue(playerId);
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
