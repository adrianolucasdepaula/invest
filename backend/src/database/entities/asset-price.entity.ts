import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Asset } from './asset.entity';

@Entity('asset_prices')
@Index(['asset', 'date'])
@Index(['date'])
export class AssetPrice {
  @PrimaryGeneratedColumn('uuid')
  @Column({ primary: true })
  id: string;

  @ManyToOne(() => Asset, (asset) => asset.prices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  @Column({ name: 'asset_id' })
  assetId: string;

  @Column({ type: 'date', primary: true })
  date: Date;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  open: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  high: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  low: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  close: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'adjusted_close', nullable: true })
  adjustedClose: number;

  @Column({ type: 'bigint' })
  volume: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'market_cap', nullable: true })
  marketCap: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  change: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, name: 'change_percent', nullable: true })
  changePercent: number;

  @Column({ name: 'number_of_trades', nullable: true })
  numberOfTrades: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ name: 'collected_at', type: 'timestamp', nullable: true })
  collectedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
