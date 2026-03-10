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
        const white = await this.userRepo.findOneBy({ id: Number(whiteId) });
        const black = await this.userRepo.findOneBy({ id: Number(blackId) });
        if (!white || !black) {
            throw new common_1.NotFoundException('User not found');
        }
        const chess = new chess_js_1.Chess();
        const game = this.gameRepo.create({
            fen: chess.fen(),
            white,
            black,
            status: 'active',
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
        const idNum = Number(playerId);
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
    async makeMove(id, from, to) {
        const game = await this.findOne(id);
        const chess = new chess_js_1.Chess(game.fen);
        console.log('Move attempt - FEN:', game.fen, 'Turn:', chess.turn(), 'From:', from, 'To:', to);
        const move = chess.move({ from, to });
        console.log('Move result:', move);
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