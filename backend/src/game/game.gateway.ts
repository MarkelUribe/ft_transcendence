import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from './entities/game.entity';

@WebSocketGateway({ cors: { origin: '*' } })
export class GameGateway {
	@WebSocketServer()
	server: Server;

	constructor(
		private readonly gameService: GameService,
		@InjectRepository(Game) private readonly gameRepo: Repository<Game>,
	) {}

	@SubscribeMessage('joinGame')
	async handleJoinGame(@ConnectedSocket() client: Socket, @MessageBody() data: { gameId: string; playerId?: string }) {
		const { gameId } = data;
		console.log('joinGame received from', client.id, 'for', gameId);
		client.data.playerId = data.playerId;
		client.join(gameId);

		try {
			const game = await this.gameService.findOne(gameId);
			client.emit('gameState', { gameId: game.id, fen: game.fen, white: game.white, black: game.black, status: game.status });
		} catch (err) {
			client.emit('error', { message: 'Game not found' });
		}
	}

	@SubscribeMessage('proposeMove')
	async handleProposeMove(@ConnectedSocket() client: Socket, @MessageBody() data: { gameId: string; from: string; to: string }) {
		const { gameId, from, to } = data;
		console.log('ProposeMove received:', { gameId, from, to });
		try {
			const game = await this.gameService.makeMove(gameId, from, to);
			// send full state including player info so clients can recompute their colour correctly
			this.server.to(gameId).emit('moveMade', { gameId: game.id, fen: game.fen, status: game.status, white: game.white, black: game.black });
			if (game.status === 'checkmate' || game.status === 'draw') {
				this.server.to(gameId).emit('gameEnded', { status: game.status });
				await this.gameService.deleteGame(gameId);
			}
		} catch (err) {
			const reason = err instanceof BadRequestException ? err.message : 'Invalid move';
			console.log('Move error:', reason);
			client.emit('moveRejected', { reason });
		}
	}

	@SubscribeMessage('surrender')
	async handleSurrender(@ConnectedSocket() client: Socket, @MessageBody() data: { gameId: string }) {
		const { gameId } = data;
		try {
			const game = await this.gameService.findOne(gameId);
			game.status = 'checkmate'; // treat surrender as checkmate for simplicity
			await this.gameRepo.save(game);
			this.server.to(gameId).emit('gameEnded', { status: 'checkmate' });
			await this.gameService.deleteGame(gameId);
		} catch (err) {
			client.emit('error', { message: 'Surrender failed' });
		}
	}
}
