import { OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { Repository } from 'typeorm';
import { Game } from './entities/game.entity';
import { JwtService } from '@nestjs/jwt';
export declare class GameGateway implements OnGatewayConnection {
    private readonly gameService;
    private readonly jwtService;
    private readonly gameRepo;
    server: Server;
    constructor(gameService: GameService, jwtService: JwtService, gameRepo: Repository<Game>);
    handleConnection(client: Socket): Promise<void>;
    handleJoinGame(client: Socket, data: {
        gameId: string;
    }): Promise<void>;
    handleProposeMove(client: Socket, data: {
        gameId: string;
        from: string;
        to: string;
        promotion?: string;
    }): Promise<void>;
    handleSurrender(client: Socket, data: {
        gameId: string;
    }): Promise<void>;
}
