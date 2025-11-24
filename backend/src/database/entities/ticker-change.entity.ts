import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('ticker_changes')
@Index(['oldTicker', 'newTicker'], { unique: true })
export class TickerChange {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'old_ticker', length: 10 })
  @Index()
  oldTicker: string;

  @Column({ name: 'new_ticker', length: 10 })
  @Index()
  newTicker: string;

  @Column({ name: 'change_date', type: 'date' })
  changeDate: Date;

  @Column({ length: 50, nullable: true })
  reason: string; // e.g., 'REBRANDING', 'MERGER', 'SPINOFF'

  @Column({ type: 'decimal', precision: 10, scale: 6, default: 1.0 })
  ratio: number; // Conversion ratio (usually 1.0 for simple renames)

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
