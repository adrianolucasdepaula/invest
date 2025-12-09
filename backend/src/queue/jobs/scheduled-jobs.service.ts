import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset, AssetType, News } from '@database/entities';
import { NewsCollectorsService } from '../../api/news/services/news-collectors.service';
import { EconomicCalendarService } from '../../api/news/services/economic-calendar.service';
import { AIOrchestatorService } from '../../api/news/services/ai-orchestrator.service';
import { AssetsService } from '../../api/assets/assets.service';

@Injectable()
export class ScheduledJobsService {
  private readonly logger = new Logger(ScheduledJobsService.name);

  constructor(
    @InjectQueue('scraping') private scrapingQueue: Queue,
    @InjectQueue('analysis') private analysisQueue: Queue,
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    @InjectRepository(News)
    private newsRepository: Repository<News>,
    private readonly newsCollectors: NewsCollectorsService,
    private readonly economicCalendar: EconomicCalendarService,
    private readonly aiOrchestrator: AIOrchestatorService,
    private readonly assetsService: AssetsService,
  ) {}

  /**
   * Update fundamental data for popular stocks every day at 9 PM
   */
  @Cron(CronExpression.EVERY_DAY_AT_9PM)
  async updateFundamentalData() {
    this.logger.log('Starting scheduled fundamental data update');

    try {
      // Get active stocks (most traded)
      const assets = await this.assetRepository.find({
        where: { isActive: true, type: AssetType.STOCK },
        take: 50, // Top 50 stocks
      });

      const tickers = assets.map((a) => a.ticker);

      // Add to queue
      await this.scrapingQueue.add(
        'bulk-scraping',
        { tickers },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      );

      this.logger.log(`Scheduled fundamental data update for ${tickers.length} assets`);
    } catch (error) {
      this.logger.error(`Failed to schedule fundamental data update: ${error.message}`);
    }
  }

  /**
   * Sync options liquidity data for all assets every day at 6 PM
   * Updates hasOptions flag and optionsLiquidityMetadata with detailed data
   * from opcoes.net.br/estudos/liquidez/opcoes
   */
  @Cron(CronExpression.EVERY_DAY_AT_6PM)
  async updateOptionsData() {
    this.logger.log('📊 Starting scheduled options liquidity sync');

    try {
      const result = await this.assetsService.syncOptionsLiquidity();

      this.logger.log(
        `📊 Options liquidity sync completed: ${result.totalWithOptions} assets with options ` +
          `(+${result.optionsAdded} added, -${result.optionsRemoved} removed) in ${result.duration}ms`,
      );
    } catch (error) {
      this.logger.error(`Failed to sync options liquidity: ${error.message}`);
    }
  }

  /**
   * Clean old scraped data every week on Sunday at 3 AM
   */
  @Cron(CronExpression.EVERY_WEEK)
  async cleanOldData() {
    this.logger.log('Starting scheduled data cleanup');

    try {
      // TODO: Implement cleanup logic
      // Delete scraped data older than 90 days
      this.logger.log('Data cleanup completed');
    } catch (error) {
      this.logger.error(`Failed to clean old data: ${error.message}`);
    }
  }

  /**
   * Update price data every 15 minutes during market hours
   */
  @Cron('*/15 9-18 * * 1-5') // Every 15 min, 9 AM to 6 PM, Mon-Fri
  async updatePriceData() {
    this.logger.log('Starting scheduled price data update');

    try {
      // Get active stocks
      const assets = await this.assetRepository.find({
        where: { isActive: true },
        take: 100,
      });

      // TODO: Add price update job
      this.logger.log(`Scheduled price update for ${assets.length} assets`);
    } catch (error) {
      this.logger.error(`Failed to schedule price data update: ${error.message}`);
    }
  }

  /**
   * Manual trigger for immediate scraping
   */
  async triggerImmediateScraping(ticker: string, type: 'fundamental' | 'options' = 'fundamental') {
    this.logger.log(`Triggering immediate ${type} scraping for ${ticker}`);

    try {
      await this.scrapingQueue.add(
        type,
        { ticker, type },
        {
          priority: 1, // High priority
          attempts: 3,
        },
      );

      return { success: true, ticker, type };
    } catch (error) {
      this.logger.error(`Failed to trigger immediate scraping: ${error.message}`);
      throw error;
    }
  }

  // ==========================================================================
  // NEWS & MARKET SENTIMENT JOBS
  // ==========================================================================

  /**
   * Collect news for top tickers every 2 hours (8h-20h, Mon-Fri)
   * Feeds: Termômetro do Mercado
   */
  @Cron('0 */2 8-20 * * 1-5') // Every 2h, 8 AM to 8 PM, Mon-Fri
  async collectNewsForTopTickers() {
    this.logger.log('📰 Starting scheduled news collection for top tickers');

    const topTickers = ['PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'ABEV3', 'WEGE3', 'BBAS3', 'B3SA3'];
    let totalCollected = 0;

    try {
      for (const ticker of topTickers) {
        const result = await this.newsCollectors.collectForTicker(ticker);
        totalCollected += result.length;
        this.logger.debug(`Collected ${result.length} news for ${ticker}`);
      }

      this.logger.log(`📰 News collection completed: ${totalCollected} articles for ${topTickers.length} tickers`);
    } catch (error) {
      this.logger.error(`Failed to collect news: ${error.message}`);
    }
  }

  /**
   * Collect economic calendar events (6h and 18h daily)
   * Feeds: Calendário Econômico widget
   */
  @Cron('0 0 6,18 * * *') // At 6 AM and 6 PM every day
  async collectEconomicCalendar() {
    this.logger.log('📅 Starting scheduled economic calendar collection');

    try {
      const result = await this.economicCalendar.collectAll();
      this.logger.log(`📅 Economic calendar collection completed: ${result.total} events`);
    } catch (error) {
      this.logger.error(`Failed to collect economic calendar: ${error.message}`);
    }
  }

  /**
   * Analyze unprocessed news every 30 minutes
   * Generates sentiment for Termômetro do Mercado
   */
  @Cron('0 */30 * * * *') // Every 30 minutes
  async analyzeUnprocessedNews() {
    this.logger.log('🤖 Starting scheduled news sentiment analysis');

    try {
      const unanalyzed = await this.newsRepository.find({
        where: { isAnalyzed: false },
        take: 10,
        order: { publishedAt: 'DESC' },
      });

      if (unanalyzed.length === 0) {
        this.logger.debug('No unanalyzed news to process');
        return;
      }

      let analyzed = 0;
      for (const news of unanalyzed) {
        try {
          await this.aiOrchestrator.analyzeNews(news);
          analyzed++;
        } catch (error) {
          this.logger.debug(`Failed to analyze news ${news.id}: ${error.message}`);
        }
      }

      this.logger.log(`🤖 News analysis completed: ${analyzed}/${unanalyzed.length} articles`);
    } catch (error) {
      this.logger.error(`Failed to analyze news: ${error.message}`);
    }
  }
}
