import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { PassportJwtAuthGuard } from '../auth/guards/passport-jwt.guard';
import { CreateFriendRequestDto } from './dto/create-friend-request.dto';

@UseGuards(PassportJwtAuthGuard)
@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post('requests')
  async sendFriendRequest(@Req() req: any, @Body() body: CreateFriendRequestDto) {
    const requesterId = req.user.id;
    return this.friendsService.sendFriendRequest(requesterId, body.targetUserId);
  }

  @Post('requests/:id/accept')
  async acceptFriendRequest(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user.id;
    return this.friendsService.acceptFriendRequest(id, userId);
  }

  @Post('requests/:id/reject')
  async rejectFriendRequest(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user.id;
    await this.friendsService.rejectFriendRequest(id, userId);
    return { success: true };
  }

  @Get()
  async getFriends(@Req() req: any) {
    const userId = req.user.id;
    return this.friendsService.getFriendsForUser(userId);
  }

  @Get('requests')
  async getPendingRequests(@Req() req: any) {
    const userId = req.user.id;
    return this.friendsService.getPendingRequestsForUser(userId);
  }
}
