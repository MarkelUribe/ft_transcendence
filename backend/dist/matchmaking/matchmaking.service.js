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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchmakingService = void 0;
const common_1 = require("@nestjs/common");
const game_service_1 = require("../game/game.service");
let MatchmakingService = class MatchmakingService {
    gameService;
    queue = [];
    constructor(gameService) {
        this.gameService = gameService;
    }
    joinQueue(playerId) {
        if (this.queue.includes(playerId)) {
            throw new common_1.BadRequestException('Already in queue');
        }
        if (this.queue.length > 0) {
            const opponentId = this.queue.shift();
            return this.gameService.createGame(opponentId, playerId);
        }
        this.queue.push(playerId);
        return null;
    }
    leaveQueue(playerId) {
        this.queue = this.queue.filter(id => id !== playerId);
    }
    checkStatus(playerId) {
        if (this.queue.includes(playerId)) {
            return { status: 'waiting' };
        }
        return { status: 'matched' };
    }
};
exports.MatchmakingService = MatchmakingService;
exports.MatchmakingService = MatchmakingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [game_service_1.GameService])
], MatchmakingService);
//# sourceMappingURL=matchmaking.service.js.map