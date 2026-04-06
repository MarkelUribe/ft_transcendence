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
const users_service_1 = require("../users/users.service");
let MatchmakingService = class MatchmakingService {
    gameService;
    usersService;
    queue = [];
    constructor(gameService, usersService) {
        this.gameService = gameService;
        this.usersService = usersService;
    }
    async joinQueue(playerId) {
        if (this.queue.some(p => p.id === playerId))
            throw new common_1.BadRequestException('Already in queue');
        const player = await this.usersService.findOne(Number(playerId));
        if (!player)
            throw new common_1.NotFoundException('User not found');
        const joinedAt = Date.now();
        const newPlayer = {
            id: playerId,
            elo: player.elo,
            joinedAt
        };
        this.queue.push(newPlayer);
        while (this.queue.some(p => p.id === playerId)) {
            for (let i = 0; i < this.queue.length; i++) {
                const opponent = this.queue[i];
                if (opponent.id === playerId)
                    continue;
                const waitingTime = (Date.now() - joinedAt) / 1000;
                const range = waitingTime * 10;
                const eloDiff = Math.abs(opponent.elo - newPlayer.elo);
                if (eloDiff <= range && eloDiff <= 400) {
                    this.queue = this.queue.filter(p => p.id !== playerId && p.id !== opponent.id);
                    return await this.gameService.createGame(newPlayer.id, opponent.id);
                }
            }
            await new Promise(res => setTimeout(res, 1000));
        }
        return null;
    }
    leaveQueue(playerId) { this.queue = this.queue.filter(p => p.id !== playerId); }
    checkStatus(playerId) {
        if (this.queue.some(p => p.id === playerId))
            return { status: 'waiting' };
        return { status: 'matched' };
    }
};
exports.MatchmakingService = MatchmakingService;
exports.MatchmakingService = MatchmakingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [game_service_1.GameService,
        users_service_1.UsersService])
], MatchmakingService);
//# sourceMappingURL=matchmaking.service.js.map