import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Entity para armazenar configurações de validação cruzada
 *
 * FASE 93.1 - Cross-Validation Configuration
 *
 * Permite ajustar dinamicamente os parâmetros de validação:
 * - Número mínimo de fontes
 * - Thresholds de severidade
 * - Prioridade de fontes
 * - Tolerâncias por campo
 */
@Entity('cross_validation_config')
export class CrossValidationConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Chave única da configuração
   * Ex: 'min_sources', 'severity_threshold_high', 'source_priority'
   */
  @Column({ name: 'config_key', type: 'varchar', length: 50, unique: true })
  configKey: string;

  /**
   * Valor da configuração (armazenado como JSONB para flexibilidade)
   * Pode ser number, string, array ou object dependendo da configuração
   */
  @Column({ type: 'jsonb' })
  value: unknown;

  /**
   * Descrição da configuração para UI
   */
  @Column({ type: 'text', nullable: true })
  description: string;

  /**
   * Flag para ativar/desativar configuração
   */
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
