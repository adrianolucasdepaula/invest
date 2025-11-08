import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseFinancialAgent } from './base-financial-agent';
import { AgentResponse, AnalysisContext, Signal } from '../interfaces/analysis.types';

/**
 * Agente Analista Fundamentalista
 * Especializado em: Valuation, indicadores financeiros, balanços, P/L, ROE, etc.
 */
@Injectable()
export class FundamentalAnalystAgent extends BaseFinancialAgent {
  readonly name = 'Analista Fundamentalista';
  readonly specialty = 'Valuation, balanços patrimoniais, indicadores financeiros';
  readonly version = '1.0.0';

  constructor(configService: ConfigService) {
    super(configService);
  }

  canAnalyze(context: AnalysisContext): boolean {
    const { stockData } = context;

    // Precisa de pelo menos alguns indicadores fundamentalistas
    return !!(
      stockData &&
      (stockData.pe ||
        stockData.roe ||
        stockData.dividendYield ||
        stockData.debtToEquity)
    );
  }

  async analyze(context: AnalysisContext): Promise<AgentResponse> {
    const { ticker, stockData } = context;

    const systemPrompt = `Você é um analista fundamentalista experiente, especializado em análise de ações brasileiras da B3.
Seu foco é avaliar empresas através de:
- Múltiplos de valuation (P/L, P/VP, EV/EBITDA)
- Indicadores de rentabilidade (ROE, ROA, Margem Líquida)
- Indicadores de endividamento (Dívida/Patrimônio, Dívida/EBITDA)
- Dividend Yield e política de dividendos
- Qualidade dos balanços patrimoniais

Você deve ser:
- Objetivo e baseado em números
- Comparar com médias do setor
- Identificar pontos fortes e fracos
- Avaliar se a empresa está cara ou barata
- Fornecer recomendação clara: COMPRA, MANTER ou VENDA

Seja direto e use linguagem técnica mas acessível.`;

    const userPrompt = this.buildFundamentalPrompt(stockData);

    const analysis = await this.callGPT4(systemPrompt, userPrompt);

    // Extrair sinais da análise
    const signals = this.extractFundamentalSignals(stockData);

    return {
      analysis,
      confidence: this.calculateFundamentalConfidence(stockData),
      recommendation: this.extractRecommendation(analysis),
      signals,
      metadata: {
        agent: this.name,
        specialty: this.specialty,
        version: this.version,
        indicators: this.getAvailableIndicators(stockData),
      },
      timestamp: new Date(),
    };
  }

  private buildFundamentalPrompt(stockData: any): string {
    const parts: string[] = [];

    parts.push('Analise fundamentalistamente a seguinte ação:');
    parts.push('');
    parts.push(this.formatStockData(stockData));
    parts.push('');
    parts.push('Indicadores Fundamentalistas:');

    if (stockData.pe !== undefined) {
      parts.push(`- P/L (Price/Earnings): ${stockData.pe.toFixed(2)}`);
    }

    if (stockData.priceToBook !== undefined) {
      parts.push(`- P/VP (Price/Book Value): ${stockData.priceToBook.toFixed(2)}`);
    }

    if (stockData.roe !== undefined) {
      parts.push(`- ROE (Return on Equity): ${stockData.roe.toFixed(2)}%`);
    }

    if (stockData.dividendYield !== undefined) {
      parts.push(`- Dividend Yield: ${stockData.dividendYield.toFixed(2)}%`);
    }

    if (stockData.debtToEquity !== undefined) {
      parts.push(`- Dívida/Patrimônio: ${stockData.debtToEquity.toFixed(2)}`);
    }

    if (stockData.eps !== undefined) {
      parts.push(`- LPA (Lucro por Ação): R$ ${stockData.eps.toFixed(2)}`);
    }

    parts.push('');
    parts.push('Forneça uma análise fundamentalista completa:');
    parts.push('1. Avaliação de valuation (cara, justa ou barata?)');
    parts.push('2. Qualidade dos indicadores de rentabilidade');
    parts.push('3. Nível de endividamento');
    parts.push('4. Política de dividendos');
    parts.push('5. Recomendação final: COMPRA, MANTER ou VENDA');
    parts.push('6. Preço-alvo estimado');

    return parts.join('\n');
  }

