import { OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MatchmakingService } from '../matchmaking/matchmaking.service';
export declare class MatchmakingGateway implements OnGatewayDisconnect {
    private readonly matchmakingService;
    server: Server;
    constructor(matchmakingService: MatchmakingService);
    handleJoinQueue(client: Socket, data: {
        playerId: string;
    }): boolean | undefined;
    handleLeaveQueue(client: Socket): void;
    handleDisconnect(client: Socket): void;
    private findSocketByPlayerId;
}
