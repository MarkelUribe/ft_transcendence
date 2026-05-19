import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Chess } from 'chess.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from './entities/game.entity';
import { Move } from './entities/move.entity';
import { User } from '../users/user.entity';
import { ChessClockService } from './chess-clock/chess-clock.service';
import { GameGateway } from './game.gateway';

@Injectable()
export class GameService
{
	constructor(
		@InjectRepository(Game) private readonly gameRepo: Repository<Game>,
		@InjectRepository(User) private readonly userRepo: Repository<User>,
		@InjectRepository(Move) private moveRepo: Repository<Move>,
		private readonly gameGateway: GameGateway,
		private chessClockService: ChessClockService,
	) {}

	async createGame(whiteId: string, blackId: string): Promise<Game>
	{
		const player1 = await this.userRepo.findOneBy({ id: Number(whiteId) });
		const player2 = await this.userRepo.findOneBy({ id: Number(blackId) });

		if (!player1 || !player2) { throw new NotFoundException('User not found'); }

		const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

		const isSwap = Math.random() < 0.5;

		const white = isSwap ? player2 : player1;
		const black = isSwap ? player1 : player2;

		const game = await this.gameRepo.save(
			this.gameRepo.create({
				white,
				black,
				status: 'active',
				looser: -1,
				whiteElo: white.elo,
				blackElo: black.elo,
				lastMoveTimestamp: Date.now(),
			})
		);

		await this.moveRepo.save(
		{
			game,
			from: '',
			to: '',
			san: 'start',
			fen: fen,
			whiteTimeMs: game.whiteTimeMs,
			blackTimeMs: game.blackTimeMs,
		});

		this.chessClockService.startTimeout( game,
			async () => {
				await this.handleTimeout(game.id);
			},
		);

		return game;
	}

	async handleTimeout(gameId: string)
	{
		const game = await this.gameRepo.findOne({
			where: { id: gameId },
			relations: ['white', 'black'],
		});

		if (!game)
			return;

		if (game.status !== 'active')
			return;

		game.status = 'ended';

		game.looser = game.activeColor === 'white' ? game.white.id : game.black.id;

		this.eloGivingLogic(game, game.activeColor == 'white'? 'black' : 'white');

		await this.gameRepo.save(game);

		this.gameGateway.server.to(game.id).emit('ended', {	looser: game.looser});
	}

	async findOne(id: string): Promise<Game>
	{
		const game = await this.gameRepo.findOne({ where: { id } });
		if (!game) throw new NotFoundException('Game not found');
		return game;
	}

	async findByPlayer(playerId: number): Promise<{ gameId: string;} | null>
	{
		const idNum = playerId;
		const game = await this.gameRepo
			.createQueryBuilder('game')
			.leftJoinAndSelect('game.white', 'white')
			.leftJoinAndSelect('game.black', 'black')
		.where('(white.id = :id OR black.id = :id) AND game.status = :status', {
			id: idNum,
			status: 'active',
		})
		.getOne();

		if (!game)
			return null;

		return { gameId: game.id };
	}

	async findLastGamesByPlayer(playerId: number, limit: number): Promise<Game[]> {
		if (limit <= 0) throw new BadRequestException('Limit must be greater than zero');

		return this.gameRepo
			.createQueryBuilder('game')
			.leftJoinAndSelect('game.white', 'white')
			.leftJoinAndSelect('game.black', 'black')
			.where('white.id = :id OR black.id = :id', { id: playerId })
			.orderBy('game.createdAt', 'DESC')
			.limit(limit)
			.getMany();
	}

	async deleteGame(id: string): Promise<void> { await this.gameRepo.delete(id); }

	private async eloGivingLogic(game: Game, winner: 'white' | 'black' | 'draw')
	{
		const K = 32;

		const whiteElo = game.white.elo;
		const blackElo = game.black.elo;

		const expectedWhite = 1 / (1 + Math.pow(10, (blackElo - whiteElo) / 400));
		const expectedBlack = 1 / (1 + Math.pow(10, (whiteElo - blackElo) / 400));

		let scoreWhite = 0.5;
		let scoreBlack = 0.5;
		game.looser = -1;

		if (winner === 'white')
		{
			scoreWhite = 1;
			scoreBlack = 0;
			game.looser = game.black.id;
			game.status = 'checkmate';
		}
		else if (winner === 'black')	
		{
			scoreWhite = 0;
			scoreBlack = 1;
			game.looser = game.white.id;
			game.status = 'checkmate';
		}
		else
		{
			game.status = 'stalemate';
		}

		game.white.elo = Math.max(0, Math.round(whiteElo + K * (scoreWhite - expectedWhite)));
		game.black.elo = Math.max(0, Math.round(blackElo + K * (scoreBlack - expectedBlack)));
		await this.userRepo.save(game.white);
		await this.userRepo.save(game.black);
	}

	async makeMove(id: string, from: string, to: string, userId: number, promotion?: string): Promise<Game>
	{
		const game = await this.findOne(id);

		if (game.status == 'ended') new BadRequestException("Game ended, cannot make a move");

		let turnId = '';
		if (game.white.id === userId) turnId = 'white';
		if (game.black.id === userId) turnId = 'black';

		const lastMove = await this.moveRepo.findOne({
			where: { game: { id } },
			order: { id: 'DESC' },
		});

		if (game.activeColor !== turnId) throw new BadRequestException("Not your turn silly");

		const currentFen = lastMove ? lastMove.fen : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNQkq - 0 1';

		const chess = new Chess(currentFen);

		const move = chess.move({ from, to, promotion } as any);

		if (!move) throw new BadRequestException('Invalid move');

//		console.log('New move:', {
//			from,
//			to,
//			san: move.san,
//			fenAfter,
//		});
	
		this.chessClockService.clearTimeout(game.id);

		if (chess.isCheckmate())
		{
			this.eloGivingLogic(game, turnId as 'white' | 'black');
			await this.gameRepo.save(game);
		}
		else if (chess.isDraw())
		{
			this.eloGivingLogic(game, 'draw');
			await this.gameRepo.save(game);
		}
		else
		{
			this.chessClockService.updateClock(game);

			const newMove = this.moveRepo.create({
				game,
				from,
				to,
				promotion,
				san: move.san,
				fen: chess.fen(),
				whiteTimeMs: game.whiteTimeMs,
				blackTimeMs: game.blackTimeMs,
			});

			await this.moveRepo.save(newMove);

			if (!game.moves) game.moves = [];
			
			game.moves.push(newMove);

			await this.gameRepo.save(game);

			this.chessClockService.startTimeout(game, async () => { await this.handleTimeout(game.id); });
		}
	
		return game;
	}

	async surrender(id: string, userId: number)
	{
		const game = await this.findOne(id);

		if (game.status === 'ended') return null;

		if (game.white.id !== userId && game.black.id !== userId) return null;

		let winner = '';
		if (game.white.id === userId) winner = 'b';
		if (game.black.id === userId) winner = 'w';

		this.eloGivingLogic(game, winner as 'white' | 'black');

		return this.gameRepo.save(game);
	}

	getMoves(gameId: string)
	{
		return this.moveRepo.find({
			where: { game: { id: gameId } },
			order: { id: 'ASC' },
		});
	}
}