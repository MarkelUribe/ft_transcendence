import {
	WebSocketGateway,
	WebSocketServer,
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class FriendsGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server: Server;

	constructor(
		private readonly jwtService: JwtService,
	) { }

	private userRoom(userId: number) {
		return `user:${userId}`;
	}

	handleConnection(client: Socket) {
		const token = client.handshake.auth?.token;
		if (!token) {
			client.disconnect();
			return;
		}

		try {
			const payload = this.jwtService.verify(token);
			const userId = Number(payload.sub);
			if (!Number.isFinite(userId)) {
				client.disconnect();
				return;
			}
			client.data.userId = userId;
			client.join(this.userRoom(userId));
		} catch {
			client.disconnect();
		}
	}

	handleDisconnect(_client: Socket) {
		// No-op for now.
	}

	emitToUser(userId: number, event: string, payload: unknown) {
		this.server.to(this.userRoom(userId)).emit(event, payload);
	}

	emitToUsers(userIds: number[], event: string, payload: unknown) {
		for (const userId of userIds) {
			this.emitToUser(userId, event, payload);
		}
	}

	//@SubscribeMessage('friends:getPresence')
}
