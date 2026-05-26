import { NotFoundException, Controller, Post, Get, Param, Body, Delete, UseGuards, Req} from '@nestjs/common';
import { GameService } from './game.service';
import { PassportJwtAuthGuard } from 'src/auth/guards/passport-jwt.guard';

@UseGuards(PassportJwtAuthGuard)
@Controller('game')
export class GameController {
	constructor(private readonly gameService: GameService) {}

	@Get('player')
	@UseGuards(PassportJwtAuthGuard)
	async getMyGame(@Req() req) {
		const userId = req.user.id; // from token
		return this.gameService.findByPlayer(userId);
	}

	@Get(':id')
	async findOne(id: string) {
		const game = await this.gameService.findOne(id);

		if (!game) {
			throw new NotFoundException('Game not found');
		}

		return game;
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
