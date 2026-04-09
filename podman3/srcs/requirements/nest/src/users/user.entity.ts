import { Entity, Column, PrimaryGeneratedColumn, OneToMany, Relation } from 'typeorm';
import { Friendship } from '../friends/friendship.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  // Lowercased version used for case-insensitive lookups and uniqueness
  @Column({ type: 'varchar', unique: true, nullable: true })
  usernameNormalized: string | null;

  @Column()
  password: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  avatarUrl: string | null;
  
  @Column({ type: 'int', default: 0, nullable: true })
  elo: number;

  @OneToMany(() => Friendship, (friendship) => friendship.requester)
  sentFriendships: Relation<Friendship>[]; // Añade Relation<> aquí

  @OneToMany(() => Friendship, (friendship) => friendship.addressee)
  receivedFriendships: Relation<Friendship>[]; // Añade Relation<> aquí
}
/*
import { Entity, Column, PrimaryGeneratedColumn, OneToMany, Relation } from 'typeorm'; // Añade Relation
import { Friendship } from '../friends/friendship.entity';

@Entity('users')
export class User {
  // ... (tus otras columnas iguales)

  @OneToMany(() => Friendship, (friendship) => friendship.requester)
  sentFriendships: Relation<Friendship>[]; // Añade Relation<> aquí

  @OneToMany(() => Friendship, (friendship) => friendship.addressee)
  receivedFriendships: Relation<Friendship>[]; // Añade Relation<> aquí
}
*/
