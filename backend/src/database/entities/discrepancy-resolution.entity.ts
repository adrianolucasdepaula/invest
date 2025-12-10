import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FundamentalData } from './fundamental-data.entity';

/**
 * Método de resolução de discrepância
 */
export type ResolutionMethod = 'manual' | 'auto_consensus' | 'auto_priority';

/**
 * Entity para rastrear resoluções de discrepâncias
 *
 * FASE 90 - Sistema de Resolução de Discrepâncias
 *
 * Armazena histórico completo de resoluções para auditoria:
 * - Qual era o valor anterior
 * - Qual é o novo valor
 * - Quem resolveu (usuário ou sistema)
 * - Quando foi resolvido
 * - Método utilizado (manual, consenso, prioridade)
 */
@Entity('discrepancy_resolutions')
@Index('IDX_discrepancy_resolution_asset_field', ['assetId', 'fieldName'])
@Index('IDX_discrepancy_resolution_created_at', ['createdAt'])
@Index('IDX_discrepancy_resolution_method', ['resolutionMethod'])
export class DiscrepancyResolution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ID do ativo (FK para assets)
   */
  @Column({ name: 'asset_id', type: 'uuid' })
  assetId: string;

  /**
   * Ticker do ativo (denormalizado para consultas rápidas)
   */
  @Column({ name: 'ticker', type: 'varchar', length: 10 })
  ticker: string;

  /**
   * Nome do campo com discrepância (ex: 'pl', 'roe', 'dividendYield')
   */
  @Column({ name: 'field_name', type: 'varchar', length: 50 })
  fieldName: string;

  /**
   * Label amigável do campo (ex: 'P/L', 'ROE', 'Dividend Yield')
   */
  @Column({ name: 'field_label', type: 'varchar', length: 100, nullable: true })
  fieldLabel: string | null;

  /**
   * Valor ANTES da resolução
   */
  @Column({ name: 'old_value', type: 'decimal', precision: 18, scale: 4, nullable: true })
  oldValue: number | null;

  /**
   * Valor DEPOIS da resolução (novo valor escolhido)
   */
  @Column({ name: 'new_value', type: 'decimal', precision: 18, scale: 4, nullable: true })
  newValue: number | null;

  /**
   * Fonte de onde veio o novo valor
   */
  @Column({ name: 'selected_source', type: 'varchar', length: 50, nullable: true })
  selectedSource: string | null;

  /**
   * Método de resolução utilizado
   */
  @Column({ name: 'resolution_method', type: 'varchar', length: 20 })
  resolutionMethod: ResolutionMethod;

  /**
   * Quem resolveu (email do usuário ou 'system' para auto)
   */
  @Column({ name: 'resolved_by', type: 'varchar', length: 100, nullable: true })
  resolvedBy: string | null;

  /**
   * Notas/justificativa da resolução
   */
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  /**
   * Snapshot de TODOS os valores das fontes no momento da resolução
   * Para auditoria: permite ver exatamente o que cada fonte tinha
   */
  @Column({ type: 'jsonb', name: 'source_values_snapshot', nullable: true })
  sourceValuesSnapshot: Record<string, number | null>;

  /**
   * Severidade da discrepância no momento da resolução
   */
  @Column({ name: 'severity', type: 'varchar', length: 10, nullable: true })
  severity: 'high' | 'medium' | 'low' | null;

  /**
   * Porcentagem de desvio máximo no momento da resolução
   */
  @Column({ name: 'max_deviation', type: 'decimal', precision: 10, scale: 4, nullable: true })
  maxDeviation: number | null;

  /**
   * Referência ao registro de FundamentalData (opcional)
   */
  @ManyToOne(() => FundamentalData, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'fundamental_data_id' })
  fundamentalData: FundamentalData | null;

  @Column({ name: 'fundamental_data_id', type: 'uuid', nullable: true })
  fundamentalDataId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
