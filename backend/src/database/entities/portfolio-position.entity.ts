import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Portfolio } from './portfolio.entity';
import { Asset } from './asset.entity';

@Entity('portfolio_positions')
@Index(['portfolio'])
@Index(['asset'])
@Index('IDX_portfolio_positions_portfolio_first_buy', ['portfolioId', 'firstBuyDate'])
export class PortfolioPosition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Portfolio, (portfolio) => portfolio.positions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'portfolio_id' })
  portfolio: Portfolio;

  @Column({ name: 'portfolio_id' })
  portfolioId: string;

  @ManyToOne(() => Asset, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  @Column({ name: 'asset_id' })
  assetId: string;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  quantity: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'average_price' })
  averagePrice: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'current_price', nullable: true })
  currentPrice: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'total_invested' })
  totalInvested: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'current_value', nullable: true })
  currentValue: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  profit: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, name: 'profit_percentage', nullable: true })
  profitPercentage: number;

  @Column({ type: 'date', name: 'first_buy_date', nullable: true })
  firstBuyDate: Date;

  @Column({ type: 'date', name: 'last_update_date', nullable: true })
  lastUpdateDate: Date;

  @Column({ type: 'jsonb', nullable: true })
  notes: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
