import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { Repository } from 'typeorm';
import { Game } from './entities/game.entity';
export declare class GameGateway {
    private readonly gameService;
    private readonly gameRepo;
    server: Server;
    constructor(gameService: GameService, gameRepo: Repository<Game>);
    handleJoinGame(client: Socket, data: {
        gameId: string;
        playerId?: string;
    }): Promise<void>;
    handleProposeMove(client: Socket, data: {
        gameId: string;
        from: string;
        to: string;
    }): Promise<void>;
    handleSurrender(client: Socket, data: {
        gameId: string;
    }): Promise<void>;
}
