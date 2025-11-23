import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MarketDataService } from '../../api/market-data/market-data.service';

/**
 * Service responsible for scheduled tasks (cron jobs)
 *
 * FASE 34.3: Daily COTAHIST Sync
 * - Executes Monday-Friday at 8:00 AM (America/Sao_Paulo)
 * - Syncs top 5 liquid tickers (ABEV3, VALE3, PETR4, ITUB4, BBDC4)
 * - Current year only (historical data already synced)
 * - Graceful error handling (logs failures, continues execution)
 *
 * Benefits:
 * - Automated daily updates (no manual intervention)
 * - Fresh data for analysis and portfolios
 * - Redis cache ensures fast repeated syncs
 */
@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  // Top 5 most liquid B3 tickers (active daily sync)
  private readonly activeTickers = [
    'ABEV3', // Ambev
    'VALE3', // Vale
    'PETR4', // Petrobras PN
    'ITUB4', // Itaú Unibanco PN
    'BBDC4', // Bradesco PN
  ];

  constructor(private readonly marketDataService: MarketDataService) {}

  /**
   * Daily COTAHIST sync for active tickers
   *
   * Schedule: Monday-Friday at 8:00 AM (after B3 market close)
   * Cron Expression: '0 8 * * 1-5'
   * - Minute: 0
   * - Hour: 8
   * - Day of month: * (every day)
   * - Month: * (every month)
   * - Day of week: 1-5 (Monday-Friday)
   *
   * Strategy:
   * 1. Get current year
   * 2. Sync each ticker for current year only
   * 3. Log success/failure per ticker
   * 4. Continue on errors (partial success allowed)
   *
   * Performance:
   * - With Redis cache: ~1s/ticker (cached COTAHIST ZIP)
   * - Without cache: ~45s/ticker (FTP download + parsing)
   * - Total: ~5s (with cache) or ~3min (without cache)
   */
  @Cron('0 8 * * 1-5', {
    name: 'daily-cotahist-sync',
    timeZone: 'America/Sao_Paulo',
  })
  async handleDailyCotahistSync() {
    const startTime = Date.now();
    this.logger.log('🚀 Starting daily COTAHIST sync...');

    const currentYear = new Date().getFullYear();
    let successCount = 0;
    let failureCount = 0;

    for (const ticker of this.activeTickers) {
      try {
        this.logger.log(`⏳ Syncing ${ticker} for ${currentYear}...`);

        await this.marketDataService.syncHistoricalDataFromCotahist(
          ticker,
          currentYear,
          currentYear,
        );

        successCount++;
        this.logger.log(`✅ Synced ${ticker} for ${currentYear}`);
      } catch (error: any) {
        failureCount++;
        this.logger.error(`❌ Failed to sync ${ticker}: ${error.message}`);

        // Continue with next ticker (partial success allowed)
        continue;
      }
    }

    const duration = Date.now() - startTime;
    const totalTickers = this.activeTickers.length;
    const successRate = ((successCount / totalTickers) * 100).toFixed(1);

    this.logger.log(
      `🎯 Daily COTAHIST sync completed: ${successCount}/${totalTickers} (${successRate}%) in ${duration}ms`,
    );

    // Alert if failure rate > 20%
    if (failureCount / totalTickers > 0.2) {
      this.logger.warn(`⚠️ High failure rate: ${failureCount}/${totalTickers} tickers failed`);
    }
  }

  /**
   * Manual trigger for testing/debugging
   * Can be called via endpoint POST /api/v1/cron/trigger-daily-sync
   *
   * @returns Sync result summary
   */
  async triggerDailySyncManually(): Promise<{
    success: boolean;
    message: string;
    details: {
      successCount: number;
      failureCount: number;
      totalTickers: number;
      duration: number;
    };
  }> {
    const startTime = Date.now();
    this.logger.log('🔧 Manual trigger: Starting COTAHIST sync...');

    const currentYear = new Date().getFullYear();
    let successCount = 0;
    let failureCount = 0;

    for (const ticker of this.activeTickers) {
      try {
        await this.marketDataService.syncHistoricalDataFromCotahist(
          ticker,
          currentYear,
          currentYear,
        );
        successCount++;
      } catch (error: any) {
        failureCount++;
        this.logger.error(`Failed to sync ${ticker}: ${error.message}`);
      }
    }

    const duration = Date.now() - startTime;
    const totalTickers = this.activeTickers.length;

    return {
      success: failureCount === 0,
      message: `Synced ${successCount}/${totalTickers} tickers in ${duration}ms`,
      details: {
        successCount,
        failureCount,
        totalTickers,
        duration,
      },
    };
  }
}
