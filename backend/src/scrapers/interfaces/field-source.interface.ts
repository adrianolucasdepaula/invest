/**
 * Interfaces para Sistema de Rastreamento de Origem por Campo
 *
 * FASE 1.3 - Plano de Evolução do Sistema de Coleta
 *
 * Estas interfaces definem a estrutura de dados para rastrear
 * a origem de cada campo fundamental coletado dos scrapers.
 */

/**
 * Valor de um campo coletado de uma fonte específica
 */
export interface FieldSourceValue {
  /** Nome do scraper/fonte (ex: 'fundamentus', 'statusinvest') */
  source: string;

  /** Valor coletado (pode ser null se não disponível na fonte) */
  value: number | null;

  /** Data/hora da coleta */
  scrapedAt: string; // ISO 8601 format
}

/**
 * Informações consolidadas de um campo com múltiplas fontes
 */
export interface FieldSourceInfo {
  /** Lista de valores coletados de cada fonte */
  values: FieldSourceValue[];

  /** Valor final escolhido após merge */
  finalValue: number | null;

  /** Fonte do valor final */
  finalSource: string;

  /** Quantidade de fontes que retornaram valor para este campo */
  sourcesCount: number;

  /** Variância entre os valores das fontes (0-1, menor = mais confiável) */
  variance: number;

  /** Porcentagem de consenso entre fontes (0-100) */
  consensus: number;
}

/**
 * Mapa de rastreamento de origem para todos os campos
 */
export type FieldSourcesMap = Record<string, FieldSourceInfo>;

/**
 * Estratégias de merge disponíveis
 */
export enum MergeStrategy {
  /** Usa mediana dos valores (mais robusto a outliers) */
  MEDIAN = 'median',

  /** Usa média dos valores */
  AVERAGE = 'average',

  /** Usa valor mais recente */
  MOST_RECENT = 'most_recent',

  /** Usa consenso (para campos categóricos) */
  CONSENSUS = 'consensus',

  /** Usa fonte prioritária */
  PRIORITY = 'priority',
}

/**
 * Configuração de merge por campo
 */
export interface FieldMergeConfig {
  /** Nome do campo */
  field: string;

  /** Estratégia de merge a ser usada */
  strategy: MergeStrategy;

  /** Threshold de variância aceitável (0-1) */
  varianceThreshold?: number;
}

/**
 * Lista de campos que podem ser rastreados
 */
export const TRACKABLE_FIELDS = [
  // Valuation
  'pl',
  'pvp',
  'psr',
  'pAtivos',
  'pCapitalGiro',
  'pEbit',
  'evEbit',
  'evEbitda',
  'pegRatio',

  // Debt
  'dividaLiquidaPatrimonio',
  'dividaLiquidaEbitda',
  'dividaLiquidaEbit',
  'patrimonioLiquidoAtivos',
  'passivosAtivos',

  // Efficiency
  'margemBruta',
  'margemEbit',
  'margemEbitda',
  'margemLiquida',
  'roe',
  'roa',
  'roic',
  'giroAtivos',

  // Growth
  'cagrReceitas5anos',
  'cagrLucros5anos',

  // Dividends
  'dividendYield',
  'payout',

  // Financials
  'receitaLiquida',
  'ebit',
  'ebitda',
  'lucroLiquido',
  'patrimonioLiquido',
  'ativoTotal',
  'dividaBruta',
  'dividaLiquida',
  'disponibilidades',
] as const;

export type TrackableField = (typeof TRACKABLE_FIELDS)[number];

/**
 * Configuração padrão de merge por campo
 */
export const DEFAULT_FIELD_MERGE_CONFIG: Record<string, MergeStrategy> = {
  // Valuation - usar MEDIANA (robusto a outliers)
  pl: MergeStrategy.MEDIAN,
  pvp: MergeStrategy.MEDIAN,
  psr: MergeStrategy.MEDIAN,
  pAtivos: MergeStrategy.MEDIAN,
  pCapitalGiro: MergeStrategy.MEDIAN,
  pEbit: MergeStrategy.MEDIAN,
  evEbit: MergeStrategy.MEDIAN,
  evEbitda: MergeStrategy.MEDIAN,
  pegRatio: MergeStrategy.MEDIAN,

  // Debt - usar MEDIANA
  dividaLiquidaPatrimonio: MergeStrategy.MEDIAN,
  dividaLiquidaEbitda: MergeStrategy.MEDIAN,
  dividaLiquidaEbit: MergeStrategy.MEDIAN,
  patrimonioLiquidoAtivos: MergeStrategy.MEDIAN,
  passivosAtivos: MergeStrategy.MEDIAN,

  // Efficiency - usar MEDIANA
  margemBruta: MergeStrategy.MEDIAN,
  margemEbit: MergeStrategy.MEDIAN,
  margemEbitda: MergeStrategy.MEDIAN,
  margemLiquida: MergeStrategy.MEDIAN,
  roe: MergeStrategy.MEDIAN,
  roa: MergeStrategy.MEDIAN,
  roic: MergeStrategy.MEDIAN,
  giroAtivos: MergeStrategy.MEDIAN,

  // Growth - usar MEDIANA
  cagrReceitas5anos: MergeStrategy.MEDIAN,
  cagrLucros5anos: MergeStrategy.MEDIAN,

  // Dividends - usar AVERAGE (menos variação)
  dividendYield: MergeStrategy.AVERAGE,
  payout: MergeStrategy.AVERAGE,

  // Financials (valores absolutos) - usar PRIORITY
  receitaLiquida: MergeStrategy.PRIORITY,
  ebit: MergeStrategy.PRIORITY,
  ebitda: MergeStrategy.PRIORITY,
  lucroLiquido: MergeStrategy.PRIORITY,
  patrimonioLiquido: MergeStrategy.PRIORITY,
  ativoTotal: MergeStrategy.PRIORITY,
  dividaBruta: MergeStrategy.PRIORITY,
  dividaLiquida: MergeStrategy.PRIORITY,
  disponibilidades: MergeStrategy.PRIORITY,
};

/**
 * Prioridade de fontes para estratégia PRIORITY
 * Ordem: mais confiável primeiro
 */
export const SOURCE_PRIORITY = [
  'fundamentus', // 1º - Mais completo e atualizado
  'statusinvest', // 2º - Boa qualidade e cobertura
  'investidor10', // 3º - Dados extras (PEG Ratio, CAGR)
  'brapi', // 4º - API oficial
  'investsite', // 5º - Backup
  'fundamentei', // 6º - Requer login
] as const;

export type SourceName = (typeof SOURCE_PRIORITY)[number];
