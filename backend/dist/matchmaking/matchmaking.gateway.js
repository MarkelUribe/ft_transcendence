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
exports.MatchmakingGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const jwt_1 = require("@nestjs/jwt");
const socket_io_1 = require("socket.io");
const matchmaking_service_1 = require("../matchmaking/matchmaking.service");
let MatchmakingGateway = class MatchmakingGateway {
    matchmakingService;
    jwtService;
    server;
    constructor(matchmakingService, jwtService) {
        this.matchmakingService = matchmakingService;
        this.jwtService = jwtService;
    }
    handleConnection(client) {
        const token = client.handshake.auth?.token;
        if (!token)
            return client.disconnect();
        try {
            const payload = this.jwtService.verify(token);
            client.data.userId = payload.sub;
        }
        catch {
            client.disconnect();
        }
    }
    async handleJoinQueue(client) {
        const playerId = client.data.userId;
        console.log('--- joinQueue called ---');
        console.log('socket.id:', client.id);
        console.log('playerId from socket:', playerId);
        if (!playerId) {
            console.log('No playerId, disconnecting socket');
            return client.disconnect();
        }
        const game = await this.matchmakingService.joinQueue(playerId);
        console.log('game returned from matchmaking:', game);
        if (!game) {
            console.log('No match yet, emitting waiting');
            return client.emit('waiting');
        }
        console.log('white player id:', game.white?.id);
        console.log('black player id:', game.black?.id);
        const opponentId = game.white?.id === playerId
            ? game.black?.id
            : game.white?.id;
        console.log('calculated opponentId:', opponentId);
        const opponentSocket = this.findSocketByPlayerId(opponentId);
        console.log('opponent socket found:', opponentSocket ? opponentSocket.id : 'NONE');
        if (!opponentSocket) {
            console.log('Opponent socket not found, emitting waiting');
            return client.emit('waiting');
        }
        console.log('Emitting matched to both players. Game ID:', game.id);
        opponentSocket.emit('matched', { gameId: game.id });
        client.emit('matched', { gameId: game.id });
    }
    handleLeaveQueue(client) {
        const playerId = client.data.userId;
        if (playerId)
            this.matchmakingService.leaveQueue(playerId);
    }
    handleDisconnect(client) {
        const playerId = client.data.userId;
        if (playerId)
            this.matchmakingService.leaveQueue(playerId);
    }
    findSocketByPlayerId(playerId) {
        for (const socket of this.server.sockets.sockets.values()) {
            if (socket.data.userId === playerId) {
                return socket;
            }
        }
        return undefined;
    }
};
exports.MatchmakingGateway = MatchmakingGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], MatchmakingGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinQueue'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], MatchmakingGateway.prototype, "handleJoinQueue", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveQueue'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], MatchmakingGateway.prototype, "handleLeaveQueue", null);
exports.MatchmakingGateway = MatchmakingGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({ cors: { origin: '*' } }),
    __metadata("design:paramtypes", [matchmaking_service_1.MatchmakingService,
        jwt_1.JwtService])
], MatchmakingGateway);
//# sourceMappingURL=matchmaking.gateway.js.map