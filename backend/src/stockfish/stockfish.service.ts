import { Injectable, Logger } from '@nestjs/common';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { EventEmitter } from 'events';

type EngineInstance = {
  proc: ChildProcessWithoutNullStreams;
  emitter: EventEmitter;
  ready: boolean;
};

@Injectable()
export class StockfishService {
  private readonly logger = new Logger(StockfishService.name);
  private engines = new Map<string, EngineInstance>(); // gameId -> engine

  // call with unique gameId and path to stockfish executable (or default)
  createEngine(gameId: string, executable = 'stockfish'): EngineInstance {
    if (this.engines.has(gameId)) return this.engines.get(gameId)!;

    const proc = spawn(executable, [], { stdio: ['pipe', 'pipe', 'pipe'] });
    const emitter = new EventEmitter();
    const inst: EngineInstance = { proc, emitter, ready: false };

    proc.stdout.setEncoding('utf8');
    proc.stdout.on('data', (data: string) => {
      data.split('\n').forEach(line => {
        if (!line) return;
        // emit raw lines; consumer can look for "bestmove" etc
        emitter.emit('line', line.trim());
        if (line.startsWith('uciok') || line.startsWith('readyok')) inst.ready = true;
      });
    });

    // initialize UCI
    proc.stdin.write('uci\n');
    proc.stdin.write('isready\n');

    this.engines.set(gameId, inst);
    this.logger.log(`Stockfish engine started for ${gameId}`);
    return inst;
  }

  sendCommand(gameId: string, cmd: string) {
    const inst = this.engines.get(gameId);
    if (!inst) throw new Error('Engine not found');
    inst.proc.stdin.write(cmd + '\n');
  }

  async getBestMove(gameId: string, fen: string, moves?: string[], movetime = 200) : Promise<string|null> {
    const inst = this.engineOrThrow(gameId);
    // set position
    const movesPart = moves && moves.length ? ' moves ' + moves.join(' ') : '';
    inst.proc.stdin.write(`position fen ${fen}${movesPart}\n`);
    inst.proc.stdin.write(`go movetime ${movetime}\n`);
    return await new Promise((resolve) => {
      const onLine = (line: string) => {
        if (line.startsWith('bestmove')) {
          const parts = line.split(' ');
          const best = parts[1] || null;
          inst.emitter.removeListener('line', onLine);
          resolve(best);
        }
      };
      inst.emitter.on('line', onLine);
    });
  }

  stopEngine(gameId: string) {
    const inst = this.engines.get(gameId);
    if (!inst) return;
    try { inst.proc.kill(); } catch {}
    this.engines.delete(gameId);
  }

  private engineOrThrow(gameId: string) {
    const inst = this.engines.get(gameId);
    if (!inst) throw new Error('Engine not found');
    return inst;
  }
}