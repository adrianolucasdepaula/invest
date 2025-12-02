/**
 * Interfaces para Sistema de Rastreamento de Origem por Campo
 *
 * FASE 1 - Sistema de Validação por Consenso
 *
 * IMPORTANTE: Em dados financeiros, os valores são ABSOLUTOS.
 * Não calculamos média/mediana - usamos múltiplas fontes para VALIDAR
 * qual valor está correto através de consenso.
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
 *
 * O sistema usa CONSENSO para validar valores:
 * - Se múltiplas fontes concordam (dentro de tolerância), valor é confiável
 * - Se há discrepância, usamos fonte prioritária + flag de alerta
 */
export interface FieldSourceInfo {
  /** Lista de valores coletados de cada fonte */
  values: FieldSourceValue[];

  /** Valor final escolhido (validado por consenso ou fonte prioritária) */
  finalValue: number | null;

  /** Fonte do valor final */
  finalSource: string;

  /** Quantidade de fontes que retornaram valor para este campo */
  sourcesCount: number;

  /** Quantidade de fontes que concordam com o valor final (dentro da tolerância) */
  agreementCount: number;

  /** Porcentagem de consenso entre fontes (0-100) */
  consensus: number;

  /** Flag: true se há discrepância significativa entre fontes */
  hasDiscrepancy: boolean;

  /** Se há discrepância, lista as fontes divergentes */
  divergentSources?: Array<{ source: string; value: number; deviation: number }>;
}

/**
 * Mapa de rastreamento de origem para todos os campos
 */
export type FieldSourcesMap = Record<string, FieldSourceInfo>;

/**
 * Estratégia de seleção de valor
 *
 * NOTA: Não usamos AVERAGE/MEDIAN para dados financeiros absolutos.
 * Usamos CONSENSUS para validação e PRIORITY como fallback.
 */
export enum SelectionStrategy {
  /**
   * CONSENSUS: Valor mais comum entre as fontes (dentro da tolerância)
   * - Se 3+ fontes concordam → valor validado com alta confiança
   * - Se 2 fontes concordam → valor validado com média confiança
   * - Se nenhuma concorda → usa fonte prioritária + flag discrepância
   */
  CONSENSUS = 'consensus',

  /**
   * PRIORITY: Usa fonte prioritária diretamente
   * - Para campos onde apenas uma fonte é confiável
   * - Outras fontes servem apenas para detectar anomalias
   */
  PRIORITY = 'priority',
}

/**
 * Configuração de tolerância para comparação de valores
 *
 * Dois valores são considerados "iguais" se a diferença percentual
 * for menor que a tolerância configurada.
 */
export interface ToleranceConfig {
  /** Tolerância percentual padrão (ex: 0.01 = 1%) */
  default: number;

  /** Tolerâncias específicas por campo */
  byField?: Record<string, number>;
}

/**
 * Tolerâncias padrão por tipo de dado
 */
export const DEFAULT_TOLERANCES: ToleranceConfig = {
  // 1% de tolerância padrão para indicadores
  default: 0.01,

  byField: {
    // Indicadores de valuation - tolerância maior (podem variar por metodologia)
    pl: 0.02, // 2%
    pvp: 0.02,
    psr: 0.02,
    evEbit: 0.02,
    evEbitda: 0.02,

    // Margens - tolerância menor (valores percentuais diretos)
    margemBruta: 0.005, // 0.5%
    margemEbit: 0.005,
    margemEbitda: 0.005,
    margemLiquida: 0.005,

    // Rentabilidade - tolerância menor
    roe: 0.005,
    roa: 0.005,
    roic: 0.005,

    // Dividend Yield - tolerância menor
    dividendYield: 0.005,

    // Valores absolutos (R$) - tolerância muito pequena
    receitaLiquida: 0.001, // 0.1%
    lucroLiquido: 0.001,
    patrimonioLiquido: 0.001,
    ativoTotal: 0.001,
    dividaBruta: 0.001,
    dividaLiquida: 0.001,
  },
};

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
 * Configuração de estratégia por campo
 *
 * CONSENSUS: Usado para a maioria dos campos - valida via múltiplas fontes
 * PRIORITY: Usado quando sabemos que uma fonte específica é mais confiável
 */
