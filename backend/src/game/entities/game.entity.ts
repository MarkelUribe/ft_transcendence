export class Game {
  id: string;
  fen: string;
//  turn: 'white' | 'black';
  players: {
    white: string;
    black: string;
  }
  status: 'active' | 'checkmate' | 'draw';
}


/* 
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from 'src/users/user.entity';

export type GameStatus = 'active' | 'checkmate' | 'draw';

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  fen: string;

  // relation to the white player (nullable for bot or unfinished pairing)
  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'white_id' })
  white?: User | null;

  // relation to the black player (nullable for bot or unfinished pairing)
  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'black_id' })
  black?: User | null;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: GameStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 
*/