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
import Decimal from 'decimal.js';
import { Asset } from './asset.entity';
import { DecimalTransformer } from '../transformers/decimal.transformer';

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

/**
 * AssetPrice Entity - Daily OHLCV data for B3 assets
 *
 * Base Indexes (TypeORM):
 * - UQ_asset_prices_asset_id_date: Unique constraint (asset_id, date)
 * - idx_asset_prices_asset_date: Composite B-tree (asset, date)
 * - idx_asset_prices_date: B-tree (date)
 * - idx_asset_prices_source: B-tree (source)
 *
 * FASE 117 Optimized indexes (migration):
 * - idx_asset_prices_date_brin: BRIN index for date range scans (~100x smaller)
 * - idx_asset_prices_recent: Partial index for last 2 years (most accessed)
 * - idx_asset_prices_ohlcv_covering: Covering index for index-only scans
 * - idx_asset_prices_monthly: Expression index for DATE_TRUNC aggregations
 */
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

  @Column({ type: 'decimal', precision: 18, scale: 4, transformer: new DecimalTransformer() })
  open: Decimal;

  @Column({ type: 'decimal', precision: 18, scale: 4, transformer: new DecimalTransformer() })
  high: Decimal;

  @Column({ type: 'decimal', precision: 18, scale: 4, transformer: new DecimalTransformer() })
  low: Decimal;

  @Column({ type: 'decimal', precision: 18, scale: 4, transformer: new DecimalTransformer() })
  close: Decimal;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 4,
    name: 'adjusted_close',
    nullable: true,
    transformer: new DecimalTransformer(),
  })
  adjustedClose: Decimal | null;

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

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
    name: 'market_cap',
    nullable: true,
    transformer: new DecimalTransformer(),
  })
  marketCap: Decimal | null;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: true,
    transformer: new DecimalTransformer(),
  })
  change: Decimal | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 4,
    name: 'change_percent',
    nullable: true,
    transformer: new DecimalTransformer(),
  })
  changePercent: Decimal | null;

  @Column({ name: 'number_of_trades', nullable: true })
  numberOfTrades: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ name: 'collected_at', type: 'timestamp', nullable: true })
  collectedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
