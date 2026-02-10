import { Injectable } from '@nestjs/common';

export type User = {
	userId: number;
	username: string;
	password: string;
}

const users: User[] = [
	{
		userId: 1,
		username: 'Alice',
		password: 'soksok', //FIX use hash
	},
	{
		userId: 2,
		username: 'kermintzentze',
		password: 'uouo',
	}
]

@Injectable()
export class UsersService {
	async findUserByName(username: string): Promise<User | undefined> {
		return users.find((user) => user.username === username)
	}
}
