import { Game } from './entities/game.entity';
export declare class GameService {
    private games;
    createGame(white: string, black: string): Game;
    findOne(id: string): Game;
    findByPlayer(playerId: string): {
        gameId: string;
        fen: string;
    } | null;
    makeMove(id: string, from: string, to: string): Game;
}
