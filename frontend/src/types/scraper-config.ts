/**
 * Types para Dynamic Scraper Configuration
 *
 * Espelham as entities do backend:
 * - ScraperConfig
 * - ScraperExecutionProfile
 *
 * FASE 4: Frontend Hooks & API Client
 * REF: C:\Users\adria\.claude\plans\sprightly-singing-narwhal.md
 */

// ============================================================================
// SCRAPER CONFIG
// ============================================================================

export type ScraperRuntime = 'typescript' | 'python';

export type ScraperCategory =
  | 'fundamental'
  | 'technical'
  | 'news'
  | 'ai'
  | 'market_data'
  | 'crypto'
  | 'options'
  | 'macro';

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

export interface ScraperConfig {
  id: string;
  scraperId: string;
  scraperName: string;
  runtime: ScraperRuntime;
  category: ScraperCategory;
  isEnabled: boolean;
  priority: number;
  enabledFor: string[] | null;
  parameters: ScraperParameters;
  successRate: number | string; // Backend serializa Decimal como string "0.00"
  avgResponseTime: number;
  lastSuccess: string | null;
  lastError: string | null;
  description: string | null;
  requiresAuth: boolean;
  authType: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// EXECUTION PROFILE
// ============================================================================

export interface ProfileConfig {
  minScrapers: number;
  maxScrapers: number;
  scraperIds: string[];
  priorityOrder: string[];
  fallbackEnabled: boolean;
  estimatedDuration: number;
  estimatedCost: number;
}

export interface ScraperExecutionProfile {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isDefault: boolean;
  isSystem: boolean;
  config: ProfileConfig;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// DTOs (Request/Response)
// ============================================================================

export interface UpdateScraperConfigDto {
  isEnabled?: boolean;
  priority?: number;
  enabledFor?: string[] | null;
  parameters?: Partial<ScraperParameters>;
}

export interface BulkToggleDto {
  scraperIds: string[];
  enabled: boolean;
}

export interface PriorityItem {
  scraperId: string;
  priority: number;
}

export interface UpdatePriorityDto {
  priorities: PriorityItem[];
}

export interface PreviewImpactDto {
  enabledScrapers: string[];
  testTicker?: string;
}

export interface ImpactAnalysis {
  estimatedDuration: number;
  estimatedMemory: number;
  estimatedCPU: number;
  minSources: number;
  maxSources: number;
  confidenceLevel: 'low' | 'medium' | 'high';
  warnings: string[];
}

export interface CreateProfileDto {
  name: string;
  displayName: string;
  description: string;
  isDefault?: boolean;
  config: ProfileConfig;
}

/**
 * DTO para atualizar perfil existente
 * GAP-001: Type definition para PUT /profiles/:id
 */
export interface UpdateProfileDto extends CreateProfileDto {}

export interface ApplyProfileResponse {
  applied: number;
  message: string;
}

export interface BulkToggleResponse {
  updated: number;
}
