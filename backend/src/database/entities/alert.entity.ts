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

export enum AlertType {
  PRICE_ABOVE = 'price_above',
  PRICE_BELOW = 'price_below',
  PRICE_CHANGE_PERCENT = 'price_change_percent',
  VOLUME_ABOVE = 'volume_above',
  RSI_ABOVE = 'rsi_above',
  RSI_BELOW = 'rsi_below',
  INDICATOR_CHANGE = 'indicator_change',
}

export enum AlertStatus {
  ACTIVE = 'active',
  TRIGGERED = 'triggered',
  PAUSED = 'paused',
  EXPIRED = 'expired',
  DISABLED = 'disabled',
}

export enum NotificationChannel {
  EMAIL = 'email',
  WEBSOCKET = 'websocket',
  PUSH = 'push',
}

@Entity('alerts')
@Index(['userId', 'status'])
@Index(['assetId', 'status'])
@Index(['status', 'type'])
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'asset_id', nullable: true })
  assetId: string;

  @ManyToOne(() => Asset, { nullable: true })
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  @Column({ type: 'varchar', length: 20, nullable: true })
  ticker: string;

  @Column({
    type: 'enum',
    enum: AlertType,
  })
  type: AlertType;

  @Column({
    type: 'enum',
    enum: AlertStatus,
    default: AlertStatus.ACTIVE,
  })
  status: AlertStatus;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 18, scale: 4 })
  targetValue: number;

  @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  currentValue: number;

  @Column({
    type: 'simple-array',
    default: NotificationChannel.WEBSOCKET,
  })
  notificationChannels: NotificationChannel[];

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'timestamp', nullable: true })
  triggeredAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'last_checked_at' })
  lastCheckedAt: Date;

  @Column({ type: 'int', default: 0, name: 'trigger_count' })
  triggerCount: number;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ type: 'boolean', default: false })
  isRecurring: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
