import { Entity, Column, PrimaryGeneratedColumn, ManyToOne} from 'typeorm';
import { Game } from './game.entity';

@Entity('moves')
export class Move {
  @ManyToOne(() => Game, (game) => game.moves, { onDelete: 'CASCADE' })
  game: Game;

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  from: string;

  @Column()
  to: string;

  @Column({ nullable: true })
  promotion?: string;

  @Column()
  san: string;

  @Column({ default: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', })
  fen: string;
}