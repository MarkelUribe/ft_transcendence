import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { GameService } from '../game/game.service';
import { UsersService } from '../users/users.service'

type QueuePlayer = {
	id: string;
	elo: number;
	joinedAt: number;
};

@Injectable()
export class MatchmakingService
{
	private queue: QueuePlayer[] = [];

	constructor(
		private readonly gameService: GameService,
		private readonly usersService: UsersService,
	) {}

	async joinQueue(playerId: string)
	{
		if (this.queue.some(p => p.id === playerId)) throw new BadRequestException('Already in queue');

		const player = await this.usersService.findOne(Number(playerId));

		if (!player) throw new NotFoundException('User not found');

		const joinedAt = Date.now();

		const newPlayer: QueuePlayer =
		{
			id: playerId,
			elo: player.elo,
			joinedAt
		};

		this.queue.push(newPlayer);

		while (this.queue.some(p => p.id === playerId)) // 👈 loop only while still in queue
		{
			for (let i = 0; i < this.queue.length; i++)
			{
				const opponent = this.queue[i];

				if (opponent.id === playerId) continue;

				const waitingTime = (Date.now() - joinedAt) / 1000;

				const range = 50 + waitingTime * 10;

				const eloDiff = Math.abs(opponent.elo - newPlayer.elo);

				if (eloDiff <= range && eloDiff <= 400)
				{
					this.queue = this.queue.filter(p => p.id !== playerId && p.id !== opponent.id);
					return await this.gameService.createGame(newPlayer.id, opponent.id);
				}
			}
			await new Promise(res => setTimeout(res, 1000));
		}
		return null;
	}

	leaveQueue(playerId: string) { this.queue = this.queue.filter(p => p.id !== playerId); }

	checkStatus(playerId: string)
	{
		if (this.queue.some(p => p.id === playerId)) return { status: 'waiting' };

		return { status: 'matched' };
	}
}
