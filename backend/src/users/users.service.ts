import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(User)
		private usersRepository: Repository<User>,
	) { }
	async findUserByName(username: string): Promise<User | null> {
		return this.usersRepository.findOneBy({ username });
	}
	async findAll(): Promise<User[]> {
		return this.usersRepository.find();
	}

	async findOne(id: number): Promise<User | null> {
		return this.usersRepository.findOneBy({ id });
	}

	async create(user: User): Promise<User> {
		const hashed = await bcrypt.hash(user.password, 10);
		user.password = hashed;
		return this.usersRepository.save(user);
	}
}
