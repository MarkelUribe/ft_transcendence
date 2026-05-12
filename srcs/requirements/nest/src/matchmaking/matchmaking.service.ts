import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { GameService } from '../game/game.service';
import { UsersService } from '../users/users.service'
import { FriendsService } from '../friends/friends.service';
import { randomUUID } from 'crypto';

type QueuePlayer = {
	id: string;
	elo: number;
	joinedAt: number;
};

type MatchInvite = {
	id: string;
	inviterId: number;
	inviteeId: number;
	createdAt: number;
	expiresAt: number;
};

@Injectable()
export class MatchmakingService
{
	private queue: QueuePlayer[] = [];
	private invites = new Map<string, MatchInvite>();
	private inviteTtlMs = 2 * 60 * 1000;

	constructor(
		private readonly gameService: GameService,
		private readonly usersService: UsersService,
		private readonly friendsService: FriendsService,
	) {}

	private cleanupExpiredInvites(now = Date.now()) {
		for (const [id, inv] of this.invites.entries()) {
			if (inv.expiresAt <= now) this.invites.delete(id);
		}
	}

	getPendingInvitesForUser(userId: number) {
		this.cleanupExpiredInvites();
		return [...this.invites.values()].filter((i) => i.inviteeId === userId);
	}

	async createInvite(inviterId: number, inviteeId: number) {
		this.cleanupExpiredInvites();
		if (!Number.isFinite(inviterId) || !Number.isFinite(inviteeId)) {
			throw new BadRequestException('Invalid user id');
		}
		if (inviterId === inviteeId) {
			throw new BadRequestException('You cannot invite yourself');
		}

		const [inviter, invitee] = await Promise.all([
			this.usersService.findOne(inviterId),
			this.usersService.findOne(inviteeId),
		]);
		if (!inviter || !invitee) throw new NotFoundException('User not found');

		const ok = await this.friendsService.areFriends(inviterId, inviteeId);
		if (!ok) throw new BadRequestException('You can only invite friends');

		const [inviterExisting, inviteeExisting] = await Promise.all([
			this.gameService.findByPlayer(inviterId),
			this.gameService.findByPlayer(inviteeId),
		]);
		if (inviterExisting?.gameId) throw new BadRequestException('You already have an active game');
		if (inviteeExisting?.gameId) throw new BadRequestException('Friend is already in a game');

		const alreadyPending = [...this.invites.values()].find(
			(i) => i.inviterId === inviterId && i.inviteeId === inviteeId,
		);
		if (alreadyPending) throw new BadRequestException('Invite already pending');

		const now = Date.now();
		const invite: MatchInvite = {
			id: randomUUID(),
			inviterId,
			inviteeId,
			createdAt: now,
			expiresAt: now + this.inviteTtlMs,
		};
		this.invites.set(invite.id, invite);
		return { invite, inviter, invitee };
	}

	async acceptInvite(inviteeId: number, inviteId: string) {
		this.cleanupExpiredInvites();
		const inv = this.invites.get(inviteId);
		if (!inv) throw new NotFoundException('Invite not found');
		if (inv.inviteeId !== inviteeId) throw new BadRequestException('Not your invite');

		const [inviterExisting, inviteeExisting] = await Promise.all([
			this.gameService.findByPlayer(inv.inviterId),
			this.gameService.findByPlayer(inv.inviteeId),
		]);
		if (inviterExisting?.gameId) throw new BadRequestException('Inviter already has a game');
		if (inviteeExisting?.gameId) throw new BadRequestException('You already have a game');

		this.invites.delete(inviteId);
		const game = await this.gameService.createGame(String(inv.inviterId), String(inv.inviteeId));
		return { game, inviterId: inv.inviterId, inviteeId: inv.inviteeId };
	}

	async rejectInvite(inviteeId: number, inviteId: string) {
		this.cleanupExpiredInvites();
		const inv = this.invites.get(inviteId);
		if (!inv) throw new NotFoundException('Invite not found');
		if (inv.inviteeId !== inviteeId) throw new BadRequestException('Not your invite');
		this.invites.delete(inviteId);
		return { inviterId: inv.inviterId, inviteeId: inv.inviteeId, inviteId };
	}

	async joinQueue(playerId: string)
	{
		if (this.queue.some(p => p.id === playerId)) throw new BadRequestException('Already in queue');

		const player = await this.usersService.findOne(Number(playerId));

		if (!player) throw new NotFoundException('User not found');

		const joinedAt = Date.now();

		const newPlayer: QueuePlayer =
		{
			id: playerId,
			elo: player.elo,
			joinedAt
		};

		this.queue.push(newPlayer);

		while (this.queue.some(p => p.id === playerId)) // loop only while still in queue
		{
			for (let i = 0; i < this.queue.length; i++)
			{
				const opponent = this.queue[i];

				if (opponent.id === playerId) continue;

				const waitingTime = (Date.now() - joinedAt) / 1000;

				const range = waitingTime * 10;

				const eloDiff = Math.abs(opponent.elo - newPlayer.elo);

				if (eloDiff <= range && eloDiff <= 400)
				{
					this.queue = this.queue.filter(p => p.id !== playerId && p.id !== opponent.id);
					return await this.gameService.createGame(newPlayer.id, opponent.id);
				}
			}
			await new Promise(res => setTimeout(res, 1000));
		}
		return null;
	}

	leaveQueue(playerId: string) { this.queue = this.queue.filter(p => p.id !== playerId); }

	checkStatus(playerId: string)
	{
		if (this.queue.some(p => p.id === playerId)) return { status: 'waiting' };

		return { status: 'matched' };
	}

	isInQueue(userId: number) {
		return this.queue.some(p => p.id === String(userId));
	}

	async getFriendIdsForUser(userId: number) {
		const friends = await this.friendsService.getFriendsForUser(userId);
		return friends.map(f => f.id);
	}

	async getGameIdForUser(userId: number) {
		const g = await this.gameService.findByPlayer(userId);
		return g?.gameId ?? null;
	}
}
