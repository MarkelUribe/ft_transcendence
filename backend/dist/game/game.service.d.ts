import { Repository } from 'typeorm';
import { Game } from './entities/game.entity';
import { User } from '../users/user.entity';
export declare class GameService {
    private readonly gameRepo;
    private readonly userRepo;
    constructor(gameRepo: Repository<Game>, userRepo: Repository<User>);
    createGame(whiteId: string, blackId: string): Promise<Game>;
    findOne(id: string): Promise<Game>;
    findByPlayer(playerId: number): Promise<{
        gameId: string;
        fen: string;
    } | null>;
    deleteGame(id: string): Promise<void>;
    private eloGivingLogic;
    makeMove(id: string, from: string, to: string, userId: number, promotion?: string): Promise<Game>;
    surrender(id: string, userId: number): Promise<Game>;
}
