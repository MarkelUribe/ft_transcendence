import {
	WebSocketGateway,
	WebSocketServer,
	SubscribeMessage,
	OnGatewayDisconnect,
	ConnectedSocket,
	MessageBody,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { MatchmakingService } from './matchmaking.service';

@WebSocketGateway({cors: { origin: '*' }})
export class MatchmakingGateway implements OnGatewayDisconnect {
	@WebSocketServer()
	server: Server;

	constructor(
		private readonly matchmakingService: MatchmakingService,
		private readonly jwtService: JwtService // <- inject JwtService
	) {}

	handleConnection(client: Socket) {
		const token = client.handshake.auth?.token;
		if (!token) return client.disconnect();

		try {
			const payload = this.jwtService.verify(token); // decode JWT
			client.data.userId = payload.sub; // store trusted player ID
		} catch {
			client.disconnect();
		}
	}

	@SubscribeMessage('joinQueue')
	async handleJoinQueue(@ConnectedSocket() client: Socket) {
		const playerId = client.data.userId;

		if (!playerId) { return client.disconnect(); }

		const game = await this.matchmakingService.joinQueue(playerId);

		if (!game) { return client.emit('waiting'); }

		const opponentId =
			game.white?.id === playerId
				? game.black?.id
				: game.white?.id;

		const opponentSocket = this.findSocketByPlayerId(opponentId);

		if (!opponentSocket) { return client.emit('waiting'); }

		opponentSocket.emit('matched', { gameId: game.id });
		client.emit('matched', { gameId: game.id });
	}

	@SubscribeMessage('leaveQueue')
	handleLeaveQueue(@ConnectedSocket() client: Socket) {
		const playerId = client.data.userId;
		if (playerId) this.matchmakingService.leaveQueue(playerId);
	}

	handleDisconnect(client: Socket) {
		const playerId = client.data.userId;
		if (playerId) this.matchmakingService.leaveQueue(playerId);
	}

	findSocketByPlayerId(playerId: number): Socket | undefined {
		for (const socket of this.server.sockets.sockets.values()) {
			if (socket.data.userId === playerId) {
				return socket;
			}
		}
		return undefined;
	}
}
