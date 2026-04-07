import { ChildProcessWithoutNullStreams } from 'child_process';
import { EventEmitter } from 'events';
type EngineInstance = {
    proc: ChildProcessWithoutNullStreams;
    emitter: EventEmitter;
    ready: boolean;
};
export declare class StockfishService {
    private readonly logger;
    private engines;
    createEngine(gameId: string, executable?: string): EngineInstance;
    sendCommand(gameId: string, cmd: string): void;
    getBestMove(gameId: string, fen: string, moves?: string[], movetime?: number): Promise<string | null>;
    stopEngine(gameId: string): void;
    private engineOrThrow;
}
export {};
