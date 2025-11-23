import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseFinancialAgent } from './base-financial-agent';
import { AgentResponse, AnalysisContext, Signal } from '../interfaces/analysis.types';

/**
 * Agente Analista Técnico
 * Especializado em: Gráficos, indicadores técnicos, tendências, suporte/resistência
 */
@Injectable()
export class TechnicalAnalystAgent extends BaseFinancialAgent {
  readonly name = 'Analista Técnico';
  readonly specialty = 'Análise técnica, gráficos, tendências, padrões';
  readonly version = '1.0.0';

  constructor(configService: ConfigService) {
    super(configService);
  }

  canAnalyze(context: AnalysisContext): boolean {
    const { stockData } = context;

    // Precisa de pelo menos alguns indicadores técnicos
    return !!(stockData && (stockData.rsi || stockData.macd || stockData.sma20 || stockData.sma50));
  }

  async analyze(context: AnalysisContext): Promise<AgentResponse> {
    const { stockData } = context;

    const systemPrompt = `Você é um analista técnico profissional, especializado em análise gráfica e indicadores técnicos.
Seu foco é identificar:
- Tendências (alta, baixa, lateral)
- Níveis de suporte e resistência
- Padrões gráficos (triângulos, candles, etc)
- Indicadores técnicos (RSI, MACD, Médias Móveis, Bollinger Bands)
- Sinais de compra e venda
- Volume e momentum

Você deve ser:
- Objetivo e baseado em dados técnicos
- Identificar pontos de entrada e saída
- Avaliar força da tendência
- Considerar múltiplos timeframes
- Fornecer recomendação clara: COMPRA, MANTER ou VENDA

Use terminologia técnica mas explique os conceitos.`;

    const userPrompt = this.buildTechnicalPrompt(stockData);

    const analysis = await this.callGPT4(systemPrompt, userPrompt);

    // Extrair sinais da análise
    const signals = this.extractTechnicalSignals(stockData);

    return {
      analysis,
      confidence: this.calculateTechnicalConfidence(stockData),
      recommendation: this.extractRecommendation(analysis),
      signals,
      metadata: {
        agent: this.name,
        specialty: this.specialty,
        version: this.version,
        indicators: this.getAvailableIndicators(stockData),
        trend: this.identifyTrend(stockData),
      },
      timestamp: new Date(),
    };
  }

  private buildTechnicalPrompt(stockData: any): string {
    const parts: string[] = [];

    parts.push('Analise tecnicamente a seguinte ação:');
    parts.push('');
    parts.push(this.formatStockData(stockData));
    parts.push('');
    parts.push('Indicadores Técnicos:');

    if (stockData.rsi !== undefined) {
      parts.push(`- RSI (14): ${stockData.rsi.toFixed(2)}`);
      if (stockData.rsi > 70) parts.push('  → Zona de sobrecompra');
      else if (stockData.rsi < 30) parts.push('  → Zona de sobrevenda');
    }

    if (stockData.macd) {
      parts.push(`- MACD: ${stockData.macd.value.toFixed(4)}`);
      parts.push(`- MACD Signal: ${stockData.macd.signal.toFixed(4)}`);
      parts.push(`- MACD Histogram: ${stockData.macd.histogram.toFixed(4)}`);

      if (stockData.macd.histogram > 0) {
        parts.push('  → MACD positivo (tendência de alta)');
      } else {
        parts.push('  → MACD negativo (tendência de baixa)');
      }
    }

    if (stockData.sma20) {
      parts.push(`- SMA 20: R$ ${stockData.sma20.toFixed(2)}`);
      if (stockData.price > stockData.sma20) {
        parts.push('  → Preço acima da média de 20 dias');
      } else {
        parts.push('  → Preço abaixo da média de 20 dias');
      }
    }

    if (stockData.sma50) {
      parts.push(`- SMA 50: R$ ${stockData.sma50.toFixed(2)}`);
    }

    if (stockData.sma200) {
      parts.push(`- SMA 200: R$ ${stockData.sma200.toFixed(2)}`);
    }

    if (stockData.bollingerBands) {
      parts.push('\nBollinger Bands:');
      parts.push(`- Banda Superior: R$ ${stockData.bollingerBands.upper.toFixed(2)}`);
      parts.push(`- Banda Média: R$ ${stockData.bollingerBands.middle.toFixed(2)}`);
      parts.push(`- Banda Inferior: R$ ${stockData.bollingerBands.lower.toFixed(2)}`);
    }

    parts.push('');
    parts.push('Forneça uma análise técnica completa:');
    parts.push('1. Tendência atual (alta, baixa ou lateral)');
    parts.push('2. Força da tendência');
    parts.push('3. Níveis de suporte e resistência');
    parts.push('4. Sinais de compra ou venda');
    parts.push('5. Pontos de entrada e saída sugeridos');
    parts.push('6. Recomendação final: COMPRA, MANTER ou VENDA');

    return parts.join('\n');
  }

