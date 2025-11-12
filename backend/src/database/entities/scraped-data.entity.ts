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
import { DataSource } from './data-source.entity';

@Entity('scraped_data')
@Index(['asset', 'dataSource', 'dataType', 'scrapedAt'])
@Index(['dataSource'])
@Index(['scrapedAt'])
export class ScrapedData {
  @PrimaryGeneratedColumn('uuid')
  @Column({ primary: true })
  id: string;

  @ManyToOne(() => Asset, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  @Column({ name: 'asset_id' })
  assetId: string;

  @ManyToOne(() => DataSource, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'data_source_id' })
  dataSource: DataSource;

  @Column({ name: 'data_source_id' })
  dataSourceId: string;

  @Column({ name: 'data_type' })
  dataType: string; // e.g., 'price', 'fundamental', 'news', 'dividend'

  @Column({ type: 'jsonb' })
  data: Record<string, any>;

  @Column({ type: 'date', name: 'reference_date', nullable: true })
  referenceDate: Date;

  @Column({ name: 'scraped_at', primary: true })
  scrapedAt: Date;

  @Column({ type: 'int', name: 'response_time', nullable: true })
  responseTime: number;

  @Column({ name: 'is_valid', default: true })
  isValid: boolean;

  @Column({ name: 'validation_errors', type: 'text', nullable: true })
  validationErrors: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
