import { GameService } from './game.service';
export declare class GameController {
    private readonly gameService;
    constructor(gameService: GameService);
    getMyGame(req: any): Promise<{
        gameId: string;
        fen: string;
    } | null>;
    findOne(id: string): Promise<import("./entities/game.entity").Game>;
    createGame(body: {
        whiteId: string;
        blackId: string;
    }): Promise<import("./entities/game.entity").Game>;
    deleteGame(id: string): Promise<void>;
}
