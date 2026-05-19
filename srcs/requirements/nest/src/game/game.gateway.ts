import {
	WebSocketGateway,
	WebSocketServer,
	SubscribeMessage,
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from './entities/game.entity';
import { Move } from './entities/move.entity';
import { JwtService } from '@nestjs/jwt';

import {
	forwardRef,
	Inject,
} from '@nestjs/common';

@WebSocketGateway({ cors: { origin: '*' } })
export class GameGateway implements OnGatewayConnection{
	@WebSocketServer()
	server: Server;


	constructor(
		@Inject(forwardRef(() => GameService))
		private gameService: GameService,
		private readonly jwtService: JwtService,
		@InjectRepository(Game)
		private readonly gameRepo: Repository<Game>,
		@InjectRepository(Move)
		private readonly moveRepo: Repository<Move>,) {}

	async handleConnection(client: Socket)
	{
		try
		{
			const token = client.handshake.auth?.token;

			if (!token) { client.disconnect(); return; }

			const payload = this.jwtService.verify(token);

			client.data.userId = Number(payload.sub);
		}
		catch (err)
		{
			console.log('Socket rejected');
			client.disconnect();
		}
	}

	@SubscribeMessage('joinGame')
	async handleJoinGame(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: { gameId: string })
	{
		const { gameId } = data;

		client.join(gameId);

		try
		{
			const game = await this.gameService.findOne(gameId);

			const moves = await this.moveRepo.find(
			{
				where: { game: { id: gameId } },
				order: { id: 'ASC' },
			});

			client.emit('gameState', {
				gameId: game.id,
				white: game.white,
				black: game.black,
				status: game.status,
				moves: moves.map(m => ({
					from: m.from,
					to: m.to,
					san: m.san,
					promotion: m.promotion,
					fen: m.fen,
					whiteTimeMs: m.whiteTimeMs,
					blackTimeMs: m.blackTimeMs,
				})),
			});

			const history = this.gameService.getChatHistory(gameId);
            client.emit('chatHistory', history);
		}
		catch { client.emit('error', { message: 'Game not found' }); }
	}

	@SubscribeMessage('getMatchHistory')
	async handleGetMatchHistory(
	@ConnectedSocket() client: Socket,
	@MessageBody() data: { userId?: number; limit?: number })
	{
		const requestedUserId = data?.userId ?? client.data.userId;
		const limit = data?.limit ?? 10;

		if (!requestedUserId)
		{
			client.emit('error', { message: 'Unauthorized' });
			return;
		}

		if (limit <= 0)
		{
			client.emit('error', { message: 'Limit must be greater than zero' });
			return;
		}

		try
		{
			const games = await this.gameService.findLastGamesByPlayer(Number(requestedUserId), limit);

			client.emit('matchHistory', {
			games: games.map(game => ({
				gameId: game.id,
				white: {
				id: game.white.id,
				username: game.white.username,
				avatarUrl: game.white.avatarUrl,
				elo: game.whiteElo,
				},
				black: {
				id: game.black.id,
				username: game.black.username,
				avatarUrl: game.black.avatarUrl,
				elo: game.blackElo,
				},
				status: game.status,
				looser: game.looser,
				createdAt: game.createdAt,
				updatedAt: game.updatedAt,
			})),
			});
		}
		catch (err)
		{
			client.emit('error', { message: 'Unable to load match history' });
		}
	}

	@SubscribeMessage('proposeMove')
	async handleProposeMove(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: { gameId: string; from: string; to: string; promotion?: string})
	{
		const { gameId, from, to, promotion } = data;

		const userId = client.data.userId;

		if (!userId) { client.emit('moveRejected', { reason: 'Unauthorized' }); return; }

//		console.log('ProposeMove received:', { gameId, from, to, promotion, userId });

		try
		{

			const game = await this.gameService.makeMove(gameId, from, to, userId, promotion);

			if (game.status === 'checkmate' || game.status === 'stalemate')
			{
				game.status = 'ended';
				await this.gameRepo.save(game);
				return this.server.to(gameId).emit('ended', { looser: game.looser });
			}

			const move = await this.moveRepo.findOne(
			{
				where: { game: { id: gameId } },
				order: { id: 'DESC' },
			});

			if (!move) { throw new Error('Move was not created'); }

			this.server.to(gameId).emit('moveMade',
			{
				move: move,
			});
		}
		catch
		{
			const reason = 'Invalid move';
			console.log('Move error:', reason);
			client.emit('moveRejected', { reason });
		}
	}

	@SubscribeMessage('surrender')
	async handleSurrender(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: { gameId: string })
	{
		const { gameId } = data;

		try
		{
			const userId = client.data.userId;

			if (!userId) { client.emit('error', { message: 'Unauthorized' }); return; }

			const game = await this.gameService.surrender(gameId, userId);

			if (!game) return ;

			game.status = 'ended';
			await this.gameRepo.save(game);
			this.server.to(gameId).emit('ended', { looser: game.looser });
		}
		catch { client.emit('error', { message: 'Surrender failed' }); }
	}

	@SubscribeMessage('sendMessage')
    async handleSendMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { gameId: string; user: string; text: string }
    ) {
        const { gameId, user, text } = data;

        const userId = client.data.userId;
        if (!userId) return;

		this.gameService.addMessage(gameId, { user, text });

        this.server.to(gameId).emit('chatMessage', {
            user,
            text
        });
    }
}
