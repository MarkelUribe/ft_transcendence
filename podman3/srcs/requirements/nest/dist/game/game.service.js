"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameService = void 0;
const common_1 = require("@nestjs/common");
const chess_js_1 = require("chess.js");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const game_entity_1 = require("./entities/game.entity");
const user_entity_1 = require("../users/user.entity");
let GameService = class GameService {
    gameRepo;
    userRepo;
    constructor(gameRepo, userRepo) {
        this.gameRepo = gameRepo;
        this.userRepo = userRepo;
    }
    async createGame(whiteId, blackId) {
        const player1 = await this.userRepo.findOneBy({ id: Number(whiteId) });
        const player2 = await this.userRepo.findOneBy({ id: Number(blackId) });
        if (!player1 || !player2) {
            throw new common_1.NotFoundException('User not found');
        }
        const chess = new chess_js_1.Chess();
        const isSwap = Math.random() < 0.5;
        const white = isSwap ? player2 : player1;
        const black = isSwap ? player1 : player2;
        const game = this.gameRepo.create({
            fen: chess.fen(),
            white,
            black,
            status: 'active',
            looser: -1
        });
        return this.gameRepo.save(game);
    }
    async findOne(id) {
        const game = await this.gameRepo.findOne({ where: { id } });
        if (!game)
            throw new common_1.NotFoundException('Game not found');
        return game;
    }
    async findByPlayer(playerId) {
        const idNum = playerId;
        const game = await this.gameRepo
            .createQueryBuilder('game')
            .leftJoinAndSelect('game.white', 'white')
            .leftJoinAndSelect('game.black', 'black')
            .where('white.id = :id OR black.id = :id', { id: idNum })
            .getOne();
        if (!game)
            return null;
        return { gameId: game.id, fen: game.fen };
    }
    async deleteGame(id) { await this.gameRepo.delete(id); }
    async eloGivingLogic(game, winner) {
        const K = 32;
        const whiteElo = game.white.elo;
        const blackElo = game.black.elo;
        const expectedWhite = 1 / (1 + Math.pow(10, (blackElo - whiteElo) / 400));
        const expectedBlack = 1 / (1 + Math.pow(10, (whiteElo - blackElo) / 400));
        let scoreWhite = 0.5;
        let scoreBlack = 0.5;
        game.looser = -1;
        if (winner === 'w') {
            scoreWhite = 1;
            scoreBlack = 0;
            game.looser = game.black.id;
        }
        else if (winner === 'b') {
            scoreWhite = 0;
            scoreBlack = 1;
            game.looser = game.white.id;
        }
        game.status = 'ended';
        game.white.elo = Math.max(0, Math.round(whiteElo + K * (scoreWhite - expectedWhite)));
        game.black.elo = Math.max(0, Math.round(blackElo + K * (scoreBlack - expectedBlack)));
        await this.userRepo.save(game.white);
        await this.userRepo.save(game.black);
    }
    async makeMove(id, from, to, userId, promotion) {
        const game = await this.findOne(id);
        let turnId = '';
        if (game.white.id === userId)
            turnId = 'w';
        if (game.black.id === userId)
            turnId = 'b';
        const turn = game.fen.split(' ')[1];
        if (turn !== turnId)
            throw new common_1.BadRequestException("Bro dont cheat");
        const chess = new chess_js_1.Chess(game.fen);
        const move = chess.move({ from, to, promotion });
        if (!move)
            throw new common_1.BadRequestException('Invalid move');
        game.fen = chess.fen();
        if (chess.isCheckmate()) {
            this.eloGivingLogic(game, turnId);
        }
        else if (chess.isDraw()) {
            this.eloGivingLogic(game, 'd');
        }
        return this.gameRepo.save(game);
    }
    async surrender(id, userId) {
        const game = await this.findOne(id);
        let winner = '';
        if (game.white.id === userId)
            winner = 'b';
        if (game.black.id === userId)
            winner = 'w';
        this.eloGivingLogic(game, winner);
        return this.gameRepo.save(game);
    }
};
exports.GameService = GameService;
exports.GameService = GameService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(game_entity_1.Game)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], GameService);
//# sourceMappingURL=game.service.js.map