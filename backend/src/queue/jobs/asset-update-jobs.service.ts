import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import {
  SingleAssetUpdateJob,
  MultipleAssetsUpdateJob,
  PortfolioUpdateJob,
  SectorUpdateJob,
} from '../processors/asset-update.processor';
import { UpdateTrigger } from '@database/entities';

@Injectable()
export class AssetUpdateJobsService implements OnModuleInit {
  private readonly logger = new Logger(AssetUpdateJobsService.name);
  private readonly isProductionOrStaging: boolean;

  constructor(
    @InjectQueue('asset-updates') private assetUpdatesQueue: Queue,
    private configService: ConfigService,
  ) {
    const env = this.configService.get<string>('NODE_ENV', 'development');
    this.isProductionOrStaging = env === 'production' || env === 'staging';
  }

  async onModuleInit() {
    // Log queue info on startup
    const jobCounts = await this.assetUpdatesQueue.getJobCounts();
    this.logger.log(`Asset Updates Queue initialized: ${JSON.stringify(jobCounts)}`);

    if (this.isProductionOrStaging) {
      this.logger.log('🔄 Cron jobs ENABLED (production/staging environment)');
    } else {
      this.logger.warn(
        '⚠️ Cron jobs DISABLED (development environment - enable manually if needed)',
      );
    }
  }

  // ============================================================================
  // CRON JOB 1: Atualização diária de ativos desatualizados
  // Executa todos os dias às 3:00 AM (horário de menor tráfego)
  // ============================================================================

  @Cron('0 3 * * *', {
    name: 'daily-outdated-update',
    timeZone: 'America/Sao_Paulo',
  })
  async scheduleDailyOutdatedUpdate() {
    if (!this.isProductionOrStaging) {
      this.logger.debug('⏭️ Skipping daily update (not in production/staging)');
      return;
    }

    this.logger.log('📅 Scheduling daily outdated assets update...');

    await this.assetUpdatesQueue.add(
      'daily-outdated-update',
      { type: 'daily_outdated' },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000, // 5s, 25s, 125s
        },
        removeOnComplete: 10, // Keep last 10 completed jobs
        removeOnFail: 50, // Keep last 50 failed jobs
      },
    );

    this.logger.log('✅ Daily update job scheduled');
  }

  // ============================================================================
  // CRON JOB 2: Retry de ativos com falha
  // Executa a cada hora
  // ============================================================================

  @Cron(CronExpression.EVERY_HOUR, {
    name: 'retry-failed-assets',
    timeZone: 'America/Sao_Paulo',
  })
  async scheduleRetryFailed() {
    if (!this.isProductionOrStaging) {
      this.logger.debug('⏭️ Skipping retry (not in production/staging)');
      return;
    }

    this.logger.log('🔁 Scheduling retry for failed assets...');

    await this.assetUpdatesQueue.add(
      'retry-failed',
      { type: 'retry_failed' },
      {
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 10000, // 10s
        },
        removeOnComplete: 5,
        removeOnFail: 20,
      },
    );

    this.logger.log('✅ Retry job scheduled');
  }

  // ============================================================================
  // MANUAL QUEUE METHODS (called by controller/service)
  // ============================================================================

  /**
   * Queue a single asset update
   */
  async queueSingleAsset(
    ticker: string,
    userId?: string,
    triggeredBy: UpdateTrigger = UpdateTrigger.MANUAL,
  ) {
    this.logger.log(`Queueing single asset update: ${ticker}`);

    const job = await this.assetUpdatesQueue.add(
      'update-single-asset',
      {
        type: 'single',
        ticker,
        userId,
        triggeredBy,
      } as SingleAssetUpdateJob,
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );

    return job.id;
  }

  /**
   * Queue multiple assets update
   */
  async queueMultipleAssets(
    tickers: string[],
    userId?: string,
    triggeredBy: UpdateTrigger = UpdateTrigger.MANUAL,
  ) {
    this.logger.log(`Queueing batch update: ${tickers.length} assets`);

    const job = await this.assetUpdatesQueue.add(
      'update-multiple-assets',
      {
        type: 'multiple',
        tickers,
        userId,
        triggeredBy,
      } as MultipleAssetsUpdateJob,
      {
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 5000,
        },
        removeOnComplete: 50,
        removeOnFail: 50,
      },
    );

    return job.id;
  }

  /**
   * Queue portfolio assets update
   */
  async queuePortfolio(portfolioId: string, userId: string) {
    this.logger.log(`Queueing portfolio update: ${portfolioId}`);

    const job = await this.assetUpdatesQueue.add(
      'update-portfolio',
      {
        type: 'portfolio',
        portfolioId,
        userId,
      } as PortfolioUpdateJob,
      {
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 5000,
        },
        removeOnComplete: 50,
        removeOnFail: 50,
      },
    );

    return job.id;
  }

  /**
   * Queue sector assets update
   */
  async queueSector(sector: string, userId?: string) {
    this.logger.log(`Queueing sector update: ${sector}`);

    const job = await this.assetUpdatesQueue.add(
      'update-sector',
      {
        type: 'sector',
        sector,
        userId,
      } as SectorUpdateJob,
      {
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 5000,
        },
        removeOnComplete: 20,
        removeOnFail: 20,
      },
    );

    return job.id;
  }

  // ============================================================================
  // QUEUE MANAGEMENT METHODS
  // ============================================================================

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    const [jobCounts, waiting, active, completed, failed, delayed] = await Promise.all([
      this.assetUpdatesQueue.getJobCounts(),
      this.assetUpdatesQueue.getWaiting(),
      this.assetUpdatesQueue.getActive(),
      this.assetUpdatesQueue.getCompleted(),
      this.assetUpdatesQueue.getFailed(),
      this.assetUpdatesQueue.getDelayed(),
    ]);

    return {
      counts: jobCounts,
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      jobs: {
        waiting: waiting.map((j) => ({ id: j.id, name: j.name, data: j.data })),
        active: active.map((j) => ({ id: j.id, name: j.name, data: j.data })),
        failed: failed.slice(0, 10).map((j) => ({
          id: j.id,
          name: j.name,
          failedReason: j.failedReason,
          attemptsMade: j.attemptsMade,
        })),
      },
    };
  }

  /**
   * Clean old completed and failed jobs
   */
  async cleanOldJobs() {
    const grace = 1000 * 60 * 60 * 24 * 7; // 7 days
    await this.assetUpdatesQueue.clean(grace, 'completed');
    await this.assetUpdatesQueue.clean(grace, 'failed');
    this.logger.log('✅ Old jobs cleaned');
  }

  /**
   * Pause queue (maintenance mode)
   */
  async pauseQueue() {
    await this.assetUpdatesQueue.pause();
    this.logger.warn('⏸️ Queue paused');
  }

  /**
   * Resume queue
   */
  async resumeQueue() {
    await this.assetUpdatesQueue.resume();
    this.logger.log('▶️ Queue resumed');
  }
}
