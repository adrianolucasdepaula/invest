import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SentimentResult {
  score: number; // -1 (muito negativo) a +1 (muito positivo)
  label: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
  confidence: number; // 0 a 1
  keywords: string[];
}

export interface NewsSentiment {
  ticker: string;
  overallSentiment: SentimentResult;
  articlesAnalyzed: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  sentimentTrend: 'improving' | 'declining' | 'stable';
  topPositiveKeywords: string[];
  topNegativeKeywords: string[];
}

@Injectable()
export class SentimentAnalysisService {
  private readonly logger = new Logger(SentimentAnalysisService.name);
  private readonly openaiApiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
  }

  async analyzeText(text: string): Promise<SentimentResult> {
    try {
      // Análise básica usando palavras-chave (fallback)
      const positiveWords = [
        'lucro',
        'crescimento',
        'alta',
        'ganho',
        'positivo',
        'otimista',
        'valorização',
        'recuperação',
        'expansão',
        'aumento',
        'melhora',
        'recorde',
        'forte',
        'bom',
        'excelente',
        'superou',
        'expectativas',
      ];

      const negativeWords = [
        'prejuízo',
        'queda',
        'perda',
        'negativo',
        'pessimista',
        'desvalorização',
        'crise',
        'redução',
        'diminuição',
        'fraco',
        'ruim',
        'frustrou',
        'decepção',
        'baixa',
        'risco',
        'problema',
        'dificuldade',
      ];

      const textLower = text.toLowerCase();

      let positiveCount = 0;
      let negativeCount = 0;
      const foundKeywords: string[] = [];

      positiveWords.forEach((word) => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = textLower.match(regex);
        if (matches) {
          positiveCount += matches.length;
          if (!foundKeywords.includes(word)) foundKeywords.push(word);
        }
      });

      negativeWords.forEach((word) => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = textLower.match(regex);
        if (matches) {
          negativeCount += matches.length;
          if (!foundKeywords.includes(word)) foundKeywords.push(word);
        }
      });

      const total = positiveCount + negativeCount;
      let score = 0;
      let label: SentimentResult['label'] = 'neutral';

      if (total > 0) {
        score = (positiveCount - negativeCount) / total;

        if (score >= 0.5) label = 'very_positive';
        else if (score >= 0.2) label = 'positive';
        else if (score <= -0.5) label = 'very_negative';
        else if (score <= -0.2) label = 'negative';
        else label = 'neutral';
      }

      const confidence = total > 0 ? Math.min(total / 10, 1) : 0.3;

      return {
        score,
        label,
        confidence,
        keywords: foundKeywords,
      };
    } catch (error) {
      this.logger.error(`Erro na análise de sentimento: ${error.message}`);
      return {
        score: 0,
        label: 'neutral',
        confidence: 0,
        keywords: [],
      };
    }
  }

  async analyzeNews(
    ticker: string,
    articles: Array<{ title: string; snippet?: string; summary?: string }>,
  ): Promise<NewsSentiment> {
    this.logger.log(`Analisando sentimento de ${articles.length} notícias para ${ticker}`);

    const sentiments: SentimentResult[] = [];

    for (const article of articles) {
      const text = `${article.title} ${article.snippet || article.summary || ''}`;
      const sentiment = await this.analyzeText(text);
      sentiments.push(sentiment);
    }

    // Calcular métricas gerais
    const positiveCount = sentiments.filter(
      (s) => s.label === 'positive' || s.label === 'very_positive',
    ).length;
    const negativeCount = sentiments.filter(
      (s) => s.label === 'negative' || s.label === 'very_negative',
    ).length;
    const neutralCount = sentiments.filter((s) => s.label === 'neutral').length;

    const avgScore = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;
    const avgConfidence = sentiments.reduce((sum, s) => sum + s.confidence, 0) / sentiments.length;

    // Determinar tendência (últimas 5 vs primeiras 5)
    let sentimentTrend: NewsSentiment['sentimentTrend'] = 'stable';
    if (sentiments.length >= 10) {
      const recentAvg = sentiments.slice(0, 5).reduce((sum, s) => sum + s.score, 0) / 5;
      const olderAvg = sentiments.slice(5, 10).reduce((sum, s) => sum + s.score, 0) / 5;

      if (recentAvg > olderAvg + 0.2) sentimentTrend = 'improving';
      else if (recentAvg < olderAvg - 0.2) sentimentTrend = 'declining';
    }

    // Agregar keywords
    const allKeywords = sentiments.flatMap((s) => s.keywords);
    const keywordCounts = allKeywords.reduce(
      (acc, keyword) => {
        acc[keyword] = (acc[keyword] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const sortedKeywords = Object.entries(keywordCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([keyword]) => keyword);

    // Separar keywords positivas e negativas
    const positiveKeywords = ['lucro', 'crescimento', 'alta', 'ganho', 'positivo', 'valorização'];
    const negativeKeywords = ['prejuízo', 'queda', 'perda', 'negativo', 'desvalorização', 'crise'];

    const topPositiveKeywords = sortedKeywords
      .filter((k) => positiveKeywords.includes(k))
      .slice(0, 5);
    const topNegativeKeywords = sortedKeywords
      .filter((k) => negativeKeywords.includes(k))
      .slice(0, 5);

    // Determinar label geral
    let overallLabel: SentimentResult['label'] = 'neutral';
    if (avgScore >= 0.5) overallLabel = 'very_positive';
    else if (avgScore >= 0.2) overallLabel = 'positive';
    else if (avgScore <= -0.5) overallLabel = 'very_negative';
    else if (avgScore <= -0.2) overallLabel = 'negative';

    return {
      ticker,
      overallSentiment: {
        score: avgScore,
        label: overallLabel,
        confidence: avgConfidence,
        keywords: sortedKeywords.slice(0, 10),
      },
      articlesAnalyzed: articles.length,
      positiveCount,
      negativeCount,
      neutralCount,
      sentimentTrend,
      topPositiveKeywords,
      topNegativeKeywords,
    };
  }

  getSentimentDescription(sentiment: SentimentResult['label']): string {
    const descriptions = {
      very_positive: 'Muito Positivo - Notícias amplamente favoráveis',
      positive: 'Positivo - Maioria das notícias favoráveis',
      neutral: 'Neutro - Notícias equilibradas ou neutras',
      negative: 'Negativo - Maioria das notícias desfavoráveis',
      very_negative: 'Muito Negativo - Notícias amplamente desfavoráveis',
    };

    return descriptions[sentiment];
  }
}
