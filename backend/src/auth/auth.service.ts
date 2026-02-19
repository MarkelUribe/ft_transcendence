import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';


type AuthInput = { username: string; password: string };
type SignInData = { id: number; username: string };
type AuthResult = { access_token: string; id: number; username: string };
type SignUpData = { username: string; email: string; password: string };


@Injectable()
export class AuthService {
	constructor(
		private userService: UsersService,
		private jwtService: JwtService,
	) {}

	async authenticate(input: AuthInput): Promise<AuthResult> {
		const user = await this.validateUser(input);

		if (!user) {
			throw new UnauthorizedException();
		}

		return this.signIn(user);
	}

	async validateUser(input: AuthInput): Promise<SignInData | null> {
		const user = await this.userService.findUserByName(input.username);

		if (!user)
			throw new UnauthorizedException('Invalid username or password');

		const isValid = await bcrypt.compare(input.password, user.password);
		if (!isValid)
			    throw new UnauthorizedException('Invalid username or password');

		return {
			id: user.id,
			username: user.username,
		};
	}

	async signIn(user: SignInData): Promise<AuthResult> {
		const tokenPayload = {
			sub: user.id,
			username: user.username,
		};

		const access_token = await this.jwtService.signAsync(tokenPayload);
		
		return { access_token, username: user.username, id: user.id };
	}

	async register(input: SignUpData): Promise<AuthResult> {
		if (!input.username?.trim() || !input.email?.trim() || !input.password) {
			throw new BadRequestException('All fields are required');
		}

		try {
			const createdUser = await this.userService.create(input as any);

			const tokenPayload = {
				sub: createdUser.id,
				username: createdUser.username,
			};

			const access_token = await this.jwtService.signAsync(tokenPayload);
			
			return { access_token, username: createdUser.username, id: createdUser.id };
		} catch (err: any) {
			// Postgres unique_violation
			if (err?.code === '23505' || err?.driverError?.code === '23505') {
				throw new ConflictException('Username or email already exists');
			}
			throw err;
		}
	}
}
