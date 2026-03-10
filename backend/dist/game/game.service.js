"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameService = void 0;
const common_1 = require("@nestjs/common");
const chess_js_1 = require("chess.js");
const crypto_1 = require("crypto");
let GameService = class GameService {
    games = new Map();
    createGame(white, black) {
        const chess = new chess_js_1.Chess();
        const game = {
            id: (0, crypto_1.randomUUID)(),
            fen: chess.fen(),
            status: 'active',
            players: { white, black },
        };
        this.games.set(game.id, game);
        return game;
    }
    findOne(id) {
        const game = this.games.get(id);
        if (!game) {
            throw new common_1.NotFoundException('Game not found');
        }
        return game;
    }
    findByPlayer(playerId) {
        for (const game of this.games.values()) {
            if (game.players.white === playerId || game.players.black === playerId) {
                return { gameId: game.id, fen: game.fen };
            }
        }
        return null;
    }
    makeMove(id, from, to) {
        const game = this.findOne(id);
        const chess = new chess_js_1.Chess(game.fen);
        const move = chess.move({ from, to });
        if (!move) {
            throw new common_1.BadRequestException('Invalid move');
        }
        game.fen = chess.fen();
        if (chess.isCheckmate()) {
            game.status = 'checkmate';
        }
        else if (chess.isDraw()) {
            game.status = 'draw';
        }
        return game;
    }
};
exports.GameService = GameService;
exports.GameService = GameService = __decorate([
    (0, common_1.Injectable)()
], GameService);
//# sourceMappingURL=game.service.js.map