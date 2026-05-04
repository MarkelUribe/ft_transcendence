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
import { FriendsGateway } from './friends.gateway';

@Injectable()
export class FriendsService {
  constructor(
	@InjectRepository(Friendship)
	private readonly friendshipRepository: Repository<Friendship>,
	@InjectRepository(User)
	private readonly usersRepository: Repository<User>,
	private readonly friendsGateway: FriendsGateway,
  ) { }

	async areFriends(userId: number, otherUserId: number): Promise<boolean> {
		if (userId === otherUserId) return false;
		const existing = await this.friendshipRepository.findOne({
			where: [
				{
					requester: { id: userId },
					addressee: { id: otherUserId },
					status: FriendshipStatus.ACCEPTED,
				},
				{
					requester: { id: otherUserId },
					addressee: { id: userId },
					status: FriendshipStatus.ACCEPTED,
				},
			],
		});
		return !!existing;
	}

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
	const saved = await this.friendshipRepository.save(friendship);
	this.friendsGateway.emitToUsers(
		[requesterId, targetUserId],
		'friends:requestChanged',
		{ requestId: saved.id },
	);
	return saved;
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
	const saved = await this.friendshipRepository.save(friendship);
	this.friendsGateway.emitToUsers(
		[friendship.requester.id, friendship.addressee.id],
		'friends:requestChanged',
		{ requestId: saved.id },
	);
	return saved;
  }

  async rejectFriendRequest(friendshipId: number, userId: number) {
	const friendship = await this.friendshipRepository.findOne({
	  where: { id: friendshipId },
	  relations: ['addressee', 'requester'],
	});

	if (!friendship) {
	  throw new NotFoundException('Friend request not found');
	}

	if (friendship.addressee.id !== userId) {
	  throw new ForbiddenException('You cannot reject this request.');
	}

	const requesterId = friendship.requester.id;
	const addresseeId = friendship.addressee.id;
	await this.friendshipRepository.remove(friendship);
	this.friendsGateway.emitToUsers(
		[requesterId, addresseeId],
		'friends:requestChanged',
		{ requestId: friendshipId },
	);
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

	async removeFriendship(userId: number, friendId: number) {
		if (userId === friendId) {
			throw new BadRequestException('You cannot remove yourself as a friend.');
		}

		const friendships = await this.friendshipRepository.find({
			where: [
				{ requester: { id: userId }, addressee: { id: friendId } },
				{ requester: { id: friendId }, addressee: { id: userId } },
			],
		});

		if (friendships.length === 0) {
			throw new NotFoundException('Friendship not found');
		}

		await this.friendshipRepository.remove(friendships);
		this.friendsGateway.emitToUsers(
			[userId, friendId],
			'friends:friendshipChanged',
			{},
		);
	}
}
