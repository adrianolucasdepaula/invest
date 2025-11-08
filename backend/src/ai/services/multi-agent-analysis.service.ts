import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  FundamentalAnalystAgent,
  TechnicalAnalystAgent,
  SentimentAnalystAgent,
  RiskAnalystAgent,
  MacroAnalystAgent,
} from '../agents';
import { AnalysisContext, AgentResponse } from '../interfaces/analysis.types';
import { MultiAgentAnalysis } from '../interfaces/financial-agent.interface';

/**
 * Serviço que orquestra múltiplos agentes especializados
 * Executa análises em paralelo e consolida resultados
 */
@Injectable()
export class MultiAgentAnalysisService {
  private readonly logger = new Logger(MultiAgentAnalysisService.name);

  private agents: {
    fundamental: FundamentalAnalystAgent;
    technical: TechnicalAnalystAgent;
    sentiment: SentimentAnalystAgent;
    risk: RiskAnalystAgent;
    macro: MacroAnalystAgent;
  };

  constructor(private configService: ConfigService) {
    // Inicializar todos os agentes
    this.agents = {
      fundamental: new FundamentalAnalystAgent(configService),
      technical: new TechnicalAnalystAgent(configService),
      sentiment: new SentimentAnalystAgent(configService),
      risk: new RiskAnalystAgent(configService),
      macro: new MacroAnalystAgent(configService),
    };
  }

  /**
   * Executa análise completa com todos os agentes aplicáveis
   */
  async analyzeComplete(context: AnalysisContext): Promise<MultiAgentAnalysis> {
    const ticker = context.ticker;
    this.logger.log(`Starting multi-agent analysis for ${ticker}`);

    const startTime = Date.now();

    // Executar agentes em paralelo (apenas os que podem analisar)
    const agentPromises: Promise<{ name: string; result: AgentResponse | null }>[] = [];

    // Análise Fundamentalista
    if (this.agents.fundamental.canAnalyze(context)) {
      agentPromises.push(
        this.agents.fundamental
          .analyze(context)
          .then((result) => ({ name: 'fundamental', result }))
          .catch((err) => {
            this.logger.error('Fundamental analysis error:', err);
            return { name: 'fundamental', result: null };
          }),
      );
    }

    // Análise Técnica
    if (this.agents.technical.canAnalyze(context)) {
      agentPromises.push(
        this.agents.technical
          .analyze(context)
          .then((result) => ({ name: 'technical', result }))
          .catch((err) => {
            this.logger.error('Technical analysis error:', err);
            return { name: 'technical', result: null };
          }),
      );
    }

    // Análise de Sentimento
    if (this.agents.sentiment.canAnalyze(context)) {
      agentPromises.push(
        this.agents.sentiment
          .analyze(context)
          .then((result) => ({ name: 'sentiment', result }))
          .catch((err) => {
            this.logger.error('Sentiment analysis error:', err);
            return { name: 'sentiment', result: null };
          }),
      );
    }

    // Análise de Risco
    if (this.agents.risk.canAnalyze(context)) {
      agentPromises.push(
        this.agents.risk
          .analyze(context)
          .then((result) => ({ name: 'risk', result }))
          .catch((err) => {
            this.logger.error('Risk analysis error:', err);
            return { name: 'risk', result: null };
          }),
      );
    }

    // Análise Macro
    if (this.agents.macro.canAnalyze(context)) {
      agentPromises.push(
        this.agents.macro
          .analyze(context)
          .then((result) => ({ name: 'macro', result }))
          .catch((err) => {
            this.logger.error('Macro analysis error:', err);
            return { name: 'macro', result: null };
          }),
      );
    }

    // Executar todos em paralelo
    const results = await Promise.all(agentPromises);

    // Organizar resultados
    const agentResults: { [key: string]: AgentResponse } = {};
    results.forEach(({ name, result }) => {
      if (result) {
        agentResults[name] = result;
      }
    });

    // Calcular consenso
    const consensus = this.calculateConsensus(agentResults);

    // Gerar summary consolidado
    const summary = await this.generateConsolidatedSummary(ticker, agentResults, consensus);

    const duration = Date.now() - startTime;
    this.logger.log(`Multi-agent analysis completed in ${duration}ms`);

    return {
      ticker,
      timestamp: new Date(),
      agents: agentResults,
      consensus,
      summary,
    };
  }

