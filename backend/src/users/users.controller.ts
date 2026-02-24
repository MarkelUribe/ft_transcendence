import {
	Controller,
	UseGuards,
	Post,
	UseInterceptors,
	UploadedFile,
	Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PassportJwtAuthGuard } from 'src/auth/guards/passport-jwt.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) { }

	@UseGuards(PassportJwtAuthGuard)
	@Post('me/avatar')
	@UseInterceptors(
		FileInterceptor('avatar', {
			storage: diskStorage({
				destination: 'uploads/avatars',
				filename: (req, file, cb) => {
					const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
					cb(null, unique + extname(file.originalname));
				},
			}),
			limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
			fileFilter: (req, file, cb) => {
				if (!file.mimetype.startsWith('image/')) {
					return cb(null, false);
				}
				cb(null, true);
			},
		}),
	)
	async uploadAvatar(@UploadedFile() file: any, @Req() req: any) {
		// req.user.id comes from your JwtStrategy
		const user = await this.usersService.updateAvatar(
			req.user.id,
			file ? `/uploads/avatars/${file.filename}` : null,
		);
		return user;
	}
}