import { OnGatewayDisconnect } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { MatchmakingService } from '../matchmaking/matchmaking.service';
export declare class MatchmakingGateway implements OnGatewayDisconnect {
    private readonly matchmakingService;
    private readonly jwtService;
    server: Server;
    constructor(matchmakingService: MatchmakingService, jwtService: JwtService);
    handleConnection(client: Socket): Socket<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any> | undefined;
    handleJoinQueue(client: Socket): Promise<boolean | Socket<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any> | undefined>;
    handleLeaveQueue(client: Socket): void;
    handleDisconnect(client: Socket): void;
    findSocketByPlayerId(playerId: number): Socket | undefined;
}
