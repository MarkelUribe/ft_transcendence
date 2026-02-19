import { Controller, HttpStatus, HttpCode, Post, Get, UseGuards, Request, Body } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { PassportLocalGuard } from "./guards/passport-local.guards";
import { PassportJwtAuthGuard } from "./guards/passport-jwt.guard";
import { RegisterDto } from "./dto/register.dto";

@Controller('auth')
export class AuthController {
	constructor(private authService: AuthService) {}

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
	getUserInfo(@Request() request) {
		return request.user;
	}
}