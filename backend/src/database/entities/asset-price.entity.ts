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
  id: string;

  @ManyToOne(() => Asset, (asset) => asset.prices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  @Column({ name: 'asset_id' })
  assetId: string;

  @Column({ type: 'date' })
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

  @Column({ name: 'number_of_trades', nullable: true })
  numberOfTrades: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
