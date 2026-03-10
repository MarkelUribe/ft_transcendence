import {
	WebSocketGateway,
	WebSocketServer,
	SubscribeMessage,
	OnGatewayDisconnect,
	ConnectedSocket,
	MessageBody,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { MatchmakingService } from '../matchmaking/matchmaking.service';

@WebSocketGateway({cors: { origin: '*' }})
export class MatchmakingGateway implements OnGatewayDisconnect {
	@WebSocketServer()
	server: Server;

	constructor(private readonly matchmakingService: MatchmakingService) {}

	@SubscribeMessage('joinQueue')
	handleJoinQueue(@ConnectedSocket() client: Socket, @MessageBody() data: { playerId: string })
	{
		const { playerId } = data;
		client.data.playerId = playerId;
		(async () => {
			const game = await this.matchmakingService.joinQueue(playerId);

			if (!game) return client.emit('waiting');

			const opponentSocket = this.findSocketByPlayerId(String(game.white?.id));

			if (!opponentSocket) return client.emit('waiting');

			opponentSocket.emit('matched', { gameId: game.id });
			client.emit('matched', { gameId: game.id });
		})();
	}

	@SubscribeMessage('leaveQueue')
	handleLeaveQueue(@ConnectedSocket() client: Socket)
	{
		const playerId = client.data.playerId;
		if (playerId) { this.matchmakingService.leaveQueue(playerId); }
	}

	handleDisconnect(client: Socket)
	{
		const playerId = client.data.playerId;
		if (playerId) { this.matchmakingService.leaveQueue(playerId); }
	}

	private findSocketByPlayerId(playerId: string): Socket | undefined
	{
		return Array.from(this.server.sockets.sockets.values()).find((socket) => socket.data.playerId === playerId);
	}
}
