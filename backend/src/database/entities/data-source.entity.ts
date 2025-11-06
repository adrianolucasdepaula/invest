import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum DataSourceType {
  FUNDAMENTAL = 'fundamental',
  TECHNICAL = 'technical',
  NEWS = 'news',
  OPTIONS = 'options',
  MACRO = 'macro',
  INSIDER = 'insider',
  REPORT = 'report',
  AI = 'ai',
  GENERAL = 'general',
}

export enum DataSourceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  ERROR = 'error',
}

@Entity('data_sources')
@Index(['type'])
@Index(['status'])
export class DataSource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  code: string; // e.g., 'fundamentei', 'investidor10', 'statusinvest'

  @Column()
  url: string;

  @Column({
    type: 'enum',
    enum: DataSourceType,
  })
  type: DataSourceType;

  @Column({
    type: 'enum',
    enum: DataSourceStatus,
    default: DataSourceStatus.ACTIVE,
  })
  status: DataSourceStatus;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'requires_login', default: false })
  requiresLogin: boolean;

  @Column({ name: 'login_type', nullable: true })
  loginType: string; // 'google', 'credentials', 'token'

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'is_trusted', default: false })
  isTrusted: boolean;

  @Column({ name: 'reliability_score', type: 'decimal', precision: 3, scale: 2, default: 0.5 })
  reliabilityScore: number; // 0.0 to 1.0

  @Column({ name: 'last_success_at', nullable: true })
  lastSuccessAt: Date;

  @Column({ name: 'last_error_at', nullable: true })
  lastErrorAt: Date;

  @Column({ name: 'error_count', default: 0 })
  errorCount: number;

  @Column({ name: 'success_count', default: 0 })
  successCount: number;

  @Column({ name: 'average_response_time', type: 'int', nullable: true })
  averageResponseTime: number; // in milliseconds

  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
