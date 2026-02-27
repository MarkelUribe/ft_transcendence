import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

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
}
