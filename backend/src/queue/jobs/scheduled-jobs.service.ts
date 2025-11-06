import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from '@database/entities';

@Injectable()
export class ScheduledJobsService {
  private readonly logger = new Logger(ScheduledJobsService.name);

  constructor(
    @InjectQueue('scraping') private scrapingQueue: Queue,
    @InjectQueue('analysis') private analysisQueue: Queue,
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
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
        where: { isActive: true, type: 'stock' },
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
   * Update options data for stocks with options every day at 6 PM
   */
  @Cron(CronExpression.EVERY_DAY_AT_6PM)
  async updateOptionsData() {
    this.logger.log('Starting scheduled options data update');

    try {
      // Get stocks with options
      const assets = await this.assetRepository.find({
        where: { isActive: true, type: 'stock' },
        take: 20, // Top 20 stocks with options
      });

      for (const asset of assets) {
        await this.scrapingQueue.add(
          'options',
          { ticker: asset.ticker, type: 'options' },
          {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000,
            },
          },
        );
      }

      this.logger.log(`Scheduled options data update for ${assets.length} assets`);
    } catch (error) {
      this.logger.error(`Failed to schedule options data update: ${error.message}`);
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
}
