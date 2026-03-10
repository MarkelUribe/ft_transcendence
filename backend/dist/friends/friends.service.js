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
exports.FriendsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const friendship_entity_1 = require("./friendship.entity");
const user_entity_1 = require("../users/user.entity");
let FriendsService = class FriendsService {
    friendshipRepository;
    usersRepository;
    constructor(friendshipRepository, usersRepository) {
        this.friendshipRepository = friendshipRepository;
        this.usersRepository = usersRepository;
    }
    async sendFriendRequest(requesterId, targetUserId) {
        if (requesterId === targetUserId) {
            throw new common_1.BadRequestException('You cannot add yourself as a friend.');
        }
        const requester = await this.usersRepository.findOneBy({ id: requesterId });
        if (!requester) {
            throw new common_1.NotFoundException('Requester not found');
        }
        const addressee = await this.usersRepository.findOneBy({ id: targetUserId });
        if (!addressee) {
            throw new common_1.NotFoundException('Target user not found');
        }
        const existing = await this.friendshipRepository.findOne({
            where: [
                { requester: { id: requesterId }, addressee: { id: targetUserId } },
                { requester: { id: targetUserId }, addressee: { id: requesterId } },
            ],
            relations: ['requester', 'addressee'],
        });
        if (existing) {
            if (existing.status === friendship_entity_1.FriendshipStatus.PENDING) {
                throw new common_1.BadRequestException('Friend request already pending.');
            }
            if (existing.status === friendship_entity_1.FriendshipStatus.ACCEPTED) {
                throw new common_1.BadRequestException('You are already friends.');
            }
        }
        const friendship = this.friendshipRepository.create({
            requester,
            addressee,
            status: friendship_entity_1.FriendshipStatus.PENDING,
        });
        return this.friendshipRepository.save(friendship);
    }
    async acceptFriendRequest(friendshipId, userId) {
        const friendship = await this.friendshipRepository.findOne({
            where: { id: friendshipId },
            relations: ['requester', 'addressee'],
        });
        if (!friendship) {
            throw new common_1.NotFoundException('Friend request not found');
        }
        if (friendship.addressee.id !== userId) {
            throw new common_1.ForbiddenException('You cannot accept this request.');
        }
        if (friendship.status !== friendship_entity_1.FriendshipStatus.PENDING) {
            throw new common_1.BadRequestException('This request is not pending.');
        }
        friendship.status = friendship_entity_1.FriendshipStatus.ACCEPTED;
        return this.friendshipRepository.save(friendship);
    }
    async rejectFriendRequest(friendshipId, userId) {
        const friendship = await this.friendshipRepository.findOne({
            where: { id: friendshipId },
            relations: ['addressee'],
        });
        if (!friendship) {
            throw new common_1.NotFoundException('Friend request not found');
        }
        if (friendship.addressee.id !== userId) {
            throw new common_1.ForbiddenException('You cannot reject this request.');
        }
        await this.friendshipRepository.remove(friendship);
    }
    async getFriendsForUser(userId) {
        const friendships = await this.friendshipRepository.find({
            where: [
                { requester: { id: userId }, status: friendship_entity_1.FriendshipStatus.ACCEPTED },
                { addressee: { id: userId }, status: friendship_entity_1.FriendshipStatus.ACCEPTED },
            ],
            relations: ['requester', 'addressee'],
        });
        return friendships.map((f) => f.requester.id === userId ? f.addressee : f.requester);
    }
    async getPendingRequestsForUser(userId) {
        const [incoming, outgoing] = await Promise.all([
            this.friendshipRepository.find({
                where: { addressee: { id: userId }, status: friendship_entity_1.FriendshipStatus.PENDING },
                relations: ['requester', 'addressee'],
            }),
            this.friendshipRepository.find({
                where: { requester: { id: userId }, status: friendship_entity_1.FriendshipStatus.PENDING },
                relations: ['requester', 'addressee'],
            }),
        ]);
        return { incoming, outgoing };
    }
};
exports.FriendsService = FriendsService;
exports.FriendsService = FriendsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(friendship_entity_1.Friendship)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], FriendsService);
//# sourceMappingURL=friends.service.js.map