import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Asset } from './asset.entity';

@Entity('asset_index_memberships')
@Index(['indexName'])
@Index(['assetId', 'validFrom', 'validTo'])
@Unique(['assetId', 'indexName', 'validFrom'])
export class AssetIndexMembership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'asset_id' })
  assetId: string;

  @ManyToOne(() => Asset, (asset) => asset.indexMemberships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  @Column({ name: 'index_name', length: 10 })
  indexName: string; // 'IDIV', 'IBOV', 'IFIX', 'SMLL'

  @Column({
    name: 'participation_percent',
    type: 'decimal',
    precision: 10,
    scale: 6,
  })
  participationPercent: number; // Ex: 3.456789

  @Column({ name: 'theoretical_quantity', type: 'bigint', nullable: true })
  theoreticalQuantity: number | null; // Quantidade teórica (opcional)

  @Column({ name: 'valid_from', type: 'date' })
  validFrom: Date; // Início da vigência

  @Column({ name: 'valid_to', type: 'date', nullable: true })
  validTo: Date | null; // Fim da vigência (null = vigente)

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    source?: string; // 'b3', 'statusinvest'
    scrapedAt?: string;
    confidence?: number; // Score cross-validation (0-100)
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
