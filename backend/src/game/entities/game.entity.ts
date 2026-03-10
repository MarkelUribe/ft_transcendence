import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/user.entity';

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  fen: string;

  @ManyToOne(() => User, { eager: true })
  white: User;

  @ManyToOne(() => User, { eager: true })
  black: User;

  @Column({ type: 'varchar', default: 'active' })
  status: 'active' | 'checkmate' | 'draw';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
