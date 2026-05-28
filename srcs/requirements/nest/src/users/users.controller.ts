import {
	Controller,
	UseGuards,
	Post,
	Get,
	UseInterceptors,
	UploadedFile,
	Req,
	Param,
	ParseIntPipe,
	NotFoundException
} from '@nestjs/common';
import { PassportJwtAuthGuard } from 'src/auth/guards/passport-jwt.guard';
import { UsersService } from './users.service';
import { avatarUploadInterceptor } from './avatar-upload.interceptor';

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) { }

	@UseGuards(PassportJwtAuthGuard)
	@Post('me/avatar')
	@UseInterceptors(avatarUploadInterceptor)
	async uploadAvatar(@UploadedFile() file: any, @Req() req: any) {
		// req.user.id comes from your JwtStrategy
		return this.usersService.setAvatarFromUploadedFile(req.user.id, file);
	}
	@Get('ranking/:n')
	async getTopbyElo( @Param('n', ParseIntPipe) n: number) {
		return this.usersService.getTopByElo(n);
	}

	@Get(':id')
	async getPublicProfile(@Param('id', ParseIntPipe) id: number) {
		const user = await this.usersService.getPublicUserById(id);
		if (!user) throw new NotFoundException('User not found');
		return user;
	}
}