import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import {
  News,
  NewsSource,
  NewsAnalysis,
  SentimentConsensus,
  SentimentLabel,
  Asset,
} from '../../database/entities';
import {
  GetNewsQueryDto,
  NewsResponseDto,
  MarketSentimentSummaryDto,
  TickerSentimentSummaryDto,
  CollectNewsDto,
  SentimentSummaryDto,
  SentimentPeriod,
  TimeframeSentimentDto,
  MultiTimeframeSentimentDto,
} from './dto/news.dto';

/**
 * NewsService - FASE 75
 *
 * Gerencia notícias financeiras e análises de sentimento.
 * Suporta 7 fontes de notícias e 6 provedores de IA.
 */
@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);

  // ==================== FASE 76: TIME-WEIGHTED SENTIMENT CONSTANTS ====================

  /**
   * Half-life em dias para cada período (padrão Bloomberg/Reuters)
   * Exponential decay: Weight(t) = 2^(-t/halflife)
   */
  private readonly HALF_LIFE_DAYS: Record<SentimentPeriod, number> = {
    [SentimentPeriod.WEEKLY]: 3.5,      // Notícias >3.5d têm peso <50%
    [SentimentPeriod.MONTHLY]: 14,      // Notícias >14d têm peso <50%
    [SentimentPeriod.QUARTERLY]: 30,    // Ciclo de earnings
    [SentimentPeriod.SEMIANNUAL]: 63,   // ~3 meses
    [SentimentPeriod.ANNUAL]: 90,       // ~3 meses
  };

  /**
   * Range em dias para cada período
   */
  private readonly PERIOD_DAYS: Record<SentimentPeriod, number> = {
    [SentimentPeriod.WEEKLY]: 7,
    [SentimentPeriod.MONTHLY]: 30,
    [SentimentPeriod.QUARTERLY]: 90,
    [SentimentPeriod.SEMIANNUAL]: 180,
    [SentimentPeriod.ANNUAL]: 365,
  };

  /**
   * Peso por tier de fonte (credibilidade)
   * Tier 1 (1.3x): Bloomberg, Valor - fontes primárias
   * Tier 2 (1.1x): InfoMoney, Estadão, Exame - credibilidade média-alta
   * Tier 3 (1.0x): Google News, Investing - agregadores
   * Tier 4 (0.8x): RSS, Other - fontes não verificadas
   */
  private readonly SOURCE_TIER_WEIGHTS: Record<NewsSource, number> = {
    [NewsSource.BLOOMBERG]: 1.3,
    [NewsSource.VALOR_ECONOMICO]: 1.3,
    [NewsSource.INFOMONEY]: 1.1,
    [NewsSource.ESTADAO]: 1.1,
    [NewsSource.EXAME]: 1.1,
    [NewsSource.GOOGLE_NEWS]: 1.0,
    [NewsSource.INVESTING]: 1.0,
    [NewsSource.RSS]: 0.8,
    [NewsSource.OTHER]: 0.8,
  };

  constructor(
    @InjectRepository(News)
    private readonly newsRepository: Repository<News>,
    @InjectRepository(NewsAnalysis)
    private readonly analysisRepository: Repository<NewsAnalysis>,
    @InjectRepository(SentimentConsensus)
    private readonly consensusRepository: Repository<SentimentConsensus>,
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
  ) {}

  /**
   * Busca notícias com filtros
   */
  async findAll(query: GetNewsQueryDto): Promise<{ data: NewsResponseDto[]; total: number }> {
    this.logger.log(`Finding news with filters: ${JSON.stringify(query)}`);

    const where: Record<string, unknown> = {};

    if (query.ticker) {
      where.ticker = query.ticker.toUpperCase();
    }

    if (query.source) {
      where.source = query.source;
    }

    if (query.isAnalyzed !== undefined) {
      where.isAnalyzed = query.isAnalyzed;
    }

    // Date range filters
    if (query.startDate && query.endDate) {
      where.publishedAt = Between(new Date(query.startDate), new Date(query.endDate));
    } else if (query.startDate) {
      where.publishedAt = MoreThanOrEqual(new Date(query.startDate));
    } else if (query.endDate) {
      where.publishedAt = LessThanOrEqual(new Date(query.endDate));
    }

    const [news, total] = await this.newsRepository.findAndCount({
      where,
      relations: ['consensus'],
      order: { publishedAt: 'DESC' },
      take: query.limit,
      skip: query.offset,
    });

    const data = news.map((n) => this.toResponseDto(n));

    this.logger.log(`Found ${total} news, returning ${data.length}`);
    return { data, total };
  }

  /**
   * Busca notícia por ID (retorna DTO)
   */
  async findOne(id: string): Promise<NewsResponseDto> {
    const news = await this.findOneEntity(id);
    return this.toResponseDto(news);
  }

  /**
   * Busca notícia por ID (retorna entidade)
   */
  async findOneEntity(id: string): Promise<News> {
    const news = await this.newsRepository.findOne({
      where: { id },
      relations: ['consensus', 'analyses'],
    });

    if (!news) {
      throw new NotFoundException(`News with ID ${id} not found`);
    }

    return news;
  }

  /**
   * Busca notícias por ticker
   */
  async findByTicker(ticker: string, limit = 20): Promise<NewsResponseDto[]> {
    const news = await this.newsRepository.find({
      where: { ticker: ticker.toUpperCase() },
      relations: ['consensus'],
      order: { publishedAt: 'DESC' },
      take: limit,
    });

    return news.map((n) => this.toResponseDto(n));
  }

  /**
   * Busca resumo de sentimento do mercado
   */
  async getMarketSentimentSummary(): Promise<MarketSentimentSummaryDto> {
    this.logger.log('Getting market sentiment summary');

    // Buscar consensos das últimas 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const consensuses = await this.consensusRepository
      .createQueryBuilder('consensus')
      .innerJoin('consensus.news', 'news')
      .where('news.publishedAt >= :sevenDaysAgo', { sevenDaysAgo })
      .getMany();

    // Calcular sentimento geral
    const totalNewsAnalyzed = consensuses.length;

    if (totalNewsAnalyzed === 0) {
      return {
        overallSentiment: 0,
        overallLabel: SentimentLabel.NEUTRAL,
        totalNewsAnalyzed: 0,
        newsLast24h: 0,
        breakdown: {
          veryBullish: 0,
          bullish: 0,
          slightlyBullish: 0,
          neutral: 0,
          slightlyBearish: 0,
          bearish: 0,
          veryBearish: 0,
        },
        recentNews: [],
      };
    }

    // Média ponderada por confiança
    let weightedSum = 0;
    let totalWeight = 0;
    const breakdown = {
      veryBullish: 0,
      bullish: 0,
      slightlyBullish: 0,
      neutral: 0,
      slightlyBearish: 0,
      bearish: 0,
      veryBearish: 0,
    };

    for (const consensus of consensuses) {
      // FIX: Usar peso padrão de 1.0 quando confidenceScore for null/undefined/NaN
      const rawWeight = Number(consensus.confidenceScore);
      const weight = !rawWeight || isNaN(rawWeight) ? 1.0 : rawWeight;
      weightedSum += Number(consensus.finalSentiment) * weight;
      totalWeight += weight;

      // Contagem por label
      switch (consensus.sentimentLabel) {
        case SentimentLabel.VERY_BULLISH:
          breakdown.veryBullish++;
          break;
        case SentimentLabel.BULLISH:
          breakdown.bullish++;
          break;
        case SentimentLabel.SLIGHTLY_BULLISH:
          breakdown.slightlyBullish++;
          break;
        case SentimentLabel.NEUTRAL:
          breakdown.neutral++;
          break;
        case SentimentLabel.SLIGHTLY_BEARISH:
          breakdown.slightlyBearish++;
          break;
        case SentimentLabel.BEARISH:
          breakdown.bearish++;
          break;
        case SentimentLabel.VERY_BEARISH:
          breakdown.veryBearish++;
          break;
      }
    }

    const overallSentiment = totalWeight > 0 ? weightedSum / totalWeight : 0;
    const overallLabel = this.scoreToLabel(overallSentiment);

    // Notícias das últimas 24h
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const newsLast24h = await this.newsRepository.count({
      where: { publishedAt: MoreThanOrEqual(oneDayAgo) },
    });

    // Top 5 notícias mais recentes
    const recentNews = await this.newsRepository.find({
      relations: ['consensus'],
      order: { publishedAt: 'DESC' },
      take: 5,
    });

    return {
      overallSentiment: Math.round(overallSentiment * 1000) / 1000,
      overallLabel,
      totalNewsAnalyzed,
      newsLast24h,
      breakdown,
      recentNews: recentNews.map((n) => this.toResponseDto(n)),
    };
  }

  /**
   * Busca resumo de sentimento de um ticker específico
   */
  async getTickerSentimentSummary(ticker: string): Promise<TickerSentimentSummaryDto> {
    const tickerUpper = ticker.toUpperCase();
    this.logger.log(`Getting ticker sentiment summary for ${tickerUpper}`);

    // Buscar contagem de notícias do ticker
    const totalNews = await this.newsRepository.count({
      where: { ticker: tickerUpper },
    });

    // Buscar consensos do ticker
    const consensuses = await this.consensusRepository
      .createQueryBuilder('consensus')
      .innerJoin('consensus.news', 'news')
      .where('news.ticker = :ticker', { ticker: tickerUpper })
      .getMany();

    const analyzedNews = consensuses.length;

    if (analyzedNews === 0) {
      return {
        ticker: tickerUpper,
        overallSentiment: 0,
        overallLabel: SentimentLabel.NEUTRAL,
        avgConfidence: 0,
        totalNews,
        analyzedNews: 0,
        newsLast24h: 0,
        breakdown: {
          veryBullish: 0,
          bullish: 0,
          slightlyBullish: 0,
          neutral: 0,
          slightlyBearish: 0,
          bearish: 0,
          veryBearish: 0,
        },
        recentNews: [],
        lastUpdated: new Date(),
      };
    }

    // Média ponderada por confiança
    let weightedSum = 0;
    let totalWeight = 0;
    let totalConfidence = 0;
    const breakdown = {
      veryBullish: 0,
      bullish: 0,
      slightlyBullish: 0,
      neutral: 0,
      slightlyBearish: 0,
      bearish: 0,
      veryBearish: 0,
    };

    for (const consensus of consensuses) {
      // FIX: Usar peso padrão de 1.0 quando confidenceScore for null/undefined/NaN
      const rawWeight = Number(consensus.confidenceScore);
      const weight = !rawWeight || isNaN(rawWeight) ? 1.0 : rawWeight;
      weightedSum += Number(consensus.finalSentiment) * weight;
      totalWeight += weight;
      totalConfidence += weight;

      // Contagem por label
      switch (consensus.sentimentLabel) {
        case SentimentLabel.VERY_BULLISH:
          breakdown.veryBullish++;
          break;
        case SentimentLabel.BULLISH:
          breakdown.bullish++;
          break;
        case SentimentLabel.SLIGHTLY_BULLISH:
          breakdown.slightlyBullish++;
          break;
        case SentimentLabel.NEUTRAL:
          breakdown.neutral++;
          break;
        case SentimentLabel.SLIGHTLY_BEARISH:
          breakdown.slightlyBearish++;
          break;
        case SentimentLabel.BEARISH:
          breakdown.bearish++;
          break;
        case SentimentLabel.VERY_BEARISH:
          breakdown.veryBearish++;
          break;
      }
    }

    const overallSentiment = totalWeight > 0 ? weightedSum / totalWeight : 0;
    const overallLabel = this.scoreToLabel(overallSentiment);
    const avgConfidence = analyzedNews > 0 ? totalConfidence / analyzedNews : 0;

    // Notícias das últimas 24h do ticker
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const newsLast24h = await this.newsRepository.count({
      where: {
        ticker: tickerUpper,
        publishedAt: MoreThanOrEqual(oneDayAgo),
      },
    });

    // Top 5 notícias mais recentes do ticker
    const recentNews = await this.newsRepository.find({
      where: { ticker: tickerUpper },
      relations: ['consensus'],
      order: { publishedAt: 'DESC' },
      take: 5,
    });

    return {
      ticker: tickerUpper,
      overallSentiment: Math.round(overallSentiment * 1000) / 1000,
      overallLabel,
      avgConfidence: Math.round(avgConfidence * 1000) / 1000,
      totalNews,
      analyzedNews,
      newsLast24h,
      breakdown,
      recentNews: recentNews.map((n) => this.toResponseDto(n)),
      lastUpdated: new Date(),
    };
  }

  /**
   * Salva notícia (ou atualiza se URL já existe)
   */
  async saveNews(newsData: Partial<News>): Promise<News> {
    // Verificar se já existe por URL
    const existing = await this.newsRepository.findOne({
      where: { url: newsData.url },
    });

    if (existing) {
      this.logger.debug(`News already exists: ${newsData.url}`);
      return existing;
    }

    // Buscar asset se ticker informado
    if (newsData.ticker) {
      const asset = await this.assetRepository.findOne({
        where: { ticker: newsData.ticker.toUpperCase() },
      });
      if (asset) {
        newsData.asset = asset;
        newsData.assetId = asset.id;
      }
    }

    const news = this.newsRepository.create(newsData);
    const saved = await this.newsRepository.save(news);
    this.logger.log(`Saved news: ${saved.title.substring(0, 50)}...`);
    return saved;
  }

  /**
   * Busca notícias pendentes de análise
   */
  async findPendingAnalysis(limit = 10): Promise<News[]> {
    return this.newsRepository.find({
      where: { isAnalyzed: false },
      order: { publishedAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Marca notícia como analisada
   */
  async markAsAnalyzed(newsId: string): Promise<void> {
    await this.newsRepository.update(newsId, { isAnalyzed: true });
  }

  /**
   * Converte entidade para DTO de resposta
   */
  private toResponseDto(news: News): NewsResponseDto {
    const response: NewsResponseDto = {
      id: news.id,
      ticker: news.ticker,
      title: news.title,
      summary: news.summary,
      url: news.url,
      source: news.source,
      sourceName: news.sourceName,
      author: news.author,
      imageUrl: news.imageUrl,
      publishedAt: news.publishedAt,
      isAnalyzed: news.isAnalyzed,
      createdAt: news.createdAt,
    };

    if (news.consensus) {
      response.sentiment = {
        finalSentiment: Number(news.consensus.finalSentiment),
        label: news.consensus.sentimentLabel,
        confidenceScore: Number(news.consensus.confidenceScore),
        providersCount: news.consensus.providersCount,
        agreementCount: news.consensus.agreementCount,
        isHighConfidence: news.consensus.isHighConfidence,
      };
    }

    return response;
  }

  /**
   * Converte score de sentimento para label
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

  // ==================== FASE 76: TIME-WEIGHTED SENTIMENT METHODS ====================

  /**
   * Calcula peso temporal usando exponential decay
   * Fórmula: Weight(t) = 2^(-t/halflife)
   *
   * @param publishedAt - Data de publicação da notícia
   * @param halfLifeDays - Meia-vida em dias
   * @returns Peso entre 0 e 1 (1 = hoje, 0.5 = halflife dias atrás)
   */
  private calculateTemporalWeight(publishedAt: Date, halfLifeDays: number): number {
    const now = new Date();
    const daysSincePublication =
      (now.getTime() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24);

    // Exponential decay: 2^(-t/halflife)
    return Math.pow(2, -daysSincePublication / halfLifeDays);
  }

  /**
   * Obtém peso por tier de fonte
   *
   * @param source - Fonte da notícia
   * @returns Peso de credibilidade (0.8 a 1.3)
   */
  private getSourceTierWeight(source: NewsSource): number {
    return this.SOURCE_TIER_WEIGHTS[source] ?? 1.0;
  }

  /**
   * Busca sentimento de um ticker para um período específico
   * Aplica temporal decay e source tier weighting
   *
   * @param ticker - Ticker do ativo
   * @param period - Período de análise (weekly, monthly, etc)
   * @returns Sentimento ponderado para o período
   */
  async getTickerSentimentByPeriod(
    ticker: string,
    period: SentimentPeriod,
  ): Promise<TimeframeSentimentDto> {
    const tickerUpper = ticker.toUpperCase();
    const periodDays = this.PERIOD_DAYS[period];
    const halfLife = this.HALF_LIFE_DAYS[period];

    this.logger.log(
      `Getting ${period} sentiment for ${tickerUpper} (${periodDays}d, halflife: ${halfLife}d)`,
    );

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Buscar notícias do período com consenso
    const news = await this.newsRepository.find({
      where: {
        ticker: tickerUpper,
        publishedAt: MoreThanOrEqual(startDate),
        isAnalyzed: true,
      },
      relations: ['consensus'],
      order: { publishedAt: 'DESC' },
    });

    if (news.length === 0) {
      this.logger.log(`No analyzed news found for ${tickerUpper} in ${period} period`);
      return {
        period,
        sentiment: 0,
        label: SentimentLabel.NEUTRAL,
        confidence: 0,
        newsCount: 0,
        oldestNews: undefined,
        newestNews: undefined,
      };
    }

    // Calcular sentimento ponderado com temporal decay + source tier
    let weightedSum = 0;
    let totalWeight = 0;
    let newsWithConsensus = 0;

    for (const n of news) {
      if (!n.consensus) continue;

      newsWithConsensus++;
      const temporalWeight = this.calculateTemporalWeight(n.publishedAt, halfLife);
      const sourceWeight = this.getSourceTierWeight(n.source);
      const confidence = Number(n.consensus.confidenceScore) || 1.0;
      const sentiment = Number(n.consensus.finalSentiment);

      // Peso combinado: temporal * source * confidence
      const combinedWeight = temporalWeight * sourceWeight * confidence;
      weightedSum += sentiment * combinedWeight;
      totalWeight += combinedWeight;
    }

    const finalSentiment = totalWeight > 0 ? weightedSum / totalWeight : 0;
    const avgConfidence = newsWithConsensus > 0 ? totalWeight / newsWithConsensus : 0;

    this.logger.log(
      `${tickerUpper} ${period}: sentiment=${finalSentiment.toFixed(3)}, ` +
        `news=${newsWithConsensus}, avgConfidence=${avgConfidence.toFixed(3)}`,
    );

    return {
      period,
      sentiment: Math.round(finalSentiment * 1000) / 1000,
      label: this.scoreToLabel(finalSentiment),
      confidence: Math.round(avgConfidence * 1000) / 1000,
      newsCount: newsWithConsensus,
      oldestNews: news[news.length - 1]?.publishedAt,
      newestNews: news[0]?.publishedAt,
    };
  }

  /**
   * Busca sentimento de um ticker para todos os períodos
   * Retorna análise multi-timeframe completa
   *
   * @param ticker - Ticker do ativo
   * @returns Sentimento para todos os períodos
   */
  async getTickerMultiTimeframeSentiment(ticker: string): Promise<MultiTimeframeSentimentDto> {
    this.logger.log(`Getting multi-timeframe sentiment for ${ticker.toUpperCase()}`);

    const periods = Object.values(SentimentPeriod);
    const timeframes = await Promise.all(
      periods.map((p) => this.getTickerSentimentByPeriod(ticker, p)),
    );

    // Calcular breakdown geral (quantos períodos têm cada label)
    const breakdown = {
      veryBullish: 0,
      bullish: 0,
      slightlyBullish: 0,
      neutral: 0,
      slightlyBearish: 0,
      bearish: 0,
      veryBearish: 0,
    };

    for (const tf of timeframes) {
      switch (tf.label) {
        case SentimentLabel.VERY_BULLISH:
          breakdown.veryBullish++;
          break;
        case SentimentLabel.BULLISH:
          breakdown.bullish++;
          break;
        case SentimentLabel.SLIGHTLY_BULLISH:
          breakdown.slightlyBullish++;
          break;
        case SentimentLabel.NEUTRAL:
          breakdown.neutral++;
          break;
        case SentimentLabel.SLIGHTLY_BEARISH:
          breakdown.slightlyBearish++;
          break;
        case SentimentLabel.BEARISH:
          breakdown.bearish++;
          break;
        case SentimentLabel.VERY_BEARISH:
          breakdown.veryBearish++;
          break;
      }
    }

    return {
      ticker: ticker.toUpperCase(),
      timeframes,
      breakdown,
      lastUpdated: new Date(),
    };
  }
}
