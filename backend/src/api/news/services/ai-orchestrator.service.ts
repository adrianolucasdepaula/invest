import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { News, NewsAnalysis, AIProvider, NewsAnalysisStatus } from '../../../database/entities';

/**
 * Resposta do endpoint de scrapers Python
 */
interface ScraperSentimentResponse {
  success: boolean;
  ticker: string;
  results: Array<{
    provider: string;
    success: boolean;
    sentiment_score?: number;
    confidence?: number;
    analysis_text?: string;
    key_factors?: {
      bullish?: string[];
      bearish?: string[];
      neutral?: string[];
    };
    processing_time?: number;
    error?: string;
  }>;
  consensus?: {
    sentiment_score: number;
    confidence: number;
    providers_used: number;
    providers_total: number;
  };
}

/**
 * FASE 85: AI Orchestrator Service (Scrapers Only)
 *
 * Orquestra análise de sentimento usando scrapers Python:
 * - ChatGPT (via browser scraping)
 * - Gemini (via browser scraping)
 * - Claude (via browser scraping)
 * - DeepSeek (via browser scraping)
 * - Grok (via browser scraping)
 * - Perplexity (via browser scraping)
 *
 * NÃO usa API keys - todos os providers são acessados via OAuth cookies.
 */
@Injectable()
export class AIOrchestatorService {
  private readonly logger = new Logger(AIOrchestatorService.name);
  private readonly scraperApiUrl: string;
  private readonly defaultProviders: string[];

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(NewsAnalysis)
    private readonly newsAnalysisRepository: Repository<NewsAnalysis>,
  ) {
    this.scraperApiUrl = this.configService.get('SCRAPER_API_URL', 'http://scrapers:8080');
    this.defaultProviders = this.configService
      .get('AI_SCRAPER_PROVIDERS', 'gemini,chatgpt')
      .split(',');
    this.logger.log(`AI Orchestrator initialized (Scrapers Only Mode)`);
    this.logger.log(`Scraper API: ${this.scraperApiUrl}`);
    this.logger.log(`Default providers: ${this.defaultProviders.join(', ')}`);
  }

  /**
   * Retorna providers disponíveis via scrapers
   */
  getAvailableProviders(): AIProvider[] {
    return [
      AIProvider.CHATGPT,
      AIProvider.GEMINI,
      AIProvider.CLAUDE,
      AIProvider.DEEPSEEK,
      AIProvider.GROK,
      AIProvider.PERPLEXITY,
    ];
  }

  /**
   * Analisa uma notícia usando scrapers Python
   */
  async analyzeNews(news: News, specificProviders?: string[]): Promise<NewsAnalysis[]> {
    const providers = specificProviders || this.defaultProviders;
    return this.analyzeWithScrapers(news, providers);
  }

  /**
   * Analisa usando scrapers Python (sem API keys)
   * Chama endpoint http://scrapers:8080/api/sentiment/analyze
   */
  private async analyzeWithScrapers(news: News, providers: string[]): Promise<NewsAnalysis[]> {
    const startTime = Date.now();

    try {
      this.logger.log(`Analyzing news ${news.id} with scrapers: ${providers.join(', ')}`);

      const response = await fetch(`${this.scraperApiUrl}/api/sentiment/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: news.ticker,
          title: news.title,
          summary: news.summary || null,
          content: news.content || null,
          source: news.sourceName || news.source,
          published_at: news.publishedAt?.toISOString(),
          providers: providers,
        }),
        signal: AbortSignal.timeout(180000), // 3 min timeout (scrapers are slow)
      });

      if (!response.ok) {
        throw new Error(`Scraper API error: ${response.status} ${response.statusText}`);
      }

      const data: ScraperSentimentResponse = await response.json();

      if (!data.success || !data.results) {
        throw new Error('Scraper analysis returned no results');
      }

      // Convert scraper results to NewsAnalysis entities
      const analyses: NewsAnalysis[] = [];

      for (const result of data.results) {
        if (!result.success) {
          this.logger.debug(`Scraper ${result.provider} failed: ${result.error}`);
          continue;
        }

        // Map scraper provider name to AIProvider enum
        const providerEnum = this.mapScraperToProvider(result.provider);
        if (!providerEnum) continue;

        // Check if analysis already exists
        const existing = await this.newsAnalysisRepository.findOne({
          where: { newsId: news.id, provider: providerEnum },
        });

        const analysis =
          existing ||
          this.newsAnalysisRepository.create({
            newsId: news.id,
            provider: providerEnum,
            modelVersion: `scraper-${result.provider}`,
            status: NewsAnalysisStatus.PROCESSING,
          });

        analysis.sentimentScore = result.sentiment_score ?? 0;
        analysis.confidence = result.confidence ?? 0.5;
        analysis.analysisText = result.analysis_text || '';
        analysis.keyFactors = {
          bullish: result.key_factors?.bullish ?? [],
          bearish: result.key_factors?.bearish ?? [],
          neutral: result.key_factors?.neutral ?? [],
        };
        analysis.processingTime = result.processing_time || Date.now() - startTime;
        analysis.status = NewsAnalysisStatus.COMPLETED;
        analysis.completedAt = new Date();

        const saved = await this.newsAnalysisRepository.save(analysis);
        analyses.push(saved);

        this.logger.log(`Scraper ${result.provider}: score=${result.sentiment_score?.toFixed(2)}`);
      }

      this.logger.log(`Completed ${analyses.length} scraper analyses for news ${news.id}`);
      return analyses;
    } catch (error) {
      this.logger.error(`Scraper analysis failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Map scraper provider name to AIProvider enum
   */
  private mapScraperToProvider(scraperName: string): AIProvider | null {
    const mapping: Record<string, AIProvider> = {
      chatgpt: AIProvider.CHATGPT,
      gemini: AIProvider.GEMINI,
      claude: AIProvider.CLAUDE,
      deepseek: AIProvider.DEEPSEEK,
      grok: AIProvider.GROK,
      perplexity: AIProvider.PERPLEXITY,
    };
    return mapping[scraperName.toLowerCase()] || null;
  }

  /**
   * Check health of scraper API
   */
  async checkScraperHealth(): Promise<{
    healthy: boolean;
    providers: Record<string, { available: boolean; cookies_configured: boolean }>;
  }> {
    try {
      const response = await fetch(`${this.scraperApiUrl}/api/sentiment/health`, {
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        return { healthy: false, providers: {} };
      }

      const data = await response.json();
      return {
        healthy: data.ready,
        providers: data.providers,
      };
    } catch (error) {
      this.logger.error(`Scraper health check failed: ${error.message}`);
      return { healthy: false, providers: {} };
    }
  }

  /**
   * Retorna estatísticas de análises
   */
  async getAnalysisStats(): Promise<{
    total: number;
    byProvider: Record<AIProvider, number>;
    byStatus: Record<NewsAnalysisStatus, number>;
  }> {
    const analyses = await this.newsAnalysisRepository.find();

    const byProvider = {} as Record<AIProvider, number>;
    const byStatus = {} as Record<NewsAnalysisStatus, number>;

    for (const provider of Object.values(AIProvider)) {
      byProvider[provider] = 0;
    }
    for (const status of Object.values(NewsAnalysisStatus)) {
      byStatus[status] = 0;
    }

    for (const analysis of analyses) {
      byProvider[analysis.provider]++;
      byStatus[analysis.status]++;
    }

    return {
      total: analyses.length,
      byProvider,
      byStatus,
    };
  }
}
