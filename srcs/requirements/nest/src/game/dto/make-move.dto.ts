import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class MakeMoveDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-h][1-8]$/)
  from: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-h][1-8]$/)
  to: string;
}
