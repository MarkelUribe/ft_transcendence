import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFriendRequestDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  targetUserId: number;
}
