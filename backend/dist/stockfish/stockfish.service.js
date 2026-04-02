"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var StockfishService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockfishService = void 0;
const common_1 = require("@nestjs/common");
const child_process_1 = require("child_process");
const events_1 = require("events");
let StockfishService = StockfishService_1 = class StockfishService {
    logger = new common_1.Logger(StockfishService_1.name);
    engines = new Map();
    createEngine(gameId, executable = 'stockfish') {
        if (this.engines.has(gameId))
            return this.engines.get(gameId);
        const proc = (0, child_process_1.spawn)(executable, [], { stdio: ['pipe', 'pipe', 'pipe'] });
        const emitter = new events_1.EventEmitter();
        const inst = { proc, emitter, ready: false };
        proc.stdout.setEncoding('utf8');
        proc.stdout.on('data', (data) => {
            data.split('\n').forEach(line => {
                if (!line)
                    return;
                emitter.emit('line', line.trim());
                if (line.startsWith('uciok') || line.startsWith('readyok'))
                    inst.ready = true;
            });
        });
        proc.stdin.write('uci\n');
        proc.stdin.write('isready\n');
        this.engines.set(gameId, inst);
        this.logger.log(`Stockfish engine started for ${gameId}`);
        return inst;
    }
    sendCommand(gameId, cmd) {
        const inst = this.engines.get(gameId);
        if (!inst)
            throw new Error('Engine not found');
        inst.proc.stdin.write(cmd + '\n');
    }
    async getBestMove(gameId, fen, moves, movetime = 200) {
        const inst = this.engineOrThrow(gameId);
        const movesPart = moves && moves.length ? ' moves ' + moves.join(' ') : '';
        inst.proc.stdin.write(`position fen ${fen}${movesPart}\n`);
        inst.proc.stdin.write(`go movetime ${movetime}\n`);
        return await new Promise((resolve) => {
            const onLine = (line) => {
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
    stopEngine(gameId) {
        const inst = this.engines.get(gameId);
        if (!inst)
            return;
        try {
            inst.proc.kill();
        }
        catch { }
        this.engines.delete(gameId);
    }
    engineOrThrow(gameId) {
        const inst = this.engines.get(gameId);
        if (!inst)
            throw new Error('Engine not found');
        return inst;
    }
};
exports.StockfishService = StockfishService;
exports.StockfishService = StockfishService = StockfishService_1 = __decorate([
    (0, common_1.Injectable)()
], StockfishService);
//# sourceMappingURL=stockfish.service.js.map