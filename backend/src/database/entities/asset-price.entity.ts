import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Asset } from './asset.entity';

/**
 * Enum for data source traceability (FINRA Rule 6140 compliance)
 *
 * - cotahist: Official B3 COTAHIST data (1986-2025, 245-byte fixed-width format)
 * - brapi: BRAPI API data (last 3 months, includes adjustedClose for dividend adjustments)
 *
 * Purpose: Track origin of each price record for audit trails and compliance
 */
export enum PriceSource {
  COTAHIST = 'cotahist',
  BRAPI = 'brapi',
}

@Entity('asset_prices')
@Unique('UQ_asset_prices_asset_id_date', ['assetId', 'date'])
@Index(['asset', 'date'])
@Index(['date'])
@Index(['source'])
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

  /**
   * Data source for traceability (FINRA Rule 6140 compliance)
   *
   * - cotahist: Official B3 historical data (1986-present, no dividend adjustments)
   * - brapi: Recent API data (last 3 months, with adjustedClose for proventos)
   *
   * Enables audit trails: track where each price record originated
   */
  @Column({
    type: 'enum',
    enum: PriceSource,
    nullable: false,
  })
  source: PriceSource;

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