export const FIELD_SELECTION_STRATEGY: Record<string, SelectionStrategy> = {
  // Todos os campos usam CONSENSUS por padrão
  // O sistema tentará validar via consenso e usará PRIORITY como fallback
  pl: SelectionStrategy.CONSENSUS,
  pvp: SelectionStrategy.CONSENSUS,
  psr: SelectionStrategy.CONSENSUS,
  pAtivos: SelectionStrategy.CONSENSUS,
  pCapitalGiro: SelectionStrategy.CONSENSUS,
  pEbit: SelectionStrategy.CONSENSUS,
  evEbit: SelectionStrategy.CONSENSUS,
  evEbitda: SelectionStrategy.CONSENSUS,
  pegRatio: SelectionStrategy.CONSENSUS,

  dividaLiquidaPatrimonio: SelectionStrategy.CONSENSUS,
  dividaLiquidaEbitda: SelectionStrategy.CONSENSUS,
  dividaLiquidaEbit: SelectionStrategy.CONSENSUS,
  patrimonioLiquidoAtivos: SelectionStrategy.CONSENSUS,
  passivosAtivos: SelectionStrategy.CONSENSUS,

  margemBruta: SelectionStrategy.CONSENSUS,
  margemEbit: SelectionStrategy.CONSENSUS,
  margemEbitda: SelectionStrategy.CONSENSUS,
  margemLiquida: SelectionStrategy.CONSENSUS,
  roe: SelectionStrategy.CONSENSUS,
  roa: SelectionStrategy.CONSENSUS,
  roic: SelectionStrategy.CONSENSUS,
  giroAtivos: SelectionStrategy.CONSENSUS,

  cagrReceitas5anos: SelectionStrategy.CONSENSUS,
  cagrLucros5anos: SelectionStrategy.CONSENSUS,

  dividendYield: SelectionStrategy.CONSENSUS,
  payout: SelectionStrategy.CONSENSUS,

  // Valores absolutos financeiros - também usam CONSENSUS para validação
  receitaLiquida: SelectionStrategy.CONSENSUS,
  ebit: SelectionStrategy.CONSENSUS,
  ebitda: SelectionStrategy.CONSENSUS,
  lucroLiquido: SelectionStrategy.CONSENSUS,
  patrimonioLiquido: SelectionStrategy.CONSENSUS,
  ativoTotal: SelectionStrategy.CONSENSUS,
  dividaBruta: SelectionStrategy.CONSENSUS,
  dividaLiquida: SelectionStrategy.CONSENSUS,
  disponibilidades: SelectionStrategy.CONSENSUS,
};

/**
 * Prioridade de fontes para fallback quando não há consenso
 * Ordem: mais confiável primeiro
 */
export const SOURCE_PRIORITY = [
  'fundamentus', // 1º - Dados oficiais CVM, mais completo
  'statusinvest', // 2º - Boa qualidade e cobertura
  'investidor10', // 3º - Dados extras (PEG Ratio, CAGR)
  'brapi', // 4º - API com dados B3
  'investsite', // 5º - Backup
  'fundamentei', // 6º - Requer login
] as const;

export type SourceName = (typeof SOURCE_PRIORITY)[number];

// Mantendo exports antigos para compatibilidade (deprecated)
/** @deprecated Use SelectionStrategy instead */
export const MergeStrategy = SelectionStrategy;
/** @deprecated Use FIELD_SELECTION_STRATEGY instead */
export const DEFAULT_FIELD_MERGE_CONFIG = FIELD_SELECTION_STRATEGY;
