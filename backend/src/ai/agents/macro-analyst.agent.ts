import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseFinancialAgent } from './base-financial-agent';
import { AgentResponse, AnalysisContext, Signal } from '../interfaces/analysis.types';

/**
 * Agente Analista Macroeconômico
 * Especializado em: Selic, inflação, câmbio, PIB, cenário político
 */
@Injectable()
export class MacroAnalystAgent extends BaseFinancialAgent {
  readonly name = 'Analista Macroeconômico';
  readonly specialty = 'Cenário macro, Selic, inflação, câmbio, política';
  readonly version = '1.0.0';

  constructor(configService: ConfigService) {
    super(configService);
  }

  canAnalyze(context: AnalysisContext): boolean {
    return !!context.macroData;
  }

  async analyze(context: AnalysisContext): Promise<AgentResponse> {
    const { ticker, stockData, macroData } = context;

    const systemPrompt = `Você é um analista macroeconômico especializado no mercado brasileiro.
Avalie: impacto de Selic, inflação, câmbio, PIB no setor/empresa.
Considere: ciclo econômico, políticas monetária/fiscal, cenário político.`;

    const userPrompt = this.buildMacroPrompt(stockData, macroData);
    const analysis = await this.callGPT4(systemPrompt, userPrompt);

    return {
      analysis,
      confidence: 0.75,
      signals: this.extractMacroSignals(macroData, stockData),
      metadata: {
        agent: this.name,
        macroScenario: this.assessMacroScenario(macroData),
      },
      timestamp: new Date(),
    };
  }

  private buildMacroPrompt(stockData: any, macroData: any): string {
    const parts = [
      `Analise o impacto macroeconômico em ${stockData.ticker} (${stockData.sector || 'setor'}):`,
    ];

    if (macroData.selic) parts.push(`Selic: ${macroData.selic.toFixed(2)}%`);
    if (macroData.ipca) parts.push(`IPCA: ${macroData.ipca.toFixed(2)}%`);
    if (macroData.usdBrl) parts.push(`USD/BRL: R$ ${macroData.usdBrl.toFixed(2)}`);
    if (macroData.gdpGrowth)
      parts.push(`PIB: ${macroData.gdpGrowth > 0 ? '+' : ''}${macroData.gdpGrowth.toFixed(2)}%`);

    parts.push('\nAvalie: impacto no setor, perspectivas, riscos macroeconômicos.');
    return parts.join('\n');
  }

  private extractMacroSignals(macroData: any, stockData: any): Signal[] {
    const signals: Signal[] = [];

    // Selic alta = negativo para ações, positivo para bancos
    if (macroData.selic && macroData.selic > 12) {
      if (stockData.sector === 'Financeiro') {
        signals.push({
          type: 'BUY',
          strength: 0.6,
          reason: `Selic alta (${macroData.selic.toFixed(2)}%) favorece setor financeiro`,
          priority: 'MEDIUM',
        });
      } else {
        signals.push({
          type: 'WARNING',
          strength: 0.5,
          reason: `Selic alta (${macroData.selic.toFixed(2)}%) pode pressionar valuation`,
          priority: 'MEDIUM',
        });
      }
    }

    // Câmbio alto = bom para exportadores
    if (macroData.usdBrl && macroData.usdBrl > 5.5) {
      const exportSectors = ['Commodities', 'Mineração', 'Siderurgia'];
      if (exportSectors.includes(stockData.sector)) {
        signals.push({
          type: 'BUY',
          strength: 0.6,
          reason: `Câmbio favorável (R$ ${macroData.usdBrl.toFixed(2)}) para exportadores`,
          priority: 'MEDIUM',
        });
      }
    }

    return signals;
  }

  private assessMacroScenario(macroData: any): string {
    if (macroData.selic > 12 && macroData.ipca > 6) return 'CONTRACIONISTA';
    if (macroData.selic < 8 && macroData.gdpGrowth > 2) return 'EXPANSIONISTA';
    return 'NEUTRO';
  }
}
