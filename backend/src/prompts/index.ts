/**
 * LLM Prompts Index
 *
 * FASE 102: LLM Prompts Estruturados para análise de investimentos
 *
 * Exports all prompt templates and utilities for structured AI analysis
 */

// Base types and utilities
export {
  PromptTemplate,
  PromptVariables,
  TradingHorizon,
  Bias,
  Trend,
  Confidence,
  Sentiment,
  TechnicalData,
  FundamentalData,
  NewsData,
  DateRange,
  renderPrompt,
  validateVariables,
} from './base.prompt';

// Individual prompts
export { daytradePrompt } from './daytrade.prompt';
export { swingtradePrompt } from './swingtrade.prompt';
export { positionPrompt } from './position.prompt';
export { marketOverviewPrompt } from './market-overview.prompt';
export { sectorAnalysisPrompt } from './sector-analysis.prompt';

// Import for registry
import { PromptTemplate } from './base.prompt';
import { daytradePrompt } from './daytrade.prompt';
import { swingtradePrompt } from './swingtrade.prompt';
import { positionPrompt } from './position.prompt';
import { marketOverviewPrompt } from './market-overview.prompt';
import { sectorAnalysisPrompt } from './sector-analysis.prompt';

/**
 * Registry of all available prompts
 */
export const promptRegistry: Record<string, PromptTemplate> = {
  daytrade: daytradePrompt,
  swingtrade: swingtradePrompt,
  position: positionPrompt,
  'market-overview': marketOverviewPrompt,
  'sector-analysis': sectorAnalysisPrompt,
};

/**
 * Get a prompt by name
 *
 * @param name - Prompt name (e.g., 'daytrade', 'swingtrade')
 * @returns PromptTemplate or undefined
 */
export function getPrompt(name: string): PromptTemplate | undefined {
  return promptRegistry[name.toLowerCase()];
}

/**
 * Get all available prompt names
 *
 * @returns Array of prompt names
 */
export function getAvailablePrompts(): string[] {
  return Object.keys(promptRegistry);
}

/**
 * Get prompts by horizon
 *
 * @param horizon - Trading horizon
 * @returns Array of matching prompts
 */
export function getPromptsByHorizon(
  horizon: 'intraday' | 'swing' | 'position' | 'market' | 'sector',
): PromptTemplate[] {
  return Object.values(promptRegistry).filter((p) => p.horizon === horizon);
}
