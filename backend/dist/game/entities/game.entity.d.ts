export declare class Game {
    id: string;
    fen: string;
    players: {
        white: string;
        black: string;
    };
    status: 'active' | 'checkmate' | 'draw';
}
