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
import { MatchmakingService } from '../matchmaking/matchmaking.service';

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

	console.log('--- joinQueue called ---');
	console.log('socket.id:', client.id);
	console.log('playerId from socket:', playerId);

	if (!playerId) {
		console.log('No playerId, disconnecting socket');
		return client.disconnect();
	}

	const game = await this.matchmakingService.joinQueue(playerId);

	console.log('game returned from matchmaking:', game);

	if (!game) {
		console.log('No match yet, emitting waiting');
		return client.emit('waiting');
	}

	console.log('white player id:', game.white?.id);
	console.log('black player id:', game.black?.id);

	const opponentId =
		game.white?.id === playerId
			? game.black?.id
			: game.white?.id;

	console.log('calculated opponentId:', opponentId);

	const opponentSocket = this.findSocketByPlayerId(opponentId);

	console.log(
		'opponent socket found:',
		opponentSocket ? opponentSocket.id : 'NONE'
	);

	if (!opponentSocket) {
		console.log('Opponent socket not found, emitting waiting');
		return client.emit('waiting');
	}

	console.log('Emitting matched to both players. Game ID:', game.id);

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
