import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Friendship, FriendshipStatus } from './friendship.entity';
import { User } from '../users/user.entity';

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async sendFriendRequest(requesterId: number, targetUserId: number) {
    if (requesterId === targetUserId) {
      throw new BadRequestException('You cannot add yourself as a friend.');
    }

    const requester = await this.usersRepository.findOneBy({ id: requesterId });
    if (!requester) {
      throw new NotFoundException('Requester not found');
    }

    const addressee = await this.usersRepository.findOneBy({ id: targetUserId });
    if (!addressee) {
      throw new NotFoundException('Target user not found');
    }

    // Check if a friendship already exists in either direction
    const existing = await this.friendshipRepository.findOne({
      where: [
        { requester: { id: requesterId }, addressee: { id: targetUserId } },
        { requester: { id: targetUserId }, addressee: { id: requesterId } },
      ],
      relations: ['requester', 'addressee'],
    });

    if (existing) {
      if (existing.status === FriendshipStatus.PENDING) {
        throw new BadRequestException('Friend request already pending.');
      }
      if (existing.status === FriendshipStatus.ACCEPTED) {
        throw new BadRequestException('You are already friends.');
      }
    }

    // IMPORTANT: pass a single object to create(), not multiple args
    const friendship = this.friendshipRepository.create({
      requester,
      addressee,
      status: FriendshipStatus.PENDING,
    });

    // friendship is a single entity, so save() returns a single entity
    return this.friendshipRepository.save(friendship);
  }

  async acceptFriendRequest(friendshipId: number, userId: number) {
    const friendship = await this.friendshipRepository.findOne({
      where: { id: friendshipId },
      relations: ['requester', 'addressee'],
    });

    if (!friendship) {
      throw new NotFoundException('Friend request not found');
    }

    if (friendship.addressee.id !== userId) {
      throw new ForbiddenException('You cannot accept this request.');
    }

    if (friendship.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException('This request is not pending.');
    }

    friendship.status = FriendshipStatus.ACCEPTED;
    return this.friendshipRepository.save(friendship);
  }

  async rejectFriendRequest(friendshipId: number, userId: number) {
    const friendship = await this.friendshipRepository.findOne({
      where: { id: friendshipId },
      relations: ['addressee'],
    });

    if (!friendship) {
      throw new NotFoundException('Friend request not found');
    }

    if (friendship.addressee.id !== userId) {
      throw new ForbiddenException('You cannot reject this request.');
    }

    await this.friendshipRepository.remove(friendship);
  }

  async getFriendsForUser(userId: number) {
    const friendships = await this.friendshipRepository.find({
      where: [
        { requester: { id: userId }, status: FriendshipStatus.ACCEPTED },
        { addressee: { id: userId }, status: FriendshipStatus.ACCEPTED },
      ],
      relations: ['requester', 'addressee'],
    });

    // Map to actual friend users
    return friendships.map((f) =>
      f.requester.id === userId ? f.addressee : f.requester,
    );
  }

  async getPendingRequestsForUser(userId: number) {
    const [incoming, outgoing] = await Promise.all([
      this.friendshipRepository.find({
        where: { addressee: { id: userId }, status: FriendshipStatus.PENDING },
        relations: ['requester', 'addressee'],
      }),
      this.friendshipRepository.find({
        where: { requester: { id: userId }, status: FriendshipStatus.PENDING },
        relations: ['requester', 'addressee'],
      }),
    ]);

    return { incoming, outgoing };
  }
}
