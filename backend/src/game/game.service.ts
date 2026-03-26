import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Chess } from 'chess.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from './entities/game.entity';
import { User } from '../users/user.entity';

@Injectable()
export class GameService
{
	constructor(
		@InjectRepository(Game) private readonly gameRepo: Repository<Game>,
		@InjectRepository(User) private readonly userRepo: Repository<User>,
	) {}

	async createGame(whiteId: string, blackId: string): Promise<Game> {
		const white = await this.userRepo.findOneBy({ id: Number(whiteId) });
		const black = await this.userRepo.findOneBy({ id: Number(blackId) });

		if (!white || !black) { throw new NotFoundException('User not found'); }

		const chess = new Chess();

		const game = this.gameRepo.create({
			fen: chess.fen(),
			white,
			black,
			status: 'active',
		} as Partial<Game>);

		return this.gameRepo.save(game);
	}

	async findOne(id: string): Promise<Game>
	{
		const game = await this.gameRepo.findOne({ where: { id } });
		if (!game) throw new NotFoundException('Game not found');
		return game;
	}

	async findByPlayer(playerId: number): Promise<{ gameId: string; fen: string } | null>
	{
		const idNum = playerId;
		const game = await this.gameRepo
			.createQueryBuilder('game')
			.leftJoinAndSelect('game.white', 'white')
			.leftJoinAndSelect('game.black', 'black')
			.where('white.id = :id OR black.id = :id', { id: idNum })
			.getOne();

		if (!game) return null;
		return { gameId: game.id, fen: game.fen };
	}

	async deleteGame(id: string): Promise<void> { await this.gameRepo.delete(id); }

	async makeMove(id: string, from: string, to: string, userId: number, promotion?: string): Promise<Game> {
		const game = await this.findOne(id);

		let turnId = '';
		if (game.white.id === userId) turnId = 'w';
		if (game.black.id === userId) turnId = 'b';

		const turn = game.fen.split(' ')[1]; // w or b

		if (turn !== turnId) throw new BadRequestException("Bro dont cheat");

		const chess = new Chess(game.fen);
		console.log('Move attempt - FEN:', game.fen, 'Turn:', chess.turn(), 'From:', from, 'To:', to, 'Promotion:', promotion);

		const move = chess.move({ from, to, promotion } as any);
		console.log('Move result:', move);

		if (!move) throw new BadRequestException('Invalid move');

		game.fen = chess.fen();

		if (chess.isCheckmate()) game.status = 'checkmate';
		else if (chess.isDraw()) game.status = 'draw';

		return this.gameRepo.save(game);
	}
}
