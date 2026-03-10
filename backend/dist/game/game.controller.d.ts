import { GameService } from './game.service';
export declare class GameController {
    private readonly gameService;
    constructor(gameService: GameService);
    findOne(id: string): Promise<import("./entities/game.entity").Game>;
    getGameByPlayer(playerId: string): Promise<{
        gameId: string;
        fen: string;
    } | null>;
    createGame(body: {
        whiteId: string;
        blackId: string;
    }): Promise<import("./entities/game.entity").Game>;
    deleteGame(id: string): Promise<void>;
}
