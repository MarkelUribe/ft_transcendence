import { GameService } from '../game/game.service';
import { UsersService } from '../users/users.service';
export declare class MatchmakingService {
    private readonly gameService;
    private readonly usersService;
    private queue;
    constructor(gameService: GameService, usersService: UsersService);
    joinQueue(playerId: string): Promise<import("../game/entities/game.entity").Game | null>;
    leaveQueue(playerId: string): void;
    checkStatus(playerId: string): {
        status: string;
    };
}
