import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(User)
		private usersRepository: Repository<User>,
	) { }

	private normalizeUsername(username: string): string {
		return username.trim().toLowerCase();
	}

	async findUserByName(username: string): Promise<User | null> {
		const normalized = this.normalizeUsername(username);
		// Case-insensitive lookup by username. Prefer the normalized column
		// when present, but also fall back to ILIKE on username so existing
		// rows without usernameNormalized still work.
		return this.usersRepository.findOne({
			where: [
				{ usernameNormalized: normalized },
				{ username: ILike(username) },
			],
		});
	}
	async findAll(): Promise<User[]> {
		return this.usersRepository.find();
	}

	async findOne(id: number): Promise<User | null> {
		return this.usersRepository.findOneBy({ id });
	}

	private async ensureUniqueUsernameAndEmail(username: string, email: string): Promise<void> {
		// Prevent duplicates at the application level using case-insensitive
		// checks, so we don't rely solely on database constraint errors.
		const existingByUsername = await this.usersRepository.findOne({
			where: { username: ILike(username) },
		});
		if (existingByUsername) {
			throw new ConflictException('Username or email already exists');
		}

		const existingByEmail = await this.usersRepository.findOne({
			where: { email: ILike(email) },
		});
		if (existingByEmail) {
			throw new ConflictException('Username or email already exists');
		}
	}

	async create(user: User): Promise<User> {
		user.username = user.username.trim();
		user.usernameNormalized = this.normalizeUsername(user.username);
		await this.ensureUniqueUsernameAndEmail(user.username, user.email);
		const hashed = await bcrypt.hash(user.password, 10);
		user.password = hashed;
		user.avatarUrl = "/uploads/avatars/default.png";
		if (user.elo == null) {
			user.elo = 0;
		}
		return this.usersRepository.save(user);
	}

	async updateAvatar(id: number, avatarUrl: string | null): Promise<User> {
		const user = await this.findOne(id);
		if (!user) throw new Error('User not found');
		user.avatarUrl = avatarUrl;
		return this.usersRepository.save(user);
	}

	async setAvatarFromUploadedFile(id: number, file: any): Promise<User> {
		const avatarUrl = file ? `/uploads/avatars/${file.filename}` : null;
		return this.updateAvatar(id, avatarUrl);
	}

	async updateProfile(id: number, data: { email?: string }): Promise<User> {
		const user = await this.findOne(id);
		if (!user) throw new Error('User not found');
		// Username is permanent; only allow updating email
		if (data.email !== undefined) user.email = data.email;
		return this.usersRepository.save(user);
	}
}
