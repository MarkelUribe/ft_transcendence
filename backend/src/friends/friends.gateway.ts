import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class FriendsGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('friends_register')
  handleRegister(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId?: number } | undefined,
  ): void {
    if (!data || !data.userId) return;
    const room = this.getUserRoom(data.userId);
    client.join(room);
  }

  notifyUsers(userIds: number[]): void {
    if (!this.server || !Array.isArray(userIds)) return;
    for (const id of userIds) {
      if (!id) continue;
      const room = this.getUserRoom(id);
      this.server.to(room).emit('friendsUpdated');
    }
  }

  @SubscribeMessage('friend_invite')
  handleFriendInvite(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { fromUserId?: number; toUserId?: number; fromUsername?: string },
  ): void {
    const { fromUserId, toUserId, fromUsername } = data || {};
    if (!fromUserId || !toUserId) return;

    const targetRoom = this.getUserRoom(toUserId);
    this.server.to(targetRoom).emit('friendInvite', {
      fromUserId,
      fromUsername,
    });
  }

  @SubscribeMessage('friend_invite_accepted')
  handleFriendInviteAccepted(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { inviterId?: number; inviteeId?: number; gameId?: string },
  ): void {
    const { inviterId, inviteeId, gameId } = data || {};
    if (!inviterId || !gameId) return;

    const inviterRoom = this.getUserRoom(inviterId);
    this.server.to(inviterRoom).emit('friendInviteAccepted', {
      gameId,
      inviteeId,
    });
  }

  private getUserRoom(userId: number): string {
    return `user_${userId}`;
  }
}
