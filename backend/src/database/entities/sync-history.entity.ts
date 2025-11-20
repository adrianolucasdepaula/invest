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

/**
 * Sync History Entity (FASE 34.6)
 *
 * Purpose: Audit trail for all sync operations (COTAHIST, BRAPI, Bulk Sync)
 * Compliance: Record keeping for regulatory audits and data lineage tracking
 *
 * Use cases:
 * - Audit trail: Who synced what and when
 * - Performance monitoring: Track sync times and success rates
 * - Error tracking: Log failures for debugging
 * - Compliance reporting: Generate audit reports for regulators
 */
export enum SyncStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PARTIAL = 'partial', // Some data synced, but not all (e.g., COTAHIST failed, BRAPI succeeded)
}

export enum SyncOperationType {
  SYNC_COTAHIST = 'sync-cotahist',
  SYNC_BRAPI = 'sync-brapi',
  SYNC_ALL = 'sync-all',
}

@Entity('sync_history')
@Index('IDX_sync_history_asset_id', ['assetId'])
@Index('IDX_sync_history_created_at', ['createdAt'])
@Index('IDX_sync_history_status', ['status'])
@Index('IDX_sync_history_operation_type', ['operationType'])
@Index('IDX_sync_history_asset_created', ['assetId', 'createdAt'])
export class SyncHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Asset, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  @Column({ name: 'asset_id' })
  assetId: string;

  @Column({ name: 'operation_type', type: 'varchar', length: 50 })
  operationType: SyncOperationType;

  @Column({ type: 'varchar', length: 20 })
  status: SyncStatus;

  @Column({ name: 'records_synced', type: 'integer', nullable: true })
  recordsSynced: number | null;

  @Column({ name: 'years_processed', type: 'integer', nullable: true })
  yearsProcessed: number | null;

  @Column({ name: 'processing_time', type: 'decimal', precision: 10, scale: 2, nullable: true })
  processingTime: number | null;

  @Column({ name: 'source_details', type: 'jsonb', nullable: true })
  sourceDetails: {
    cotahist?: number;
    brapi?: number;
    merged?: number;
  } | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
