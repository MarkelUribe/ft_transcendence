import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    uploadAvatar(file: any, req: any): Promise<import("./user.entity").User>;
}
