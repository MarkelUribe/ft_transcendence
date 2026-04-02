import { User } from '../users/user.entity';
export declare enum FriendshipStatus {
    PENDING = "PENDING",
    ACCEPTED = "ACCEPTED",
    BLOCKED = "BLOCKED"
}
export declare class Friendship {
    id: number;
    requester: User;
    addressee: User;
    status: FriendshipStatus;
    createdAt: Date;
    updatedAt: Date;
}
