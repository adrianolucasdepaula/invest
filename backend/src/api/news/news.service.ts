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
  CollectNewsDto,
  SentimentSummaryDto,
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
      const weight = Number(consensus.confidenceScore);
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
}
