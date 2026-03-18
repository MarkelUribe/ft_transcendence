import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friendship } from './friendship.entity';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';
import { FriendsGateway } from './friends.gateway';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Friendship, User])],
  providers: [FriendsService, FriendsGateway],
  controllers: [FriendsController],
  exports: [FriendsService, FriendsGateway],
})
export class FriendsModule {}
