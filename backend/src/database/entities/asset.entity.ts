import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { AssetPrice } from './asset-price.entity';
import { FundamentalData } from './fundamental-data.entity';
import { AssetIndexMembership } from './asset-index-membership.entity';

export enum AssetType {
  STOCK = 'stock',
  FII = 'fii',
  ETF = 'etf',
  BDR = 'bdr',
  OPTION = 'option',
  FUTURE = 'future',
  CRYPTO = 'crypto',
  FIXED_INCOME = 'fixed_income',
}

@Entity('assets')
@Index(['ticker'])
@Index(['type'])
@Index(['sector'])
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  ticker: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: AssetType,
  })
  type: AssetType;

  @Column({ nullable: true })
  sector: string;

  @Column({ nullable: true })
  subsector: string;

  @Column({ nullable: true })
  segment: string;

  @Column({ nullable: true })
  cnpj: string;

  @Column({ nullable: true })
  website: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'logo_url', nullable: true })
  logoUrl: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'listing_date', type: 'date', nullable: true })
  listingDate: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // Update tracking fields
  @Column({ name: 'last_updated', type: 'timestamp', nullable: true })
  lastUpdated: Date;

  @Column({ name: 'last_update_status', nullable: true })
  lastUpdateStatus: 'success' | 'failed' | 'pending' | 'outdated';

  @Column({ name: 'last_update_error', type: 'text', nullable: true })
  lastUpdateError: string;

  @Column({ name: 'update_retry_count', default: 0 })
  updateRetryCount: number;

  @Column({ name: 'auto_update_enabled', default: true })
  autoUpdateEnabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => AssetPrice, (price) => price.asset)
  prices: AssetPrice[];

  @OneToMany(() => FundamentalData, (fundamental) => fundamental.asset)
  fundamentalData: FundamentalData[];

  @OneToMany(() => AssetIndexMembership, (membership) => membership.asset)
  indexMemberships: AssetIndexMembership[];

  @Column({ name: 'has_options', default: false })
  hasOptions: boolean;

  @Column({ name: 'options_liquidity_metadata', type: 'jsonb', nullable: true })
  optionsLiquidityMetadata: Record<string, any>;
}
