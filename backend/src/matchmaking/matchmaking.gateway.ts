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

@WebSocketGateway({
  cors: { origin: '*' },
})
export class MatchmakingGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly matchmakingService: MatchmakingService) {}

  // Player wants to join the queue
  @SubscribeMessage('joinQueue')
  handleJoinQueue(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { playerId: string },
  ) {
    const { playerId } = data;
    client.data.playerId = playerId;

    const game = this.matchmakingService.joinQueue(playerId);

    if (!game) return client.emit('waiting');

    const opponent = this.findSocketByPlayerId(game.players.white);

    if (!opponent) return client.emit('waiting'); // Critical error, should not happen

    opponent.emit('matched', { gameId: game.id });
    client.emit('matched', { gameId: game.id });
  }

  // Player wants to leave the queue manually
  @SubscribeMessage('leaveQueue')
  handleLeaveQueue(@ConnectedSocket() client: Socket) {
    const playerId = client.data.playerId;
    if (playerId) {
      this.matchmakingService.leaveQueue(playerId);
    }
  }

  // Handle disconnect (automatic leave)
  handleDisconnect(client: Socket) {
    const playerId = client.data.playerId;
    if (playerId) {
      this.matchmakingService.leaveQueue(playerId);
    }
  }

  private findSocketByPlayerId(playerId: string): Socket | undefined {
    return Array.from(this.server.sockets.sockets.values()).find(
      (socket) => socket.data.playerId === playerId,
    );
  }
}
