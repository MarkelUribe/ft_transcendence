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
import { BadRequestException } from '@nestjs/common';

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
			const userId = Number(payload.sub);
			if (!Number.isFinite(userId)) return client.disconnect();
			client.data.userId = userId; // store trusted player ID
			client.join(this.userRoom(userId));

			const pending = this.matchmakingService.getPendingInvitesForUser(userId);
			if (pending.length > 0) {
				client.emit('match:pendingInvites', pending);
			}
		} catch {
			client.disconnect();
		}
	}

	private userRoom(userId: number) {
		return `user:${userId}`;
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

	@SubscribeMessage('inviteFriend')
	async handleInviteFriend(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: { friendId: number },
	) {
		const inviterId = Number(client.data.userId);
		const friendId = Number(data?.friendId);
		if (!inviterId) return client.disconnect();
		if (!Number.isFinite(friendId)) {
			client.emit('match:inviteError', { message: 'Invalid friend id' });
			return;
		}

		try {
			const sockets = await this.server.in(this.userRoom(friendId)).allSockets();
			if (sockets.size === 0) {
				client.emit('match:inviteError', { message: 'Friend is not online' });
				return;
			}

			const { invite, inviter } = await this.matchmakingService.createInvite(inviterId, friendId);
			client.emit('match:inviteSent', { inviteId: invite.id, friendId });
			this.server.to(this.userRoom(friendId)).emit('match:inviteReceived', {
				inviteId: invite.id,
				inviterId,
				inviterUsername: inviter.username,
				createdAt: invite.createdAt,
			});
		} catch (err) {
			const message =
				err instanceof BadRequestException
					? err.message
					: err instanceof Error && err.message
						? err.message
						: 'Invite failed';
			client.emit('match:inviteError', { message });
		}
	}

	@SubscribeMessage('acceptInvite')
	async handleAcceptInvite(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: { inviteId: string },
	) {
		const inviteeId = Number(client.data.userId);
		const inviteId = String(data?.inviteId ?? '');
		if (!inviteeId) return client.disconnect();
		if (!inviteId) {
			client.emit('match:inviteError', { message: 'Invalid invite id' });
			return;
		}

		try {
			const { game, inviterId } = await this.matchmakingService.acceptInvite(inviteeId, inviteId);
			this.server.to(this.userRoom(inviterId)).emit('matched', { gameId: game.id });
			this.server.to(this.userRoom(inviteeId)).emit('matched', { gameId: game.id });
		} catch (err) {
			const message = err instanceof Error && err.message ? err.message : 'Accept failed';
			client.emit('match:inviteError', { message });
		}
	}

	@SubscribeMessage('rejectInvite')
	async handleRejectInvite(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: { inviteId: string },
	) {
		const inviteeId = Number(client.data.userId);
		const inviteId = String(data?.inviteId ?? '');
		if (!inviteeId) return client.disconnect();
		if (!inviteId) {
			client.emit('match:inviteError', { message: 'Invalid invite id' });
			return;
		}

		try {
			const { inviterId } = await this.matchmakingService.rejectInvite(inviteeId, inviteId);
			this.server.to(this.userRoom(inviterId)).emit('match:inviteDeclined', { inviteId, inviteeId });
			client.emit('match:inviteDeclinedAck', { inviteId });
		} catch (err) {
			const message = err instanceof Error && err.message ? err.message : 'Reject failed';
			client.emit('match:inviteError', { message });
		}
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
