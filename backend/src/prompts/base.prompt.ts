/**
 * Base Prompt Interface and Types
 *
 * FASE 102: LLM Prompts Estruturados para análise de investimentos
 *
 * Defines the structure for all trading/investment analysis prompts
 */

export type TradingHorizon = 'intraday' | 'swing' | 'position' | 'market' | 'sector';

export type Bias = 'COMPRA' | 'VENDA' | 'NEUTRO';
export type Trend = 'ALTA' | 'BAIXA' | 'LATERAL';
export type Confidence = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type Sentiment = 'RISK_ON' | 'RISK_OFF' | 'MISTO';

export interface PromptTemplate {
  /** Unique name for the prompt */
  name: string;

  /** Trading horizon this prompt targets */
  horizon: TradingHorizon;

  /** Human-readable description */
  description: string;

  /** The actual prompt template with {{variable}} placeholders */
  template: string;

  /** List of required variables for this prompt */
  variables: string[];

  /** Optional system instructions to prepend */
  systemInstructions?: string;

  /** Output format specification */
  outputFormat: 'markdown' | 'json' | 'structured';
}

export interface PromptVariables {
  /** Stock ticker (e.g., 'PETR4') */
  ticker?: string;

  /** Current price */
  currentPrice?: number;

  /** Technical indicators data */
  technicalData?: TechnicalData;

  /** Fundamental data */
  fundamentalData?: FundamentalData;

  /** News and sentiment data */
  newsData?: NewsData;

  /** Sector for analysis */
  sector?: string;

  /** Date range for analysis */
  dateRange?: DateRange;
}

export interface TechnicalData {
  rsi?: number;
  macd?: { value: number; signal: number; histogram: number };
  sma20?: number;
  sma50?: number;
  sma200?: number;
  ema9?: number;
  ema21?: number;
  bollingerBands?: { upper: number; middle: number; lower: number };
  atr?: number;
  volume?: number;
  volumeAvg20?: number;
  supportLevels?: number[];
  resistanceLevels?: number[];
  patterns?: string[];
}

export interface FundamentalData {
  pl?: number;
  pvp?: number;
  roe?: number;
  roic?: number;
  dy?: number;
  evEbitda?: number;
  margemLiquida?: number;
  margemBruta?: number;
  divLiqEbitda?: number;
  lpa?: number;
  vpa?: number;
  crescimentoReceita5a?: number;
  crescimentoLucro5a?: number;
}

export interface NewsData {
  recentNews?: Array<{
    title: string;
    date: string;
    sentiment?: 'positive' | 'negative' | 'neutral';
  }>;
  analystRatings?: Array<{
    analyst: string;
    rating: string;
    targetPrice?: number;
  }>;
  marketSentiment?: Sentiment;
}

export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Render a prompt template with variables
 *
 * @param template - The prompt template string
 * @param variables - Object with variable values
 * @returns Rendered prompt string
 */
export function renderPrompt(template: string, variables: Record<string, unknown>): string {
  let rendered = template;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');

    if (typeof value === 'object' && value !== null) {
      rendered = rendered.replace(placeholder, JSON.stringify(value, null, 2));
    } else {
      rendered = rendered.replace(placeholder, String(value ?? ''));
    }
  }

  // Remove any remaining unresolved placeholders
  rendered = rendered.replace(/{{[^}]+}}/g, 'N/A');

  return rendered;
}

/**
 * Validate that all required variables are provided
 *
 * @param template - The prompt template
 * @param variables - Provided variables
 * @returns Array of missing variable names
 */
export function validateVariables(
  template: PromptTemplate,
  variables: Record<string, unknown>,
): string[] {
  const missing: string[] = [];

  for (const required of template.variables) {
    if (!(required in variables) || variables[required] === undefined) {
      missing.push(required);
    }
  }

  return missing;
}
