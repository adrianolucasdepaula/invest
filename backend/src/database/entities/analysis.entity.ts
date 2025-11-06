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
import { User } from './user.entity';

export enum AnalysisType {
  FUNDAMENTAL = 'fundamental',
  TECHNICAL = 'technical',
  MACRO = 'macro',
  SENTIMENT = 'sentiment',
  CORRELATION = 'correlation',
  OPTIONS = 'options',
  RISK = 'risk',
  COMPLETE = 'complete',
}

export enum AnalysisStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum Recommendation {
  STRONG_BUY = 'strong_buy',
  BUY = 'buy',
  HOLD = 'hold',
  SELL = 'sell',
  STRONG_SELL = 'strong_sell',
}

@Entity('analyses')
@Index(['asset', 'type'])
@Index(['user'])
@Index(['status'])
@Index(['createdAt'])
export class Analysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Asset, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  @Column({ name: 'asset_id' })
  assetId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({
    type: 'enum',
    enum: AnalysisType,
  })
  type: AnalysisType;

  @Column({
    type: 'enum',
    enum: AnalysisStatus,
    default: AnalysisStatus.PENDING,
  })
  status: AnalysisStatus;

  @Column({
    type: 'enum',
    enum: Recommendation,
    nullable: true,
  })
  recommendation: Recommendation;

  @Column({ type: 'decimal', precision: 3, scale: 2, name: 'confidence_score', nullable: true })
  confidenceScore: number; // 0.0 to 1.0

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ type: 'jsonb', nullable: true })
  analysis: Record<string, any>; // Detailed analysis data

  @Column({ type: 'jsonb', nullable: true })
  indicators: Record<string, any>; // Technical/Fundamental indicators

  @Column({ type: 'jsonb', nullable: true })
  risks: Record<string, any>; // Risk analysis

  @Column({ type: 'jsonb', name: 'target_prices', nullable: true })
  targetPrices: Record<string, any>; // Target prices (low, medium, high)

  @Column({ type: 'jsonb', name: 'data_sources', nullable: true })
  dataSources: string[]; // Array of data source IDs used

  @Column({ name: 'sources_count', default: 0 })
  sourcesCount: number;

  @Column({ name: 'ai_provider', nullable: true })
  aiProvider: string; // e.g., 'openai', 'anthropic', 'chatgpt'

  @Column({ type: 'text', name: 'error_message', nullable: true })
  errorMessage: string;

  @Column({ name: 'processing_time', type: 'int', nullable: true })
  processingTime: number; // in milliseconds

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;
}
