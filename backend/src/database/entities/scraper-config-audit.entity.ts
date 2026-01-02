import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

/**
 * ScraperConfigAudit - Registro de auditoria para mudancas em scraper_configs
 *
 * GAP-006: Audit Trail para sistema financeiro
 *
 * Toda mudanca em configuracoes de scrapers e registrada para:
 * - Compliance com regulamentacoes financeiras
 * - Rastreabilidade de mudancas
 * - Debug e investigacao de problemas
 *
 * FASE: Dynamic Scraper Configuration
 * REF: C:\Users\adria\.claude\plans\prancy-napping-stroustrup.md - GAP-006
 */
@Entity('scraper_config_audit')
@Index(['scraperId', 'createdAt'])
@Index(['userId', 'createdAt'])
@Index(['action', 'createdAt'])
export class ScraperConfigAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Tipo de acao realizada
   */
  @Column({
    type: 'enum',
    enum: [
      'CREATE',
      'UPDATE',
      'DELETE',
      'TOGGLE',
      'BULK_TOGGLE',
      'APPLY_PROFILE',
      'UPDATE_PRIORITY',
    ],
  })
  action:
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'TOGGLE'
    | 'BULK_TOGGLE'
    | 'APPLY_PROFILE'
    | 'UPDATE_PRIORITY';

  /**
   * ID do usuario que realizou a acao (null = sistema)
   */
  @Column('uuid', { nullable: true })
  userId: string | null;

  /**
   * ID do scraper afetado (null para acoes em lote)
   */
  @Column('varchar', { length: 100, nullable: true })
  scraperId: string | null;

  /**
   * ID do perfil aplicado (se aplicavel)
   */
  @Column('uuid', { nullable: true })
  profileId: string | null;

  /**
   * Mudancas realizadas (before/after)
   */
  @Column('jsonb')
  changes: {
    before?: Record<string, any>;
    after?: Record<string, any>;
    affectedScrapers?: string[];
  };

  /**
   * Motivo da mudanca (opcional)
   */
  @Column('text', { nullable: true })
  reason: string | null;

  /**
   * IP do cliente que realizou a acao
   */
  @Column('varchar', { length: 45, nullable: true })
  ipAddress: string | null;

  /**
   * User Agent do cliente
   */
  @Column('varchar', { length: 500, nullable: true })
  userAgent: string | null;

  /**
   * Data/hora da acao
   */
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
