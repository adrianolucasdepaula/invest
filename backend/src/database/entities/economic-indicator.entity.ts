import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * EconomicIndicator Entity - Indicadores Macroeconômicos
 *
 * Armazena indicadores econômicos brasileiros (SELIC, IPCA, CDI, PIB, etc)
 * com histórico temporal para análises e comparações.
 *
 * @entity economic_indicators
 * @created 2025-11-21
 */
@Entity('economic_indicators')
@Index('IDX_INDICATOR_TYPE_REFERENCE_DATE', ['indicatorType', 'referenceDate'], { unique: true })
@Index('IDX_INDICATOR_TYPE', ['indicatorType'])
@Index('IDX_REFERENCE_DATE', ['referenceDate'])
export class EconomicIndicator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Tipo de indicador econômico
   * @example 'SELIC', 'IPCA', 'CDI', 'PIB', 'IGPM', 'DI', 'POUPANCA'
   */
  @Column({
    name: 'indicator_type',
    type: 'varchar',
    length: 50,
    nullable: false,
    comment: 'Type of indicator: SELIC, IPCA, CDI, PIB, IGPM, etc.',
  })
  indicatorType: string;

  /**
   * Valor do indicador
   * @example 13.75 (SELIC 13.75% a.a.)
   * @example 4.83 (IPCA 4.83% ao ano)
   * @precision 10 digits, 4 decimals (max: 999999.9999)
   */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 4,
    nullable: false,
    comment: 'Indicator value (e.g., 13.75 for SELIC 13.75% a.a.)',
  })
  value: number;

  /**
   * Data de referência do indicador
   * @example '2025-11-21' (data da última reunião COPOM para SELIC)
   * @example '2025-10-31' (último dia do mês para IPCA mensal)
   */
  @Column({
    name: 'reference_date',
    type: 'date',
    nullable: false,
    comment: 'Reference date of the indicator (e.g., 2025-11-21)',
  })
  referenceDate: Date;

  /**
   * Fonte dos dados
   * @example 'BRAPI' | 'BCB' | 'IBGE' | 'ANBIMA'
   */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Data source: BRAPI, BCB (Banco Central), IBGE, etc.',
  })
  source?: string;

  /**
   * Metadados adicionais (JSONB)
   * @example { unit: '% a.a.', period: 'annual', notes: 'Meta COPOM: 3.0%' }
   */
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Additional metadata (unit, period, notes, etc.)',
  })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
