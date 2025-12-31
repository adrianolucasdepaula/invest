import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
  Analysis,
  Asset,
  AssetType,
  News,
  OptionPrice,
  OptionStatus,
  OptionType,
} from '@database/entities';
import { NewsCollectorsService } from '../../api/news/services/news-collectors.service';
import { EconomicCalendarService } from '../../api/news/services/economic-calendar.service';
import { AIOrchestatorService } from '../../api/news/services/ai-orchestrator.service';
import { AssetsService } from '../../api/assets/assets.service';
import { AppWebSocketGateway } from '../../websocket/websocket.gateway';

@Injectable()
export class ScheduledJobsService {
  private readonly logger = new Logger(ScheduledJobsService.name);
  // ✅ FASE 145 FIX: Job lock flags to prevent overlap
  private isCleaningOldData = false;
  private isUpdatingOptionPrices = false;

  constructor(
    @InjectQueue('scraping') private scrapingQueue: Queue,
    @InjectQueue('analysis') private analysisQueue: Queue,
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    @InjectRepository(Analysis)
    private analysisRepository: Repository<Analysis>,
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
  @Cron(CronExpression.EVERY_DAY_AT_9PM, {
    name: 'update-fundamental-data',
    timeZone: 'America/Sao_Paulo',
  })
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
  @Cron(CronExpression.EVERY_DAY_AT_6PM, {
    name: 'update-options-data',
    timeZone: 'America/Sao_Paulo',
  })
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
   * FASE 145: Clean stale analyses every week on Sunday at 2 AM
   *
   * Removes:
   * 1. Analyses from inactive assets
   * 2. Failed analyses >7 days
   * 3. Pending stuck analyses >1 hour
   * 4. (Optional) Very old analyses >90 days
   *
   * FASE 145 FIX: Added overlap prevention + 60s timeout per DELETE
   */
  @Cron('0 2 * * 0', {
    name: 'cleanup-stale-analyses',
    timeZone: 'America/Sao_Paulo',
  })
  async cleanOldData() {
    // ✅ FASE 145 FIX: Prevent overlap
    if (this.isCleaningOldData) {
      this.logger.warn('⚠️  Previous cleanOldData still running, skipping...');
      return;
    }

    this.isCleaningOldData = true;

    try {
      this.logger.log('🧹 Starting scheduled analysis cleanup');
      const startTime = Date.now();
      let totalDeleted = 0;
      const TIMEOUT_MS = 60000; // 60s per DELETE

      // 1. Remove analyses from inactive assets
      const inactiveAssets = await this.assetRepository.find({
        where: { isActive: false },
        select: ['id'],
      });

      if (inactiveAssets.length > 0) {
        const inactiveAssetIds = inactiveAssets.map((asset) => asset.id);
        const inactiveCount = await this.deleteWithTimeout(
          () => this.analysisRepository
            .createQueryBuilder()
            .delete()
            .from(Analysis)
            .where('assetId IN (:...ids)', { ids: inactiveAssetIds })
            .execute(),
          TIMEOUT_MS,
          'Analyses from inactive assets',
        );
        totalDeleted += inactiveCount;
      }

      // 2. Remove failed analyses >7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const failedCount = await this.deleteWithTimeout(
        () => this.analysisRepository
          .createQueryBuilder()
          .delete()
          .from(Analysis)
          .where('status = :status', { status: 'failed' })
          .andWhere('createdAt < :date', { date: sevenDaysAgo })
          .execute(),
        TIMEOUT_MS,
        'Failed analyses (>7 days)',
      );
      totalDeleted += failedCount;

      // 3. Remove pending stuck analyses >1 hour
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const stuckCount = await this.deleteWithTimeout(
        () => this.analysisRepository
          .createQueryBuilder()
          .delete()
          .from(Analysis)
          .where('status = :status', { status: 'pending' })
          .andWhere('createdAt < :date', { date: oneHourAgo })
          .execute(),
        TIMEOUT_MS,
        'Stuck pending analyses (>1 hour)',
      );
      totalDeleted += stuckCount;

      // 4. (Optional) Remove very old analyses >90 days
      const retentionDays = parseInt(process.env.CLEANUP_ANALYSES_RETENTION_DAYS || '0', 10);
      if (retentionDays > 0) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        const oldCount = await this.deleteWithTimeout(
          () => this.analysisRepository
            .createQueryBuilder()
            .delete()
            .from(Analysis)
            .where('createdAt < :date', { date: cutoffDate })
            .execute(),
          TIMEOUT_MS,
          `Very old analyses (>${retentionDays} days)`,
        );
        totalDeleted += oldCount;
      }

      const duration = Date.now() - startTime;
      this.logger.log(`✅ Analysis cleanup completed: ${totalDeleted} total removed in ${duration}ms`);
    } catch (error) {
      this.logger.error(`❌ Failed to clean old analyses: ${error.message}`);
    } finally {
      this.isCleaningOldData = false; // ✅ Release lock
    }
  }

  /**
   * FASE 145 FIX: Helper method to execute DELETE with timeout
   */
  private async deleteWithTimeout(
    deleteOperation: () => Promise<any>,
    timeoutMs: number,
    entityName: string,
  ): Promise<number> {
    try {
      const result = await Promise.race([
        deleteOperation(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`${entityName} delete timeout`)), timeoutMs)
        ),
      ]);

      const affected = result.affected || 0;
      this.logger.log(`  ✅ Removed ${affected} ${entityName}`);
      return affected;
    } catch (error) {
      this.logger.error(`  ❌ Failed to delete ${entityName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update price data every 15 minutes during market hours
   */
  @Cron('*/15 9-18 * * 1-5', {
    name: 'update-price-data',
    timeZone: 'America/Sao_Paulo',
  })
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
  @Cron('0 */2 8-20 * * 1-5', {
    name: 'collect-news-top-tickers',
    timeZone: 'America/Sao_Paulo',
  })
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
  @Cron('0 0 6,18 * * *', {
    name: 'collect-economic-calendar',
    timeZone: 'America/Sao_Paulo',
  })
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
  @Cron('0 */30 * * * *', {
    name: 'analyze-unprocessed-news',
    timeZone: 'America/Sao_Paulo',
  })
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
   *
   * FASE 145 FIX: Added overlap prevention + 5-minute total timeout
   */
  @Cron('*/15 10-17 * * 1-5', {
    name: 'update-option-prices-realtime',
    timeZone: 'America/Sao_Paulo',
  })
  async updateOptionPricesRealtime() {
    // ✅ FASE 145 FIX: Prevent overlap
    if (this.isUpdatingOptionPrices) {
      this.logger.warn('⚠️  Previous updateOptionPricesRealtime still running, skipping...');
      return;
    }

    this.isUpdatingOptionPrices = true;

    try {
      // ✅ FASE 145 FIX: Add 5-minute total timeout
      await Promise.race([
        this.doUpdateOptionPrices(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Option prices update timeout')), 5 * 60 * 1000)
        ),
      ]);
    } catch (error) {
      this.logger.error(`Failed to update option prices: ${error.message}`);
    } finally {
      this.isUpdatingOptionPrices = false; // ✅ Release lock
    }
  }

  /**
   * FASE 145 FIX: Extracted option prices update logic
   */
  private async doUpdateOptionPrices() {
    this.logger.log('🎯 Starting scheduled option prices real-time update');
    const startTime = Date.now();

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
        // FASE 110.2: Use error level for failures per observability standards
        this.logger.error(`Failed to update options for ${asset.ticker}: ${error.message}`);
      }
    }

    const duration = Date.now() - startTime;
    this.logger.log(
      `🎯 Option prices real-time update completed: ${updatedCount}/${assetsWithOptions.length} assets (${duration}ms)`,
    );
  }

  /**
   * Check for expiring options and emit alerts (daily at 9 AM)
   */
  @Cron('0 9 * * 1-5', {
    name: 'check-expiring-options',
    timeZone: 'America/Sao_Paulo',
  })
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
  @Cron('0 0 * * *', {
    name: 'auto-expire-options',
    timeZone: 'America/Sao_Paulo',
  })
  async autoExpireOptions() {
    this.logger.log('🔄 Auto-expiring past options');

    try {
      // FASE 110.2: Use B3 timezone (America/Sao_Paulo) for option expiration
      // Options in B3 expire at market close (17:00 B3 time), so we use B3 date
      const b3Now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
      const today = new Date(b3Now.getFullYear(), b3Now.getMonth(), b3Now.getDate());

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
