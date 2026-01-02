import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Transform } from 'class-transformer';
import { Decimal } from 'decimal.js';
import { DecimalTransformer } from '../transformers/decimal.transformer';

/**
 * ScraperConfig Entity
 *
 * Configuração dinâmica de scrapers individuais.
 * Permite controle granular de quais scrapers executar, ordem de prioridade,
 * e parâmetros ajustáveis (timeout, retry, validationWeight, etc.)
 *
 * FASE: Dynamic Scraper Configuration
 * REF: C:\Users\adria\.claude\plans\sprightly-singing-narwhal.md - Seção 3.1
 */

export interface ScraperParameters {
  /** Timeout em millisegundos (min: 10000, max: 300000) */
  timeout: number;

  /** Número de tentativas em caso de falha (min: 0, max: 10) */
  retryAttempts: number;

  /** Delay entre retries em millisegundos (min: 500, max: 10000) */
  retryDelay: number;

  /** Máximo de scrapers deste tipo rodando simultaneamente (min: 1, max: 10) */
  maxConcurrency: number;

  /** Tempo de cache em segundos (min: 0, max: 86400) */
  cacheExpiry: number;

  /** Estratégia de espera do Playwright */
  waitStrategy: 'load' | 'networkidle';

  /** Headless mode do browser (Playwright) */
  headless?: boolean;

  /** Slow motion em ms para debug (Playwright) */
  slowMo?: number;

  /** Peso na cross-validation (0.0 = sem peso, 1.0 = peso máximo) */
  validationWeight: number;
}

@Entity('scraper_configs')
export class ScraperConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // IDENTIFICAÇÃO
  // ============================================================================

  /**
   * ID único do scraper (snake_case)
   * Ex: 'fundamentus', 'brapi', 'statusinvest', 'investidor10'
   */
  @Column({ unique: true, length: 100 })
  scraperId: string;

  /**
   * Nome amigável do scraper (exibido na UI)
   * Ex: 'Fundamentus', 'BRAPI', 'Status Invest'
   */
  @Column({ length: 200 })
  scraperName: string;

  /**
   * Runtime do scraper (TypeScript local ou Python API)
   */
  @Column({ type: 'enum', enum: ['typescript', 'python'] })
  runtime: 'typescript' | 'python';

  /**
   * Categoria do scraper para organização na UI
   */
  @Column({
    type: 'enum',
    enum: ['fundamental', 'technical', 'news', 'ai', 'market_data', 'crypto', 'options', 'macro'],
  })
  category:
    | 'fundamental'
    | 'technical'
    | 'news'
    | 'ai'
    | 'market_data'
    | 'crypto'
    | 'options'
    | 'macro';

  // ============================================================================
  // CONTROLE DE ATIVAÇÃO
  // ============================================================================

  /**
   * Toggle global ON/OFF
   * Se false, o scraper NÃO será executado
   */
  @Column({ default: true })
  isEnabled: boolean;

  /**
   * Prioridade de execução (1 = maior prioridade)
   * Scrapers são ordenados e executados nesta ordem
   * CONSTRAINT: Deve ser única (não pode haver duplicatas)
   */
  @Column({ default: 1, type: 'int' })
  priority: number;

  /**
   * Filtro de tickers específicos (null = todos os assets)
   * Ex: null → executa para todos
   *     ['PETR4', 'VALE3'] → executa apenas para estes tickers
   */
  @Column({ type: 'simple-array', nullable: true })
  enabledFor: string[] | null;

  // ============================================================================
  // PARÂMETROS AJUSTÁVEIS
  // ============================================================================

  /**
   * Parâmetros configuráveis do scraper
   * Armazenados em JSONB para flexibilidade
   */
  @Column({ type: 'jsonb' })
  parameters: ScraperParameters;

  // ============================================================================
  // ESTATÍSTICAS (Denormalizadas para Performance)
  // ============================================================================

  /**
   * Taxa de sucesso (0-100%)
   * Atualizada pelo ScraperMetricsService
   *
   * CRITICAL (CLAUDE.md): Usa Decimal.js (não Float) para precisão financeira
   * @Transform para serialização JSON: Decimal → string "0.00"
   */
  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: '0.00',
    transformer: new DecimalTransformer(),
  })
  @Transform(({ value }) => (value instanceof Decimal ? value.toString() : value), {
    toPlainOnly: true,
  })
  successRate: Decimal;

  /**
   * Tempo médio de resposta em millisegundos
   * Atualizado pelo ScraperMetricsService
   */
  @Column({ type: 'int', default: 0 })
  avgResponseTime: number;

  /**
   * Timestamp do último sucesso
   * null = nunca teve sucesso
   */
  @Column({ type: 'timestamp', nullable: true })
  lastSuccess: Date | null;

  /**
   * Timestamp do último erro
   * null = nunca teve erro
   */
  @Column({ type: 'timestamp', nullable: true })
  lastError: Date | null;

  // ============================================================================
  // METADADOS
  // ============================================================================

  /**
   * Descrição do scraper (exibida na UI)
   */
  @Column({ type: 'text', nullable: true })
  description: string | null;

  /**
   * Indica se requer autenticação (OAuth, credentials, token)
   */
  @Column({ default: false })
  requiresAuth: boolean;

  /**
   * Tipo de autenticação necessária
   * Ex: 'google', 'credentials', 'token', 'api_key'
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  authType: string | null;

  // ============================================================================
  // AUDIT TRAIL
  // ============================================================================

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
