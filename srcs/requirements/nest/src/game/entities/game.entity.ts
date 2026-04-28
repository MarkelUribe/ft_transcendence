import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from '../../users/user.entity';
import { Move } from './move.entity';

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  white: User;

  @ManyToOne(() => User, { eager: true })
  black: User;

  @Column({ type: 'varchar', default: 'active' })
  status: 'active' | 'ended';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('text')
  looser: number;

  @OneToMany(() => Move, (move) => move.game, { cascade: true })
  moves: Move[];
}