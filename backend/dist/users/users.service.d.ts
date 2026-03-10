import { Repository } from 'typeorm';
import { User } from './user.entity';
export declare class UsersService {
    private usersRepository;
    constructor(usersRepository: Repository<User>);
    private normalizeUsername;
    findUserByName(username: string): Promise<User | null>;
    findAll(): Promise<User[]>;
    findOne(id: number): Promise<User | null>;
    private ensureUniqueUsernameAndEmail;
    create(user: User): Promise<User>;
    updateAvatar(id: number, avatarUrl: string | null): Promise<User>;
    setAvatarFromUploadedFile(id: number, file: any): Promise<User>;
    updateProfile(id: number, data: {
        email?: string;
    }): Promise<User>;
}
