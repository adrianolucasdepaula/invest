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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => AssetPrice, (price) => price.asset)
  prices: AssetPrice[];

  @OneToMany(() => FundamentalData, (fundamental) => fundamental.asset)
  fundamentalData: FundamentalData[];
}
