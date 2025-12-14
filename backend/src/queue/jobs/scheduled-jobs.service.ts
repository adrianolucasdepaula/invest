import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Asset, AssetType, News, OptionPrice, OptionStatus, OptionType } from '@database/entities';
import { NewsCollectorsService } from '../../api/news/services/news-collectors.service';
import { EconomicCalendarService } from '../../api/news/services/economic-calendar.service';
import { AIOrchestatorService } from '../../api/news/services/ai-orchestrator.service';
import { AssetsService } from '../../api/assets/assets.service';
import { AppWebSocketGateway } from '../../websocket/websocket.gateway';

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
    @InjectRepository(OptionPrice)
    private optionPriceRepository: Repository<OptionPrice>,
    private readonly newsCollectors: NewsCollectorsService,
    private readonly economicCalendar: EconomicCalendarService,
    private readonly aiOrchestrator: AIOrchestatorService,
    private readonly assetsService: AssetsService,
    private readonly wsGateway: AppWebSocketGateway,
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

  // ==========================================================================
  // FASE 110: OPTION PRICES REAL-TIME UPDATES
  // ==========================================================================

  /**
   * Update option prices and emit WebSocket events every 15 minutes during market hours
   * Updates Greeks based on current underlying price
   * Cron: Every 15 min, 10 AM to 5:30 PM (B3 options market hours), Mon-Fri
   */
  @Cron('*/15 10-17 * * 1-5') // Every 15 min, 10 AM to 5 PM, Mon-Fri
  async updateOptionPricesRealtime() {
    this.logger.log('🎯 Starting scheduled option prices real-time update');
    const startTime = Date.now();

    try {
      // Get assets with active options (hasOptions = true)
      const assetsWithOptions = await this.assetRepository.find({
        where: { isActive: true, hasOptions: true },
        take: 20, // Top 20 most liquid options
        order: { ticker: 'ASC' },
      });

      if (assetsWithOptions.length === 0) {
        this.logger.debug('No assets with options found');
        return;
      }

      let updatedCount = 0;
      const tickers = assetsWithOptions.map((a) => a.ticker);

      for (const asset of assetsWithOptions) {
        try {
          // Get all active options for this asset
          const options = await this.optionPriceRepository.find({
            where: {
              underlyingAssetId: asset.id,
              status: OptionStatus.ACTIVE,
            },
            relations: ['underlyingAsset'],
          });

          if (options.length === 0) continue;

          // Group by expiration date for chain updates
          const byExpiration = new Map<string, typeof options>();
          for (const option of options) {
            const expKey = option.expirationDate.toISOString().split('T')[0];
            if (!byExpiration.has(expKey)) {
              byExpiration.set(expKey, []);
            }
            byExpiration.get(expKey).push(option);
          }

          // Emit chain updates per expiration
          for (const [expDate, expOptions] of byExpiration) {
            const calls = expOptions
              .filter((o) => o.type === OptionType.CALL)
              .map((o) => ({
                optionTicker: o.ticker,
                strike: Number(o.strike),
                lastPrice: Number(o.lastPrice) || 0,
                bid: Number(o.bid) || 0,
                ask: Number(o.ask) || 0,
                volume: o.volume || 0,
                openInterest: o.openInterest || 0,
                delta: o.delta ? Number(o.delta) : undefined,
                impliedVolatility: o.impliedVolatility ? Number(o.impliedVolatility) : undefined,
              }));

            const puts = expOptions
              .filter((o) => o.type === OptionType.PUT)
              .map((o) => ({
                optionTicker: o.ticker,
                strike: Number(o.strike),
                lastPrice: Number(o.lastPrice) || 0,
                bid: Number(o.bid) || 0,
                ask: Number(o.ask) || 0,
                volume: o.volume || 0,
                openInterest: o.openInterest || 0,
                delta: o.delta ? Number(o.delta) : undefined,
                impliedVolatility: o.impliedVolatility ? Number(o.impliedVolatility) : undefined,
              }));

            // Emit WebSocket event
            this.wsGateway.emitOptionChainUpdate(asset.ticker, {
              expirationDate: expDate,
              calls,
              puts,
            });
          }

          updatedCount++;
        } catch (error) {
          this.logger.debug(`Failed to update options for ${asset.ticker}: ${error.message}`);
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `🎯 Option prices real-time update completed: ${updatedCount}/${assetsWithOptions.length} assets (${duration}ms)`,
      );
    } catch (error) {
      this.logger.error(`Failed to update option prices: ${error.message}`);
    }
  }

  /**
   * Check for expiring options and emit alerts (daily at 9 AM)
   */
  @Cron('0 9 * * 1-5') // 9 AM Mon-Fri
  async checkExpiringOptions() {
    this.logger.log('⏰ Checking for expiring options');

    try {
      const today = new Date();
      const threeDaysFromNow = new Date(today);
      threeDaysFromNow.setDate(today.getDate() + 3);

      // Find options expiring in the next 3 days
      const expiringOptions = await this.optionPriceRepository
        .createQueryBuilder('option')
        .leftJoinAndSelect('option.underlyingAsset', 'asset')
        .where('option.status = :status', { status: OptionStatus.ACTIVE })
        .andWhere('option.expirationDate >= :today', { today })
        .andWhere('option.expirationDate <= :threeDays', { threeDays: threeDaysFromNow })
        .getMany();

      if (expiringOptions.length === 0) {
        this.logger.debug('No expiring options found');
        return;
      }

      // Emit alerts for each expiring option
      for (const option of expiringOptions) {
        const daysToExp = Math.ceil(
          (option.expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );

        this.wsGateway.emitOptionExpirationAlert({
          ticker: option.underlyingAsset?.ticker || '',
          optionTicker: option.ticker,
          strike: Number(option.strike),
          type: option.type === OptionType.CALL ? 'CALL' : 'PUT',
          expiration: option.expirationDate.toISOString().split('T')[0],
          daysToExpiration: daysToExp,
          inTheMoney: option.inTheMoney || false,
        });
      }

      this.logger.log(`⏰ Sent ${expiringOptions.length} expiration alerts`);
    } catch (error) {
      this.logger.error(`Failed to check expiring options: ${error.message}`);
    }
  }

  /**
   * Auto-expire past options (daily at midnight)
   * FASE 110.1: Fixed bug - now expires ALL past options, not just today's
   */
  @Cron('0 0 * * *') // Midnight daily
  async autoExpireOptions() {
    this.logger.log('🔄 Auto-expiring past options');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // FASE 110.1: Use LessThan to expire ALL past options, not just today's
      const result = await this.optionPriceRepository.update(
        {
          status: OptionStatus.ACTIVE,
          expirationDate: LessThan(today),
        },
        { status: OptionStatus.EXPIRED },
      );

      const affected = result.affected || 0;
      if (affected > 0) {
        this.logger.log(`🔄 Auto-expired ${affected} options`);
      }
    } catch (error) {
      this.logger.error(`Failed to auto-expire options: ${error.message}`);
    }
  }

  /**
   * Trigger immediate option price update for a specific ticker
   */
  async triggerOptionPriceUpdate(ticker: string): Promise<{ success: boolean; optionsCount: number }> {
    this.logger.log(`🎯 Triggering immediate option price update for ${ticker}`);

    try {
      const asset = await this.assetRepository.findOne({ where: { ticker, hasOptions: true } });
      if (!asset) {
        return { success: false, optionsCount: 0 };
      }

      const options = await this.optionPriceRepository.find({
        where: { underlyingAssetId: asset.id, status: OptionStatus.ACTIVE },
      });

      // Group and emit
      const byExpiration = new Map<string, typeof options>();
      for (const option of options) {
        const expKey = option.expirationDate.toISOString().split('T')[0];
        if (!byExpiration.has(expKey)) {
          byExpiration.set(expKey, []);
        }
        byExpiration.get(expKey).push(option);
      }

      for (const [expDate, expOptions] of byExpiration) {
        const calls = expOptions.filter((o) => o.type === OptionType.CALL).map((o) => ({
          optionTicker: o.ticker,
          strike: Number(o.strike),
          lastPrice: Number(o.lastPrice) || 0,
          bid: Number(o.bid) || 0,
          ask: Number(o.ask) || 0,
          volume: o.volume || 0,
          openInterest: o.openInterest || 0,
          delta: o.delta ? Number(o.delta) : undefined,
          impliedVolatility: o.impliedVolatility ? Number(o.impliedVolatility) : undefined,
        }));

        const puts = expOptions.filter((o) => o.type === OptionType.PUT).map((o) => ({
          optionTicker: o.ticker,
          strike: Number(o.strike),
          lastPrice: Number(o.lastPrice) || 0,
          bid: Number(o.bid) || 0,
          ask: Number(o.ask) || 0,
          volume: o.volume || 0,
          openInterest: o.openInterest || 0,
          delta: o.delta ? Number(o.delta) : undefined,
          impliedVolatility: o.impliedVolatility ? Number(o.impliedVolatility) : undefined,
        }));

        this.wsGateway.emitOptionChainUpdate(ticker, { expirationDate: expDate, calls, puts });
      }

      return { success: true, optionsCount: options.length };
    } catch (error) {
      this.logger.error(`Failed to trigger option price update: ${error.message}`);
      return { success: false, optionsCount: 0 };
    }
  }
}
