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
exports.MatchmakingController = void 0;
const common_1 = require("@nestjs/common");
const matchmaking_service_1 = require("../matchmaking/matchmaking.service");
let MatchmakingController = class MatchmakingController {
    matchmakingService;
    constructor(matchmakingService) {
        this.matchmakingService = matchmakingService;
    }
    joinQueue(playerId) {
        return this.matchmakingService.joinQueue(playerId);
    }
    leaveQueue(playerId) {
        return this.matchmakingService.leaveQueue(playerId);
    }
    checkStatus(playerId) {
        return this.matchmakingService.checkStatus(playerId);
    }
};
exports.MatchmakingController = MatchmakingController;
__decorate([
    (0, common_1.Post)('join'),
    __param(0, (0, common_1.Body)('playerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MatchmakingController.prototype, "joinQueue", null);
__decorate([
    (0, common_1.Post)('leave'),
    __param(0, (0, common_1.Body)('playerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MatchmakingController.prototype, "leaveQueue", null);
__decorate([
    (0, common_1.Get)('status/:playerId'),
    __param(0, (0, common_1.Param)('playerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MatchmakingController.prototype, "checkStatus", null);
exports.MatchmakingController = MatchmakingController = __decorate([
    (0, common_1.Controller)('matchmaking'),
    __metadata("design:paramtypes", [matchmaking_service_1.MatchmakingService])
], MatchmakingController);
//# sourceMappingURL=matchmaking.controller.js.map