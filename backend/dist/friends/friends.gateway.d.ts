import { Server, Socket } from 'socket.io';
export declare class FriendsGateway {
    server: Server;
    handleRegister(client: Socket, data: {
        userId?: number;
    } | undefined): void;
    notifyUsers(userIds: number[]): void;
    handleFriendInvite(client: Socket, data: {
        fromUserId?: number;
        toUserId?: number;
        fromUsername?: string;
    }): void;
    handleFriendInviteAccepted(client: Socket, data: {
        inviterId?: number;
        inviteeId?: number;
        gameId?: string;
    }): void;
    private getUserRoom;
}
