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
import { BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from './entities/game.entity';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: { origin: '*' } })
export class GameGateway implements OnGatewayConnection{
	@WebSocketServer()
	server: Server;

	constructor(
		private readonly gameService: GameService,
		private readonly jwtService: JwtService,
		@InjectRepository(Game)
		private readonly gameRepo: Repository<Game>,) {}

	async handleConnection(client: Socket)
	{
		try
		{
			const token = client.handshake.auth?.token;

			if (!token) { client.disconnect(); return; }

			const payload = this.jwtService.verify(token);

			client.data.userId = Number(payload.sub);

//			this.gameService.handleReconnect(client.data.userId);
//			this.server.emit('playerReconnected', { playerId: client.data.userId });
		}
		catch (err)
		{
			console.log('Socket rejected');
			client.disconnect();
		}
	}

//	handleDisconnect(client: Socket)
//	{
//		const userId = client.data.userId;
//		if (!userId) return;
//		this.gameService.handleDisconnect(userId);
//		this.server.emit('playerDisconnected', { playerId: userId });
//	}

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

			client.emit('gameState',
			{
				gameId: game.id,
				fen: game.fen,
				white: game.white,
				black: game.black,
				status: game.status
			});
		}
		catch { client.emit('error', { message: 'Game not found' }); }
	}

	@SubscribeMessage('proposeMove')
	async handleProposeMove(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: { gameId: string; from: string; to: string; promotion?: string})
	{
		const { gameId, from, to, promotion } = data;

		const userId = client.data.userId;

		if (!userId) { client.emit('moveRejected', { reason: 'Unauthorized' }); return; }

		console.log('ProposeMove received:', { gameId, from, to, promotion, userId });

		try
		{
			const game = await this.gameService.makeMove(gameId, from, to, userId, promotion);

			await this.gameRepo.save(game);

			if (game.status === 'ended')
			{
				this.server.to(gameId).emit('ended', {looser: game.looser});
				await this.gameService.deleteGame(gameId);
			}
			else
			{
				this.server.to(gameId).emit('moveMade', {
					gameId: game.id,
					fen: game.fen,
					white: game.white,
					black: game.black
				});
			}
		}
		catch (err)
		{
			const reason = err instanceof BadRequestException ? err.message : 'Invalid move';
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

			this.server.to(gameId).emit('ended', {looser: game.looser});

			await this.gameService.deleteGame(gameId);
		}
		catch { client.emit('error', { message: 'Surrender failed' }); }
	}
}
