import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  News,
  NewsAnalysis,
  SentimentConsensus,
  SentimentLabel,
  AIProvider,
  NewsAnalysisStatus,
} from '../../../database/entities';

/**
 * Peso de cada provider baseado em performance histórica
 * Ajustar conforme dados reais de acurácia
 */
const PROVIDER_WEIGHTS: Record<AIProvider, number> = {
  [AIProvider.CHATGPT]: 1.2, // GPT-5 - Alta precisão
  [AIProvider.CLAUDE]: 1.3, // Claude Sonnet 4.5 - Menor alucinação
  [AIProvider.GEMINI]: 1.0, // Gemini 2.5 Pro - Baseline
  [AIProvider.DEEPSEEK]: 1.1, // DeepSeek V3.2 - Boa performance
  [AIProvider.GROK]: 0.9, // Grok 4.1 - Novo, menos validado
  [AIProvider.PERPLEXITY]: 0.95, // Sonar Pro - Web-grounded
};

/**
 * Mínimo de providers necessários para consenso válido
 */
const MIN_PROVIDERS_FOR_CONSENSUS = 3;

/**
 * Threshold de concordância para alta confiança
 */
const HIGH_CONFIDENCE_THRESHOLD = 0.7;

/**
 * Configuração para detecção de outliers
 */
const OUTLIER_THRESHOLD = 0.5; // Diferença maior que 0.5 do score é outlier

/**
 * FASE 75.4: Consensus Service
 *
 * Realiza cross-validation de análises de múltiplos providers:
 * - Calcula média ponderada de sentimentos
 * - Detecta e exclui outliers
 * - Determina nível de concordância
 * - Gera label de sentimento final
 */
@Injectable()
export class ConsensusService {
  private readonly logger = new Logger(ConsensusService.name);

  constructor(
    @InjectRepository(NewsAnalysis)
    private readonly newsAnalysisRepository: Repository<NewsAnalysis>,
    @InjectRepository(SentimentConsensus)
    private readonly consensusRepository: Repository<SentimentConsensus>,
    @InjectRepository(News)
    private readonly newsRepository: Repository<News>,
  ) {}

  /**
   * Calcula consenso para uma notícia
   */
  async calculateConsensus(newsId: string): Promise<SentimentConsensus | null> {
    const startTime = Date.now();

    // Buscar todas as análises completadas
    const analyses = await this.newsAnalysisRepository.find({
      where: { newsId, status: NewsAnalysisStatus.COMPLETED },
    });

    if (analyses.length < MIN_PROVIDERS_FOR_CONSENSUS) {
      this.logger.warn(
        `Not enough analyses for news ${newsId}: ${analyses.length}/${MIN_PROVIDERS_FOR_CONSENSUS}`,
      );
      return null;
    }

    // Detectar e remover outliers
    const { validAnalyses, outliers } = this.detectOutliers(analyses);

    if (validAnalyses.length < MIN_PROVIDERS_FOR_CONSENSUS) {
      this.logger.warn(
        `Not enough valid analyses after outlier removal for news ${newsId}`,
      );
      return null;
    }

    // Calcular média ponderada
    const { weightedScore, totalWeight } = this.calculateWeightedScore(validAnalyses);

    // Calcular concordância
    const { agreementCount, agreementScore } = this.calculateAgreement(validAnalyses, weightedScore);

    // Determinar label
    const sentimentLabel = this.scoreToLabel(weightedScore);

    // Calcular score de confiança
    const confidenceScore = this.calculateConfidenceScore(
      validAnalyses,
      agreementScore,
      outliers.length,
    );

    // Calcular desvio padrão
    const scores = validAnalyses.map(a => a.sentimentScore);
    const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const standardDeviation = Math.sqrt(
      scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length,
    );

    // Construir detalhes do consenso conforme interface ConsensusDetails
    const consensusDetails = {
      providers: validAnalyses.map(a => ({
        name: a.provider,
        score: a.sentimentScore,
        confidence: a.confidence,
        weight: PROVIDER_WEIGHTS[a.provider],
        agreed: Math.abs(a.sentimentScore - weightedScore) <= 0.3,
        isOutlier: false,
      })),
      outliers: outliers.map(a => a.provider), // string[] de provider names
      methodology: 'weighted_average' as const,
      standardDeviation,
      agreementThreshold: 0.3,
    };

    // Verificar se já existe consenso
    let consensus = await this.consensusRepository.findOne({ where: { newsId } });

    if (consensus) {
      // Atualizar existente
      consensus.finalSentiment = weightedScore;
      consensus.sentimentLabel = sentimentLabel;
      consensus.confidenceScore = confidenceScore;
      consensus.providersCount = validAnalyses.length;
      consensus.agreementCount = agreementCount;
      consensus.outliersCount = outliers.length;
      consensus.consensusDetails = consensusDetails;
      consensus.isHighConfidence = confidenceScore >= HIGH_CONFIDENCE_THRESHOLD && validAnalyses.length >= 3;
      consensus.processingTime = Date.now() - startTime;
    } else {
      // Criar novo
      consensus = this.consensusRepository.create({
        newsId,
        finalSentiment: weightedScore,
        sentimentLabel,
        confidenceScore,
        providersCount: validAnalyses.length,
        agreementCount,
        outliersCount: outliers.length,
        consensusDetails,
        isHighConfidence: confidenceScore >= HIGH_CONFIDENCE_THRESHOLD && validAnalyses.length >= 3,
        processingTime: Date.now() - startTime,
      });
    }

    const saved = await this.consensusRepository.save(consensus);

    // Atualizar flag na notícia
    await this.newsRepository.update(newsId, { isAnalyzed: true });

    this.logger.log(
      `Consensus calculated for news ${newsId}: ${sentimentLabel} (${weightedScore.toFixed(3)}) ` +
      `with ${validAnalyses.length} providers, confidence ${confidenceScore.toFixed(2)}`,
    );

    return saved;
  }

