import { Friendship } from '../friends/friendship.entity';
export declare class User {
    id: number;
    username: string;
    usernameNormalized: string | null;
    password: string;
    email: string;
    avatarUrl: string | null;
    elo: number;
    sentFriendships: Friendship[];
    receivedFriendships: Friendship[];
}
