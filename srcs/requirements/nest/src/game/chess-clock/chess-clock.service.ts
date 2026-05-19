import { Injectable } from '@nestjs/common';
import { Game } from '../entities/game.entity';

@Injectable()
export class ChessClockService
{
	private timeouts = new Map<string, ReturnType<typeof setTimeout>>();

	getRemainingTime(game: Game, color: 'white' | 'black'): number
	{
		const base = color === 'white' ? game.whiteTimeMs : game.blackTimeMs;

		if (game.activeColor !== color)
		{
			return base;
		}

		const elapsed = Date.now() - game.lastMoveTimestamp;

		return Math.max(0, base - elapsed);
	}

	updateClock(game: Game)
	{
		const now = Date.now();

		const elapsed = now - game.lastMoveTimestamp;

		if (game.activeColor === 'white')
		{
			game.whiteTimeMs -= elapsed;
		}
		else
		{
			game.blackTimeMs -= elapsed;
		}

		game.activeColor = game.activeColor === 'white' ? 'black' : 'white';

		game.lastMoveTimestamp = now;
	}

	startTimeout(game: Game, callback: () => void,)
	{
		const remaining = this.getRemainingTime( game, game.activeColor, );

		const timeout = setTimeout(() => { callback(); }, remaining);

		this.timeouts.set(game.id, timeout);
	}

	clearTimeout(gameId: string)
	{
		const timeout = this.timeouts.get(gameId);

		if (!timeout)
		{
			return;
		}

		clearTimeout(timeout);

		this.timeouts.delete(gameId);
	}
}