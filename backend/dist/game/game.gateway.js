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
exports.GameGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const game_service_1 = require("./game.service");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const game_entity_1 = require("./entities/game.entity");
const jwt_1 = require("@nestjs/jwt");
let GameGateway = class GameGateway {
    gameService;
    jwtService;
    gameRepo;
    server;
    constructor(gameService, jwtService, gameRepo) {
        this.gameService = gameService;
        this.jwtService = jwtService;
        this.gameRepo = gameRepo;
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token;
            if (!token) {
                client.disconnect();
                return;
            }
            const payload = this.jwtService.verify(token);
            client.data.userId = Number(payload.sub);
        }
        catch (err) {
            console.log('Socket rejected');
            client.disconnect();
        }
    }
    async handleJoinGame(client, data) {
        const { gameId } = data;
        client.join(gameId);
        try {
            const game = await this.gameService.findOne(gameId);
            client.emit('gameState', {
                gameId: game.id,
                fen: game.fen,
                white: game.white,
                black: game.black,
                status: game.status
            });
        }
        catch {
            client.emit('error', { message: 'Game not found' });
        }
    }
    async handleProposeMove(client, data) {
        const { gameId, from, to } = data;
        const userId = client.data.userId;
        if (!userId) {
            client.emit('moveRejected', { reason: 'Unauthorized' });
            return;
        }
        console.log('ProposeMove received:', { gameId, from, to, userId });
        try {
            const game = await this.gameService.makeMove(gameId, from, to, userId);
            this.server.to(gameId).emit('moveMade', {
                gameId: game.id,
                fen: game.fen,
                status: game.status,
                white: game.white,
                black: game.black
            });
            if (game.status === 'checkmate' || game.status === 'draw') {
                this.server.to(gameId).emit('gameEnded', { status: game, loser: userId });
                await this.gameService.deleteGame(gameId);
            }
        }
        catch (err) {
            const reason = err instanceof common_1.BadRequestException ? err.message : 'Invalid move';
            console.log('Move error:', reason);
            client.emit('moveRejected', { reason });
        }
    }
    async handleSurrender(client, data) {
        const { gameId } = data;
        try {
            const userId = client.data.userId;
            if (!userId) {
                client.emit('error', { message: 'Unauthorized' });
                return;
            }
            const game = await this.gameService.findOne(gameId);
            game.status = 'checkmate';
            await this.gameRepo.save(game);
            this.server.to(gameId).emit('gameEnded', {
                status: 'checkmate',
                loser: userId
            });
            await this.gameService.deleteGame(gameId);
        }
        catch {
            client.emit('error', { message: 'Surrender failed' });
        }
    }
};
exports.GameGateway = GameGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], GameGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinGame'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleJoinGame", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('proposeMove'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleProposeMove", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('surrender'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleSurrender", null);
exports.GameGateway = GameGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({ cors: { origin: '*' } }),
    __param(2, (0, typeorm_1.InjectRepository)(game_entity_1.Game)),
    __metadata("design:paramtypes", [game_service_1.GameService,
        jwt_1.JwtService,
        typeorm_2.Repository])
], GameGateway);
//# sourceMappingURL=game.gateway.js.map