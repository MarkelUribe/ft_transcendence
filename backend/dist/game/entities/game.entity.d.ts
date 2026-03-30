import { User } from '../../users/user.entity';
export declare class Game {
    id: string;
    fen: string;
    white: User;
    black: User;
    status: 'active' | 'ended';
    createdAt: Date;
    updatedAt: Date;
    looser: number;
}
