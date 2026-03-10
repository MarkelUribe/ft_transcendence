import { GameService } from '../game/game.service';
export declare class MatchmakingService {
    private readonly gameService;
    private queue;
    constructor(gameService: GameService);
    joinQueue(playerId: string): Promise<import("../game/entities/game.entity").Game | null>;
    leaveQueue(playerId: string): void;
    checkStatus(playerId: string): {
        status: string;
    };
}
