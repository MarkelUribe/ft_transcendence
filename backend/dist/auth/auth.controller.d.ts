import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { UsersService } from "src/users/users.service";
export declare class AuthController {
    private authService;
    private usersService;
    constructor(authService: AuthService, usersService: UsersService);
    login(request: any): Promise<{
        access_token: string;
        id: number;
        username: string;
    }>;
    register(body: RegisterDto): Promise<{
        access_token: string;
        id: number;
        username: string;
    }>;
    getMe(req: any): Promise<import("../users/user.entity").User | null>;
    updateProfile(req: any, body: {
        email?: string;
    }): Promise<import("../users/user.entity").User>;
}
