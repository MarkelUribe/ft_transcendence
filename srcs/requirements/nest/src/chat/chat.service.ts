import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Message } from './message.entity';
import { Friendship, FriendshipStatus } from '../friends/friendship.entity';
import { User } from '../users/user.entity';
import { Not } from 'typeorm';


@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>,
  ) {}

  async areFriends(userId1: number, userId2: number): Promise<boolean> {
    const friendship = await this.friendshipRepository.findOne({
      where: [
        { requester: { id: userId1 }, addressee: { id: userId2 }, status: FriendshipStatus.ACCEPTED },
        { requester: { id: userId2 }, addressee: { id: userId1 }, status: FriendshipStatus.ACCEPTED },
      ],
    });
    return !!friendship;
  }

  async saveMessage(senderId: number, recipientId: number, content: string): Promise<Message> {
    const sender = { id: senderId } as User;
    const recipient = { id: recipientId } as User;

    const message = this.messageRepository.create({
      sender,
      recipient,
      content,
    });

    return this.messageRepository.save(message);
  }

  async getConversation(
    userId: number,
    friendId: number,
    limit: number = 50,
    beforeId?: number,
  ): Promise<Message[]> {
    let beforeDate: Date | undefined;
    
    if (beforeId) {
      const beforeMessage = await this.messageRepository.findOneBy({ id: beforeId });
      if (beforeMessage) {
        beforeDate = beforeMessage.createdAt;
      }
    }

    const whereClause: any = {
      sender: { id: userId },
      recipient: { id: friendId },
    };

    const whereClause2: any = {
      sender: { id: friendId },
      recipient: { id: userId },
    };

    if (beforeDate) {
      whereClause.createdAt = LessThan(beforeDate);
      whereClause2.createdAt = LessThan(beforeDate);
    }

    const messages = await this.messageRepository.find({
      where: [
        whereClause,
        whereClause2,
      ],
      relations: ['sender', 'recipient'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    // Map messages to add senderId for easier frontend handling
    return messages.reverse().map(msg => ({
      ...msg,
      senderId: msg.sender?.id,
    }));
  }

  async markAsRead(messageId: number, userId: number): Promise<void> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId, recipient: { id: userId } },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    message.isRead = true;
    await this.messageRepository.save(message);
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.messageRepository.count({
      where: {
        recipient: { id: userId },
        isRead: false,
      },
    });
  }

  async hasUnreadGameMessages(gameId: string, userId: number): Promise<boolean> {
  const count = await this.messageRepository
    .createQueryBuilder('message')
    .where('gameId = :gameId', { gameId })
    .andWhere('senderId != :userId', { userId })
    .andWhere('isRead = :isRead', { isRead: false })
    .getCount();

  return count > 0;
}

async markGameMessagesAsRead(gameId: number | string, userId: number): Promise<void> {
  await this.messageRepository
    .createQueryBuilder('message')
    .update(Message)
    .set({ isRead: true })
    .where('gameId = :gameId', { gameId: gameId.toString() })
    .andWhere('senderId != :userId', { userId })
    .andWhere('isRead = :isRead', { isRead: false })
    .execute();
}

  async getUnreadConversations(userId: number): Promise<Record<number, boolean>> {
  const unreads = await this.messageRepository
    .createQueryBuilder('m')
    .select('m.senderId', 'senderId')
    .where('m.recipientId = :userId', { userId })
    .andWhere('m.isRead = false')
    .groupBy('m.senderId')
    .getRawMany();

  return Object.fromEntries(unreads.map(r => [r.senderId, true]));
}

async markConversationAsRead(userId: number, friendId: number): Promise<void> {
  await this.messageRepository.update(
    { sender: { id: friendId }, recipient: { id: userId }, isRead: false },
    { isRead: true },
  );
}
}