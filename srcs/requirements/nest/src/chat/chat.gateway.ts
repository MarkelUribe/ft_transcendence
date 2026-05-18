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
import { ChatService } from './chat.service';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
export class ChatGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) { }

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token) return client.disconnect();

    try {
      const payload = this.jwtService.verify(token);
      const userId = Number(payload.sub);
      if (!Number.isFinite(userId)) return client.disconnect();

      client.data.userId = userId;

      // THIS is what makes your FriendsGateway room-emits work:
      client.join(`user:${userId}`);
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { recipientId: number; content: string },
  ) {
    const senderId = client.data.userId;

    if (!senderId) {
      return { success: false, error: 'Unauthorized' };
    }

    const areFriends = await this.chatService.areFriends(senderId, data.recipientId);
    if (!areFriends) {
      return { success: false, error: 'You can only chat with friends' };
    }

    const message = await this.chatService.saveMessage(
      senderId,
      data.recipientId,
      data.content,
    );

    const recipientSocket = this.findSocketByPlayerId(data.recipientId);
    if (recipientSocket) {
      recipientSocket.emit('newMessage', {
        id: message.id,
        senderId,
        content: message.content,
        createdAt: message.createdAt,
      });
    }

    client.emit('messageSent', {
      id: message.id,
      recipientId: data.recipientId,
      createdAt: message.createdAt,
      content: message.content,
    });

    return { success: true, messageId: message.id };
  }

  @SubscribeMessage('getConversation')
  async handleGetConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { friendId: number; limit?: number; beforeId?: number },
  ) {
    const userId = client.data.userId;

    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const areFriends = await this.chatService.areFriends(userId, data.friendId);
    if (!areFriends) {
      return { success: false, error: 'You can only chat with friends' };
    }

    const messages = await this.chatService.getConversation(
      userId,
      data.friendId,
      data.limit || 50,
      data.beforeId,
    );

    return { success: true, messages };
  }

  @SubscribeMessage('markRead')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: number },
  ) {
    const userId = client.data.userId;

    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    await this.chatService.markAsRead(data.messageId, userId);
    return { success: true };
  }

  handleDisconnect(client: Socket) { }

  findSocketByPlayerId(playerId: number): Socket | undefined {
    const socketsMap = this.server?.sockets?.sockets || (this.server?.sockets as any);

    if (!socketsMap || typeof socketsMap.values !== 'function') {
      return undefined;
    }

    for (const socket of socketsMap.values()) {
      if (socket.data?.userId == playerId) {
        return socket;
      }
    }
    return undefined;
  }
}