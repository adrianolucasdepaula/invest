import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * ScraperExecutionProfile Entity
 *
 * Perfis pré-definidos de execução de scrapers.
 * Permite aplicar configurações completas com 1 clique.
 *
 * Perfis do Sistema (isSystem=true, não deletáveis):
 * - minimal: 2 scrapers (fundamentus, brapi) - ~35s
 * - fast: 3 scrapers (fundamentus, brapi, statusinvest) - ~60s - DEFAULT
 * - high_accuracy: 5 scrapers (todos TypeScript) - ~120s
 * - fundamentals_only: 4 scrapers fundamentalistas - ~90s
 *
 * FASE: Dynamic Scraper Configuration
 * REF: C:\Users\adria\.claude\plans\sprightly-singing-narwhal.md - Seção 3.1
 */

export interface ProfileConfig {
  /** Mínimo de scrapers que devem estar ativos */
  minScrapers: number;

  /** Máximo de scrapers simultâneos */
  maxScrapers: number;

  /** IDs dos scrapers incluídos neste perfil */
  scraperIds: string[];

  /** Ordem de prioridade (primeiro = maior prioridade) */
  priorityOrder: string[];

  /** Se deve ativar fallback Python quando insuficiente */
  fallbackEnabled: boolean;

  /** Duração estimada em segundos por asset */
  estimatedDuration: number;

  /** Custo estimado (I/O + CPU) - 0-100 scale */
  estimatedCost: number;
}

@Entity('scraper_execution_profiles')
export class ScraperExecutionProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // IDENTIFICAÇÃO
  // ============================================================================

  /**
   * Nome técnico do perfil (snake_case, único)
   * Ex: 'minimal', 'fast', 'high_accuracy', 'fundamentals_only'
   */
  @Column({ unique: true, length: 100 })
  name: string;

  /**
   * Nome amigável exibido na UI
   * Ex: 'Mínimo', 'Rápido', 'Alta Precisão'
   */
  @Column({ length: 200 })
  displayName: string;

  /**
   * Descrição completa do perfil (exibida na UI)
   */
  @Column({ type: 'text' })
  description: string;

  // ============================================================================
  // CONTROLE
  // ============================================================================

  /**
   * Indica se este é o perfil padrão
   * Aplicado automaticamente em novos usuários ou após reset
   */
  @Column({ default: false })
  isDefault: boolean;

  /**
   * Indica se é perfil do sistema (não pode ser deletado)
   * Perfis custom criados por usuários têm isSystem=false
   */
  @Column({ default: false })
  isSystem: boolean;

  // ============================================================================
  // CONFIGURAÇÃO DO PERFIL
  // ============================================================================

  /**
   * Configuração completa do perfil
   * Armazenada em JSONB para flexibilidade
   */
  @Column({ type: 'jsonb' })
  config: ProfileConfig;

  // ============================================================================
  // AUDIT TRAIL
  // ============================================================================

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
