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
import { FriendsService } from './friends.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class FriendsGateway implements OnGatewayDisconnect {
	@WebSocketServer()
	server: Server;

	constructor(
		private readonly friendsService: FriendsService,
		private readonly jwtService: JwtService // <- inject JwtService
	) { }

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

	@SubscribeMessage('getPendingRequestsForUser')
	async getPendingRequestsForUser(@ConnectedSocket() client: Socket) {
		const userId = client.data.userId;

		if (!userId) { return client.disconnect(); }

		const game = await this.friendsService.getPendingRequestsForUser(userId);

		
	}

}
