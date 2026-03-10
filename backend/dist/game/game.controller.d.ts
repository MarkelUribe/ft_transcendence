import { GameService } from './game.service';
export declare class GameController {
    private readonly gameService;
    constructor(gameService: GameService);
    findOne(id: string): import("./entities/game.entity").Game;
    getGameByPlayer(playerId: string): {
        gameId: string;
        fen: string;
    } | null;
    makeMove(gameId: string, dto: {
        from: string;
        to: string;
    }): import("./entities/game.entity").Game;
}
