import { Controller, HttpStatus, HttpCode, Post, Get, UseGuards, Request, Body, Patch, Req } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { PassportLocalGuard } from "./guards/passport-local.guards";
import { PassportJwtAuthGuard } from "./guards/passport-jwt.guard";
import { RegisterDto } from "./dto/register.dto";
import { UsersService } from "src/users/users.service";


@Controller('auth')
export class AuthController {
	constructor(
		private authService: AuthService,
		private usersService: UsersService,
	) { }

	@HttpCode(HttpStatus.OK)
	@Post('login')
	@UseGuards(PassportLocalGuard)
	login(@Request() request) {
		return this.authService.signIn(request.user);
	}

	@Post('register')
	register(@Body() body: RegisterDto) {
		return this.authService.register(body);
	}

	@Get('me')
	@UseGuards(PassportJwtAuthGuard)
	getMe(@Req() req: any) {
		return this.usersService.findOne(req.user.id);
	}

	@UseGuards(PassportJwtAuthGuard)
	@Patch('me')
	async updateProfile(@Req() req: any, @Body() body: { email?: string }) {
		return this.usersService.updateProfile(req.user.id, body);
	}
}