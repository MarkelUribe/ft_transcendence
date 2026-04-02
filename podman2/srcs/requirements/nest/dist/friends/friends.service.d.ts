import { Repository } from 'typeorm';
import { Friendship } from './friendship.entity';
import { User } from '../users/user.entity';
export declare class FriendsService {
    private readonly friendshipRepository;
    private readonly usersRepository;
    constructor(friendshipRepository: Repository<Friendship>, usersRepository: Repository<User>);
    sendFriendRequest(requesterId: number, targetUserId: number): Promise<Friendship>;
    acceptFriendRequest(friendshipId: number, userId: number): Promise<Friendship>;
    rejectFriendRequest(friendshipId: number, userId: number): Promise<void>;
    getFriendsForUser(userId: number): Promise<User[]>;
    getPendingRequestsForUser(userId: number): Promise<{
        incoming: Friendship[];
        outgoing: Friendship[];
    }>;
}
