import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * EventImportance - Nível de importância do evento econômico
 */
export enum EventImportance {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

/**
 * EventCategory - Categoria do evento
 */
export enum EventCategory {
  INTEREST_RATE = 'interest_rate',
  INFLATION = 'inflation',
  EMPLOYMENT = 'employment',
  GDP = 'gdp',
  TRADE = 'trade',
  CONSUMER = 'consumer',
  MANUFACTURING = 'manufacturing',
  HOUSING = 'housing',
  CENTRAL_BANK = 'central_bank',
  OTHER = 'other',
}

/**
 * EventSource - Fonte dos dados do evento
 */
export enum EventSource {
  INVESTING = 'investing',
  FRED = 'fred',
  BCB = 'bcb',
  ANBIMA = 'anbima',
  IBGE = 'ibge',
  OTHER = 'other',
}

/**
 * EconomicEvent - Eventos do calendário econômico
 *
 * FASE 75.7: Calendário Econômico
 * Armazena eventos econômicos para contextualizar análise de sentimento.
 *
 * Fontes:
 * - Investing.com: https://br.investing.com/economic-calendar/
 * - FRED: Federal Reserve Economic Data
 * - BCB: Banco Central do Brasil (COPOM, SELIC, IPCA)
 */
@Entity('economic_events')
@Index(['eventDate'])
@Index(['country'])
@Index(['importance'])
@Index(['category'])
@Index(['eventDate', 'country'])
export class EconomicEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'name_en', nullable: true })
  nameEn: string;

  @Column({ length: 3 })
  country: string; // 'BRA', 'USA', 'EUR', etc. (ISO 3166-1 alpha-3)

  @Column({
    type: 'enum',
    enum: EventImportance,
    default: EventImportance.MEDIUM,
  })
  importance: EventImportance;

  @Column({
    type: 'enum',
    enum: EventCategory,
    default: EventCategory.OTHER,
  })
  category: EventCategory;

  @Column({ name: 'event_date', type: 'timestamp with time zone' })
  eventDate: Date;

  @Column({ name: 'is_all_day', default: false })
  isAllDay: boolean;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  actual: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  forecast: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  previous: number;

  @Column({ nullable: true })
  unit: string; // '%', 'M', 'B', 'K', etc.

  @Column({ name: 'impact_direction', nullable: true })
  impactDirection: 'positive' | 'negative' | 'neutral' | null;

  @Column({
    type: 'enum',
    enum: EventSource,
    default: EventSource.OTHER,
  })
  source: EventSource;

  @Column({ name: 'source_id', nullable: true })
  sourceId: string;

  @Column({ name: 'source_url', nullable: true })
  sourceUrl: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
