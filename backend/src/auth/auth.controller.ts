import { Controller, HttpStatus, NotImplementedException, HttpCode, Post, Get, UseGuards, Request } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { PassportLocalGuard } from "./guards/passport-local.guards";
import { request } from "http";
import { PassportJwtAuthGuard } from "./guards/passport-jwt.guard";

@Controller('auth')
export class AuthController {
	constructor(private authService: AuthService) {}

	@HttpCode(HttpStatus.OK)
	@Post('login')
	@UseGuards(PassportLocalGuard)
	login(@Request() request) {
		return this.authService.signIn(request.user);
	}

	@Get('me')
	@UseGuards(PassportJwtAuthGuard)
	getUserInfo(@Request() request) {
		return request.user;
	}
}