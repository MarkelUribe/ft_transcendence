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

	async createGame(whiteId: string, blackId: string): Promise<Game>
	{
		const player1 = await this.userRepo.findOneBy({ id: Number(whiteId) });
		const player2 = await this.userRepo.findOneBy({ id: Number(blackId) });

		if (!player1 || !player2) { throw new NotFoundException('User not found'); }

		const chess = new Chess();

		const isSwap = Math.random() < 0.5;

		const white = isSwap ? player2 : player1;
		const black = isSwap ? player1 : player2;

		const game = this.gameRepo.create({
			fen: chess.fen(),
			white,
			black,
			status: 'active',
			looser: -1
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

	private async eloGivingLogic(game: Game, winner: 'w' | 'b' | 'd') {
		const K = 32;

		const whiteElo = game.white.elo;
		const blackElo = game.black.elo;

		const expectedWhite = 1 / (1 + Math.pow(10, (blackElo - whiteElo) / 400));
		const expectedBlack = 1 / (1 + Math.pow(10, (whiteElo - blackElo) / 400));

		let scoreWhite = 0.5;
		let scoreBlack = 0.5;
		game.looser = -1;

		if (winner === 'w')
		{
			scoreWhite = 1;
			scoreBlack = 0;
			game.looser = game.black.id;
		}
		else if (winner === 'b')	
		{
			scoreWhite = 0;
			scoreBlack = 1;
			game.looser = game.white.id;
		}

		game.status = 'ended'

		game.white.elo = Math.max(0, Math.round(whiteElo + K * (scoreWhite - expectedWhite)));
		game.black.elo = Math.max(0, Math.round(blackElo + K * (scoreBlack - expectedBlack)));
		await this.userRepo.save(game.white);
		await this.userRepo.save(game.black);
	}

	async makeMove(id: string, from: string, to: string, userId: number, promotion?: string): Promise<Game>
	{
		const game = await this.findOne(id);

		let turnId = '';
		if (game.white.id === userId) turnId = 'w';
		if (game.black.id === userId) turnId = 'b';

		const turn = game.fen.split(' ')[1]; // w or b

		if (turn !== turnId) throw new BadRequestException("Bro dont cheat");

		const chess = new Chess(game.fen);

		const move = chess.move({ from, to, promotion } as any);

		if (!move) throw new BadRequestException('Invalid move');

		game.fen = chess.fen();

		if (chess.isCheckmate()) {
			this.eloGivingLogic(game, turnId as 'w' | 'b');
		} else if (chess.isDraw()) {
			this.eloGivingLogic(game, 'd');
		}
		return this.gameRepo.save(game);
	}

	async surrender(id: string, userId: number)
	{
		const game = await this.findOne(id);

		let winner = '';
		if (game.white.id === userId) winner = 'b';
		if (game.black.id === userId) winner = 'w';

		this.eloGivingLogic(game, winner as 'w' | 'b');

		return this.gameRepo.save(game);
	}
}
