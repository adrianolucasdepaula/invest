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
import { Asset } from './asset.entity';

export enum OptionType {
  CALL = 'call',
  PUT = 'put',
}

export enum OptionStyle {
  AMERICAN = 'american',
  EUROPEAN = 'european',
}

export enum OptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  EXERCISED = 'exercised',
}

@Entity('option_prices')
@Index(['underlyingAssetId', 'expirationDate', 'type'])
@Index(['ticker'])
@Index(['expirationDate'])
@Index(['strike', 'type'])
export class OptionPrice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  ticker: string;

  @Column({ type: 'uuid', name: 'underlying_asset_id' })
  underlyingAssetId: string;

  @ManyToOne(() => Asset, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'underlying_asset_id' })
  underlyingAsset: Asset;

  @Column({
    type: 'enum',
    enum: OptionType,
  })
  type: OptionType;

  @Column({
    type: 'enum',
    enum: OptionStyle,
    default: OptionStyle.AMERICAN,
  })
  style: OptionStyle;

  @Column({
    type: 'enum',
    enum: OptionStatus,
    default: OptionStatus.ACTIVE,
  })
  status: OptionStatus;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  strike: number;

  @Column({ type: 'date', name: 'expiration_date' })
  expirationDate: Date;

  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  lastPrice: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  bid: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  ask: number;

  @Column({ type: 'bigint', nullable: true })
  volume: number;

  @Column({ type: 'bigint', name: 'open_interest', nullable: true })
  openInterest: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, name: 'implied_volatility', nullable: true })
  impliedVolatility: number;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  delta: number;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  gamma: number;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  theta: number;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  vega: number;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  rho: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, name: 'underlying_price', nullable: true })
  underlyingPrice: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, name: 'intrinsic_value', nullable: true })
  intrinsicValue: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, name: 'extrinsic_value', nullable: true })
  extrinsicValue: number;

  @Column({ type: 'int', name: 'days_to_expiration', nullable: true })
  daysToExpiration: number;

  @Column({ type: 'boolean', name: 'in_the_money', default: false })
  inTheMoney: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  source: string;

  @Column({ type: 'timestamp', name: 'quote_time', nullable: true })
  quoteTime: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    lotSize?: number;
    exerciseStyle?: string;
    settlementType?: string;
    currency?: string;
    exchange?: string;
    rawData?: Record<string, any>;
  };
}
