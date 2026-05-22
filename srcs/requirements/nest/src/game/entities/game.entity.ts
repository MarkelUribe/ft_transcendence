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

  @Column('int', { default: -1 })
  looser: number;

  @OneToMany(() => Move, (move) => move.game, { cascade: true })
  moves: Move[];

  @Column('int', { default: 0 })
  whiteElo: number;

  @Column('int', { default: 0 })
  blackElo: number;

  @Column({ type: 'varchar', default: 'white' })
  activeColor: 'white' | 'black';

  @Column('bigint', { default: 60000 * 1 })
  whiteTimeMs: number;

  @Column('bigint', { default: 60000 * 1 })
  blackTimeMs: number;

  @Column({ type: 'bigint', nullable: true })
  lastMoveTimestamp: number;
}