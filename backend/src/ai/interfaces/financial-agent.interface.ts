import { AgentResponse, AnalysisContext } from './analysis.types';

/**
 * Interface base para todos os agentes financeiros
 */
export interface IFinancialAgent {
  /**
   * Nome do agente
   */
  readonly name: string;

  /**
   * Especialidade do agente
   */
  readonly specialty: string;

  /**
   * Versão do prompt/agente
   */
  readonly version: string;

  /**
   * Analisa o contexto e retorna recomendação
   */
  analyze(context: AnalysisContext): Promise<AgentResponse>;

  /**
   * Valida se o agente pode analisar o contexto
   */
  canAnalyze(context: AnalysisContext): boolean;

  /**
   * Retorna nível de confiança base do agente (0-1)
   */
  getBaseConfidence(): number;
}

/**
 * Configuração de agente
 */
export interface AgentConfig {
  model: string; // 'gpt-4-turbo', 'gpt-3.5-turbo', etc
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
}

/**
 * Resultado de análise com múltiplos agentes
 */
export interface MultiAgentAnalysis {
  ticker: string;
  timestamp: Date;
  agents: {
    [agentName: string]: AgentResponse;
  };
  consensus?: {
    recommendation: 'BUY' | 'HOLD' | 'SELL';
    confidence: number;
    agreement: number; // 0-1 (quão unânimes são os agentes)
  };
  summary: string;
}
