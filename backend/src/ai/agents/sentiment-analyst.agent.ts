import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseFinancialAgent } from './base-financial-agent';
import { AgentResponse, AnalysisContext, Signal } from '../interfaces/analysis.types';

/**
 * Agente Analista de Sentimento
 * Especializado em: Notícias, redes sociais, sentiment analysis, eventos corporativos
 */
@Injectable()
export class SentimentAnalystAgent extends BaseFinancialAgent {
  readonly name = 'Analista de Sentimento';
  readonly specialty = 'Análise de notícias, sentimento de mercado, eventos';
  readonly version = '1.0.0';

  constructor(configService: ConfigService) {
    super(configService);
  }

  canAnalyze(context: AnalysisContext): boolean {
    return !!(context.news && context.news.length > 0);
  }

  async analyze(context: AnalysisContext): Promise<AgentResponse> {
    const { stockData, news } = context;

    const systemPrompt = `Você é um analista de sentimento de mercado especializado em notícias financeiras.
Analise o sentimento (positivo, neutro, negativo) de notícias e eventos relacionados à empresa.
Identifique: temas recorrentes, eventos relevantes, percepção do mercado.
Forneça recomendação baseada no sentimento geral.`;

    const userPrompt = this.buildSentimentPrompt(stockData, news);
    const analysis = await this.callGPT4(systemPrompt, userPrompt);

    return {
      analysis,
      confidence: news.length >= 5 ? 0.8 : 0.6,
      recommendation: this.extractRecommendation(analysis),
      signals: this.extractSentimentSignals(news),
      metadata: {
        agent: this.name,
        newsCount: news.length,
        sentiment: this.aggregateSentiment(news),
      },
      timestamp: new Date(),
    };
  }

  private buildSentimentPrompt(stockData: any, news: any[]): string {
    const parts = [`Analise o sentimento das notícias sobre ${stockData.ticker}:`];

    news.slice(0, 10).forEach((item, i) => {
      parts.push(`\n${i + 1}. ${item.headline}`);
      if (item.summary) parts.push(`   ${item.summary}`);
    });

    parts.push('\nAvalie: sentimento geral, temas principais, impacto no preço.');
    return parts.join('\n');
  }

  private extractSentimentSignals(news: any[]): Signal[] {
    const sentiment = this.aggregateSentiment(news);
    const signals: Signal[] = [];

    if (sentiment.positive > 0.6) {
      signals.push({
        type: 'BUY',
        strength: 0.6,
        reason: `Sentimento predominantemente positivo (${(sentiment.positive * 100).toFixed(0)}%)`,
        priority: 'MEDIUM',
      });
    } else if (sentiment.negative > 0.6) {
      signals.push({
        type: 'SELL',
        strength: 0.6,
        reason: `Sentimento predominantemente negativo (${(sentiment.negative * 100).toFixed(0)}%)`,
        priority: 'MEDIUM',
      });
    }

    return signals;
  }

  private aggregateSentiment(news: any[]): { positive: number; neutral: number; negative: number } {
    const counts = { positive: 0, neutral: 0, negative: 0 };

    news.forEach((item) => {
      if (item.sentiment) {
        counts[item.sentiment.toLowerCase()]++;
      } else {
        counts.neutral++;
      }
    });

    const total = news.length;
    return {
      positive: counts.positive / total,
      neutral: counts.neutral / total,
      negative: counts.negative / total,
    };
  }
}