  /**
   * Detecta outliers usando desvio da mediana
   */
  private detectOutliers(analyses: NewsAnalysis[]): {
    validAnalyses: NewsAnalysis[];
    outliers: NewsAnalysis[];
  } {
    if (analyses.length <= 2) {
      return { validAnalyses: analyses, outliers: [] };
    }

    // Calcular mediana
    const scores = analyses.map(a => a.sentimentScore).sort((a, b) => a - b);
    const median = scores.length % 2 === 0
      ? (scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2
      : scores[Math.floor(scores.length / 2)];

    const validAnalyses: NewsAnalysis[] = [];
    const outliers: NewsAnalysis[] = [];

    for (const analysis of analyses) {
      const deviation = Math.abs(analysis.sentimentScore - median);
      if (deviation > OUTLIER_THRESHOLD) {
        outliers.push(analysis);
      } else {
        validAnalyses.push(analysis);
      }
    }

    return { validAnalyses, outliers };
  }

  /**
   * Calcula média ponderada dos scores
   */
  private calculateWeightedScore(analyses: NewsAnalysis[]): {
    weightedScore: number;
    totalWeight: number;
  } {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const analysis of analyses) {
      const weight = PROVIDER_WEIGHTS[analysis.provider] * analysis.confidence;
      weightedSum += analysis.sentimentScore * weight;
      totalWeight += weight;
    }

    const weightedScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

    return { weightedScore, totalWeight };
  }

  /**
   * Calcula nível de concordância entre providers
   */
  private calculateAgreement(
    analyses: NewsAnalysis[],
    weightedScore: number,
  ): { agreementCount: number; agreementScore: number } {
    const agreementThreshold = 0.3; // Dentro de 0.3 pontos

    let agreementCount = 0;
    for (const analysis of analyses) {
      if (Math.abs(analysis.sentimentScore - weightedScore) <= agreementThreshold) {
        agreementCount++;
      }
    }

    const agreementScore = analyses.length > 0 ? agreementCount / analyses.length : 0;

    return { agreementCount, agreementScore };
  }

  /**
   * Calcula score de confiança final
   */
  private calculateConfidenceScore(
    analyses: NewsAnalysis[],
    agreementScore: number,
    outlierCount: number,
  ): number {
    // Média das confiançãs individuais
    const avgConfidence = analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length;

    // Penalidade por outliers
    const outlierPenalty = outlierCount * 0.1;

    // Bônus por concordância
    const agreementBonus = agreementScore * 0.2;

    // Bônus por número de providers
    const providerBonus = Math.min(analyses.length / 6, 1) * 0.1;

    const confidence = Math.max(
      0,
      Math.min(1, avgConfidence + agreementBonus + providerBonus - outlierPenalty),
    );

    return confidence;
  }

  /**
   * Converte score numérico para label
   */
  private scoreToLabel(score: number): SentimentLabel {
    if (score >= 0.6) return SentimentLabel.VERY_BULLISH;
    if (score >= 0.3) return SentimentLabel.BULLISH;
    if (score >= 0.1) return SentimentLabel.SLIGHTLY_BULLISH;
    if (score >= -0.1) return SentimentLabel.NEUTRAL;
    if (score >= -0.3) return SentimentLabel.SLIGHTLY_BEARISH;
    if (score >= -0.6) return SentimentLabel.BEARISH;
    return SentimentLabel.VERY_BEARISH;
  }

  /**
   * Recalcula todos os consensos pendentes
   */
  async recalculateAllPending(): Promise<{ processed: number; errors: number }> {
    // Buscar notícias com análises mas sem consenso
    const newsWithoutConsensus = await this.newsRepository
      .createQueryBuilder('news')
      .leftJoin('news_analysis', 'na', 'na.news_id = news.id')
      .leftJoin('sentiment_consensus', 'sc', 'sc.news_id = news.id')
      .where('na.status = :status', { status: NewsAnalysisStatus.COMPLETED })
      .andWhere('sc.id IS NULL')
      .groupBy('news.id')
      .having('COUNT(na.id) >= :minProviders', { minProviders: MIN_PROVIDERS_FOR_CONSENSUS })
      .getMany();

    let processed = 0;
    let errors = 0;

    for (const news of newsWithoutConsensus) {
      try {
        await this.calculateConsensus(news.id);
        processed++;
      } catch (error) {
        this.logger.error(`Error calculating consensus for news ${news.id}: ${error.message}`);
        errors++;
      }
    }

    return { processed, errors };
  }

  /**
   * Retorna estatísticas de consenso
   */
  async getConsensusStats(): Promise<{
    total: number;
    highConfidence: number;
    byLabel: Record<SentimentLabel, number>;
    avgProvidersCount: number;
  }> {
    const all = await this.consensusRepository.find();

    const byLabel = {} as Record<SentimentLabel, number>;
    for (const label of Object.values(SentimentLabel)) {
      byLabel[label] = 0;
    }

    let totalProviders = 0;
    let highConfidenceCount = 0;

    for (const consensus of all) {
      byLabel[consensus.sentimentLabel]++;
      totalProviders += consensus.providersCount;
      if (consensus.isHighConfidence) highConfidenceCount++;
    }

    return {
      total: all.length,
      highConfidence: highConfidenceCount,
      byLabel,
      avgProvidersCount: all.length > 0 ? totalProviders / all.length : 0,
    };
  }
}
