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
import { User } from './user.entity';

export enum UpdateStatus {
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum UpdateTrigger {
  MANUAL = 'manual',
  CRON = 'cron',
  RETRY = 'retry',
  BATCH = 'batch',
}

@Entity('update_logs')
@Index(['asset', 'startedAt'])
@Index(['status'])
@Index(['startedAt'])
export class UpdateLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Asset, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  @Column({ name: 'asset_id' })
  assetId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'started_at', type: 'timestamp' })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'enum', enum: UpdateStatus, default: UpdateStatus.RUNNING })
  status: UpdateStatus;

  @Column({ type: 'text', nullable: true })
  error: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    sources?: string[];
    sourcesCount?: number;
    confidence?: number;
    dataPoints?: number;
    discrepancies?: any[];
    duration?: number;
  };

  @Column({ type: 'enum', enum: UpdateTrigger, name: 'triggered_by' })
  triggeredBy: UpdateTrigger;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
