import { FriendsService } from './friends.service';
import { CreateFriendRequestDto } from './dto/create-friend-request.dto';
export declare class FriendsController {
    private readonly friendsService;
    constructor(friendsService: FriendsService);
    sendFriendRequest(req: any, body: CreateFriendRequestDto): Promise<import("./friendship.entity").Friendship>;
    acceptFriendRequest(req: any, id: number): Promise<import("./friendship.entity").Friendship>;
    rejectFriendRequest(req: any, id: number): Promise<{
        success: boolean;
    }>;
    getFriends(req: any): Promise<import("../users/user.entity").User[]>;
    getPendingRequests(req: any): Promise<{
        incoming: import("./friendship.entity").Friendship[];
        outgoing: import("./friendship.entity").Friendship[];
    }>;
}
