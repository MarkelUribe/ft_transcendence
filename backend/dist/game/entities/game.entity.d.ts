import { User } from '../../users/user.entity';
export declare class Game {
    id: string;
    fen: string;
    white: User;
    black: User;
    status: 'active' | 'checkmate' | 'draw';
    createdAt: Date;
    updatedAt: Date;
}