  private extractFundamentalSignals(stockData: any): Signal[] {
    const signals: Signal[] = [];

    // Sinal baseado em P/L
    if (stockData.pe !== undefined) {
      if (stockData.pe < 10) {
        signals.push({
          type: 'BUY',
          strength: 0.7,
          reason: `P/L baixo (${stockData.pe.toFixed(2)}) - Potencial subavaliação`,
          priority: 'HIGH',
        });
      } else if (stockData.pe > 30) {
        signals.push({
          type: 'SELL',
          strength: 0.6,
          reason: `P/L alto (${stockData.pe.toFixed(2)}) - Possível sobreavaliação`,
          priority: 'MEDIUM',
        });
      }
    }

    // Sinal baseado em ROE
    if (stockData.roe !== undefined) {
      if (stockData.roe > 15) {
        signals.push({
          type: 'BUY',
          strength: 0.8,
          reason: `ROE excelente (${stockData.roe.toFixed(2)}%) - Alta rentabilidade`,
          priority: 'HIGH',
        });
      } else if (stockData.roe < 5) {
        signals.push({
          type: 'WARNING',
          strength: 0.7,
          reason: `ROE baixo (${stockData.roe.toFixed(2)}%) - Rentabilidade fraca`,
          priority: 'HIGH',
        });
      }
    }

    // Sinal baseado em Dividend Yield
    if (stockData.dividendYield !== undefined && stockData.dividendYield > 6) {
      signals.push({
        type: 'BUY',
        strength: 0.6,
        reason: `Dividend Yield atrativo (${stockData.dividendYield.toFixed(2)}%)`,
        priority: 'MEDIUM',
      });
    }

    // Sinal baseado em endividamento
    if (stockData.debtToEquity !== undefined) {
      if (stockData.debtToEquity > 2) {
        signals.push({
          type: 'WARNING',
          strength: 0.8,
          reason: `Endividamento alto (${stockData.debtToEquity.toFixed(2)}) - Risco financeiro`,
          priority: 'HIGH',
        });
      } else if (stockData.debtToEquity < 0.5) {
        signals.push({
          type: 'BUY',
          strength: 0.5,
          reason: `Endividamento baixo (${stockData.debtToEquity.toFixed(2)}) - Balanço saudável`,
          priority: 'MEDIUM',
        });
      }
    }

    return signals;
  }

  private calculateFundamentalConfidence(stockData: any): number {
    let confidence = this.getBaseConfidence();
    let indicatorCount = 0;

    // Quanto mais indicadores disponíveis, maior a confiança
    const indicators = ['pe', 'roe', 'dividendYield', 'debtToEquity', 'priceToBook', 'eps'];

    for (const indicator of indicators) {
      if (stockData[indicator] !== undefined) {
        indicatorCount++;
      }
    }

    // Ajusta confiança baseado na quantidade de dados
    if (indicatorCount >= 5) {
      confidence = Math.min(0.95, confidence + 0.15);
    } else if (indicatorCount >= 3) {
      confidence = Math.min(0.85, confidence + 0.05);
    } else if (indicatorCount < 2) {
      confidence = Math.max(0.5, confidence - 0.15);
    }

    return confidence;
  }

  private getAvailableIndicators(stockData: any): string[] {
    const indicators: string[] = [];

    if (stockData.pe !== undefined) indicators.push('P/L');
    if (stockData.priceToBook !== undefined) indicators.push('P/VP');
    if (stockData.roe !== undefined) indicators.push('ROE');
    if (stockData.dividendYield !== undefined) indicators.push('Dividend Yield');
    if (stockData.debtToEquity !== undefined) indicators.push('Dívida/Patrimônio');
    if (stockData.eps !== undefined) indicators.push('LPA');

    return indicators;
  }
}
