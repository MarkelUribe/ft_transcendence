import { MatchmakingService } from '../matchmaking/matchmaking.service';
export declare class MatchmakingController {
    private readonly matchmakingService;
    constructor(matchmakingService: MatchmakingService);
    joinQueue(playerId: string): import("../game/entities/game.entity").Game | null;
    leaveQueue(playerId: string): void;
    checkStatus(playerId: string): {
        status: string;
    };
}