  /**
   * Calcula consenso entre os agentes
   */
  private calculateConsensus(agents: { [key: string]: AgentResponse }):
    | {
        recommendation: 'BUY' | 'HOLD' | 'SELL';
        confidence: number;
        agreement: number;
      }
    | undefined {
    const recommendations: { [key: string]: number } = {
      BUY: 0,
      HOLD: 0,
      SELL: 0,
    };

    let totalConfidence = 0;
    let count = 0;

    // Votos ponderados por confiança
    Object.values(agents).forEach((result) => {
      if (result.recommendation) {
        recommendations[result.recommendation] += result.confidence;
        totalConfidence += result.confidence;
        count++;
      }
    });

    if (count === 0) {
      return undefined;
    }

    // Recomendação com maior score
    const sortedRecs = Object.entries(recommendations).sort(([, a], [, b]) => b - a);

    const topRecommendation = sortedRecs[0][0] as 'BUY' | 'HOLD' | 'SELL';
    const topScore = sortedRecs[0][1];
    const secondScore = sortedRecs[1]?.[1] || 0;

    // Nível de acordo: quão unânimes são os agentes
    const agreement = topScore / totalConfidence;

    // Confiança final considerando o acordo
    const confidenceMultiplier = agreement > 0.7 ? 1.0 : agreement > 0.5 ? 0.8 : 0.6;
    const finalConfidence = (topScore / count) * confidenceMultiplier;

    return {
      recommendation: topRecommendation,
      confidence: Math.min(finalConfidence, 1.0),
      agreement,
    };
  }

  /**
   * Gera resumo consolidado das análises
   */
  private async generateConsolidatedSummary(
    ticker: string,
    agents: { [key: string]: AgentResponse },
    consensus: any,
  ): Promise<string> {
    const parts: string[] = [];

    parts.push(`=== ANÁLISE MULTI-AGENTE: ${ticker} ===\n`);

    // Consenso
    if (consensus) {
      parts.push(`🎯 RECOMENDAÇÃO CONSOLIDADA: ${consensus.recommendation}`);
      parts.push(`   Confiança: ${(consensus.confidence * 100).toFixed(0)}%`);
      parts.push(`   Acordo entre agentes: ${(consensus.agreement * 100).toFixed(0)}%\n`);
    }

    // Resumo de cada agente
    Object.entries(agents).forEach(([name, result]) => {
      const emoji =
        {
          fundamental: '📊',
          technical: '📈',
          sentiment: '💭',
          risk: '⚠️',
          macro: '🌍',
        }[name] || '🤖';

      parts.push(
        `${emoji} ${name.toUpperCase()}: ${result.recommendation || 'N/A'} (${(result.confidence * 100).toFixed(0)}%)`,
      );

      // Principais sinais
      if (result.signals && result.signals.length > 0) {
        const topSignals = result.signals.slice(0, 2);
        topSignals.forEach((signal) => {
          parts.push(`   • ${signal.reason}`);
        });
      }

      parts.push('');
    });

    // Alertas importantes
    const criticalSignals = Object.values(agents)
      .flatMap((a) => a.signals || [])
      .filter((s) => s.priority === 'CRITICAL');

    if (criticalSignals.length > 0) {
      parts.push('🚨 ALERTAS CRÍTICOS:');
      criticalSignals.forEach((signal) => {
        parts.push(`   • ${signal.reason}`);
      });
    }

    return parts.join('\n');
  }

  /**
   * Análise rápida (apenas agentes essenciais)
   */
  async analyzeQuick(context: AnalysisContext): Promise<MultiAgentAnalysis> {
    const ticker = context.ticker;

    // Apenas fundamental e técnico
    const results = await Promise.all([
      this.agents.fundamental.canAnalyze(context) ? this.agents.fundamental.analyze(context) : null,
      this.agents.technical.canAnalyze(context) ? this.agents.technical.analyze(context) : null,
    ]);

    const agentResults: { [key: string]: AgentResponse } = {};
    if (results[0]) agentResults['fundamental'] = results[0];
    if (results[1]) agentResults['technical'] = results[1];

    const consensus = this.calculateConsensus(agentResults);
    const summary = await this.generateConsolidatedSummary(ticker, agentResults, consensus);

    return {
      ticker,
      timestamp: new Date(),
      agents: agentResults,
      consensus,
      summary,
    };
  }
}
