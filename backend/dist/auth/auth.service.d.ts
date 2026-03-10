import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
type AuthInput = {
    username: string;
    password: string;
};
type SignInData = {
    id: number;
    username: string;
};
type AuthResult = {
    access_token: string;
    id: number;
    username: string;
};
type SignUpData = RegisterDto;
export declare class AuthService {
    private userService;
    private jwtService;
    constructor(userService: UsersService, jwtService: JwtService);
    authenticate(input: AuthInput): Promise<AuthResult>;
    validateUser(input: AuthInput): Promise<SignInData | null>;
    signIn(user: SignInData): Promise<AuthResult>;
    register(input: SignUpData): Promise<AuthResult>;
}
export {};
