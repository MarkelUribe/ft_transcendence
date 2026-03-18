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
exports.FriendsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
let FriendsGateway = class FriendsGateway {
    server;
    handleRegister(client, data) {
        if (!data || !data.userId)
            return;
        const room = this.getUserRoom(data.userId);
        client.join(room);
    }
    notifyUsers(userIds) {
        if (!this.server || !Array.isArray(userIds))
            return;
        for (const id of userIds) {
            if (!id)
                continue;
            const room = this.getUserRoom(id);
            this.server.to(room).emit('friendsUpdated');
        }
    }
    handleFriendInvite(client, data) {
        const { fromUserId, toUserId, fromUsername } = data || {};
        if (!fromUserId || !toUserId)
            return;
        const targetRoom = this.getUserRoom(toUserId);
        this.server.to(targetRoom).emit('friendInvite', {
            fromUserId,
            fromUsername,
        });
    }
    handleFriendInviteAccepted(client, data) {
        const { inviterId, inviteeId, gameId } = data || {};
        if (!inviterId || !gameId)
            return;
        const inviterRoom = this.getUserRoom(inviterId);
        this.server.to(inviterRoom).emit('friendInviteAccepted', {
            gameId,
            inviteeId,
        });
    }
    getUserRoom(userId) {
        return `user_${userId}`;
    }
};
exports.FriendsGateway = FriendsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], FriendsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('friends_register'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], FriendsGateway.prototype, "handleRegister", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('friend_invite'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], FriendsGateway.prototype, "handleFriendInvite", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('friend_invite_accepted'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], FriendsGateway.prototype, "handleFriendInviteAccepted", null);
exports.FriendsGateway = FriendsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({ cors: { origin: '*' } })
], FriendsGateway);
//# sourceMappingURL=friends.gateway.js.map