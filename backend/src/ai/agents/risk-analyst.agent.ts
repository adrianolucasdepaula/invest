import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseFinancialAgent } from './base-financial-agent';
import { AgentResponse, AnalysisContext, Signal } from '../interfaces/analysis.types';

/**
 * Agente Analista de Risco
 * Especializado em: Volatilidade, beta, correlações, risco de portfólio
 */
@Injectable()
export class RiskAnalystAgent extends BaseFinancialAgent {
  readonly name = 'Analista de Risco';
  readonly specialty = 'Gestão de risco, volatilidade, correlações';
  readonly version = '1.0.0';

  constructor(configService: ConfigService) {
    super(configService);
  }

  canAnalyze(context: AnalysisContext): boolean {
    return !!(context.stockData && (context.stockData.beta || context.portfolio));
  }

  async analyze(context: AnalysisContext): Promise<AgentResponse> {
    const { ticker, stockData, portfolio } = context;

    const systemPrompt = `Você é um analista de risco especializado em gestão de portfólios.
Avalie: volatilidade, beta, correlações, concentração, risco sistêmico.
Sugira: diversificação, hedge, dimensionamento de posição.`;

    const userPrompt = this.buildRiskPrompt(stockData, portfolio);
    const analysis = await this.callGPT4(systemPrompt, userPrompt);

    return {
      analysis,
      confidence: 0.8,
      signals: this.extractRiskSignals(stockData, portfolio),
      metadata: {
        agent: this.name,
        riskLevel: this.assessRiskLevel(stockData),
      },
      timestamp: new Date(),
    };
  }

  private buildRiskPrompt(stockData: any, portfolio: any): string {
    const parts = [`Avalie o risco de ${stockData.ticker}:`];

    if (stockData.beta) parts.push(`Beta: ${stockData.beta.toFixed(2)}`);
    if (portfolio) {
      parts.push(`\nPortfólio: ${portfolio.positions.length} posições`);
      parts.push(`Volatilidade: ${portfolio.volatility}%`);
      if (portfolio.concentration) {
        parts.push(`\nConcentração por setor:`);
        Object.entries(portfolio.concentration).forEach(([sector, pct]: any) => {
          parts.push(`- ${sector}: ${(pct * 100).toFixed(1)}%`);
        });
      }
    }

    return parts.join('\n');
  }

  private extractRiskSignals(stockData: any, portfolio: any): Signal[] {
    const signals: Signal[] = [];

    if (stockData.beta && stockData.beta > 1.5) {
      signals.push({
        type: 'WARNING',
        strength: 0.7,
        reason: `Beta alto (${stockData.beta.toFixed(2)}) - Alta volatilidade`,
        priority: 'HIGH',
      });
    }

    if (portfolio?.concentration) {
      const maxConcentration = Math.max(...Object.values(portfolio.concentration) as number[]);
      if (maxConcentration > 0.4) {
        signals.push({
          type: 'WARNING',
          strength: 0.8,
          reason: `Concentração excessiva em um setor (${(maxConcentration * 100).toFixed(0)}%)`,
          priority: 'CRITICAL',
        });
      }
    }

    return signals;
  }

  private assessRiskLevel(stockData: any): string {
    if (!stockData.beta) return 'UNKNOWN';
    if (stockData.beta > 1.5) return 'HIGH';
    if (stockData.beta > 1.0) return 'MODERATE';
    return 'LOW';
  }
}