  private extractTechnicalSignals(stockData: any): Signal[] {
    const signals: Signal[] = [];

    // Sinal baseado em RSI
    if (stockData.rsi !== undefined) {
      if (stockData.rsi < 30) {
        signals.push({
          type: 'BUY',
          strength: 0.8,
          reason: `RSI em sobrevenda (${stockData.rsi.toFixed(2)}) - Possível reversão de alta`,
          priority: 'HIGH',
        });
      } else if (stockData.rsi > 70) {
        signals.push({
          type: 'SELL',
          strength: 0.7,
          reason: `RSI em sobrecompra (${stockData.rsi.toFixed(2)}) - Possível correção`,
          priority: 'MEDIUM',
        });
      } else if (stockData.rsi > 50 && stockData.rsi < 60) {
        signals.push({
          type: 'BUY',
          strength: 0.5,
          reason: 'RSI em zona neutra positiva - Momentum favorável',
          priority: 'LOW',
        });
      }
    }

    // Sinal baseado em MACD
    if (stockData.macd) {
      if (stockData.macd.histogram > 0 && stockData.macd.value > stockData.macd.signal) {
        signals.push({
          type: 'BUY',
          strength: 0.7,
          reason: 'MACD cruzou acima da linha de sinal - Sinal de compra',
          priority: 'HIGH',
        });
      } else if (stockData.macd.histogram < 0 && stockData.macd.value < stockData.macd.signal) {
        signals.push({
          type: 'SELL',
          strength: 0.7,
          reason: 'MACD cruzou abaixo da linha de sinal - Sinal de venda',
          priority: 'HIGH',
        });
      }
    }

    // Sinal baseado em Médias Móveis
    if (stockData.sma20 && stockData.sma50) {
      // Golden Cross (SMA20 > SMA50)
      if (stockData.sma20 > stockData.sma50 * 1.02) {
        signals.push({
          type: 'BUY',
          strength: 0.75,
          reason: 'Golden Cross - Média de 20 dias acima da de 50 dias',
          priority: 'HIGH',
        });
      }
      // Death Cross (SMA20 < SMA50)
      else if (stockData.sma20 < stockData.sma50 * 0.98) {
        signals.push({
          type: 'SELL',
          strength: 0.75,
          reason: 'Death Cross - Média de 20 dias abaixo da de 50 dias',
          priority: 'HIGH',
        });
      }
    }

    // Sinal baseado em posição do preço vs médias
    if (stockData.sma20 && stockData.price) {
      if (stockData.price > stockData.sma20 * 1.05) {
        signals.push({
          type: 'WARNING',
          strength: 0.6,
          reason: 'Preço 5%+ acima da SMA20 - Possível sobreextensão',
          priority: 'MEDIUM',
        });
      } else if (stockData.price < stockData.sma20 * 0.95) {
        signals.push({
          type: 'BUY',
          strength: 0.6,
          reason: 'Preço 5%+ abaixo da SMA20 - Possível oportunidade de compra',
          priority: 'MEDIUM',
        });
      }
    }

    // Sinal baseado em Bollinger Bands
    if (stockData.bollingerBands && stockData.price) {
      if (stockData.price <= stockData.bollingerBands.lower) {
        signals.push({
          type: 'BUY',
          strength: 0.7,
          reason: 'Preço tocou banda inferior de Bollinger - Possível reversão',
          priority: 'HIGH',
        });
      } else if (stockData.price >= stockData.bollingerBands.upper) {
        signals.push({
          type: 'SELL',
          strength: 0.6,
          reason: 'Preço tocou banda superior de Bollinger - Possível correção',
          priority: 'MEDIUM',
        });
      }
    }

    return signals;
  }

  private calculateTechnicalConfidence(stockData: any): number {
    let confidence = this.getBaseConfidence();
    let indicatorCount = 0;

    // Quanto mais indicadores disponíveis, maior a confiança
    const indicators = ['rsi', 'macd', 'sma20', 'sma50', 'sma200', 'bollingerBands'];

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

  private identifyTrend(stockData: any): string {
    // Identificar tendência baseado em médias móveis
    if (stockData.sma20 && stockData.sma50 && stockData.sma200) {
      if (stockData.sma20 > stockData.sma50 && stockData.sma50 > stockData.sma200) {
        return 'UPTREND_STRONG'; // Tendência de alta forte
      } else if (stockData.sma20 < stockData.sma50 && stockData.sma50 < stockData.sma200) {
        return 'DOWNTREND_STRONG'; // Tendência de baixa forte
      }
    }

    if (stockData.sma20 && stockData.sma50) {
      if (stockData.sma20 > stockData.sma50) {
        return 'UPTREND'; // Tendência de alta
      } else if (stockData.sma20 < stockData.sma50) {
        return 'DOWNTREND'; // Tendência de baixa
      }
    }

    return 'SIDEWAYS'; // Lateral
  }

  private getAvailableIndicators(stockData: any): string[] {
    const indicators: string[] = [];

    if (stockData.rsi !== undefined) indicators.push('RSI');
    if (stockData.macd !== undefined) indicators.push('MACD');
    if (stockData.sma20 !== undefined) indicators.push('SMA20');
    if (stockData.sma50 !== undefined) indicators.push('SMA50');
    if (stockData.sma200 !== undefined) indicators.push('SMA200');
    if (stockData.bollingerBands !== undefined) indicators.push('Bollinger Bands');

    return indicators;
  }
}
