import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { AssetsUpdateService } from '../../api/assets/assets-update.service';
import { UpdateTrigger } from '@database/entities';
import { TelemetryService } from '../../telemetry/telemetry.service';

export interface SingleAssetUpdateJob {
  type: 'single';
  ticker: string;
  userId?: string;
  triggeredBy: UpdateTrigger;
}

export interface MultipleAssetsUpdateJob {
  type: 'multiple';
  tickers: string[];
  userId?: string;
  triggeredBy: UpdateTrigger;
}

export interface PortfolioUpdateJob {
  type: 'portfolio';
  portfolioId: string;
  userId: string;
}

export interface SectorUpdateJob {
  type: 'sector';
  sector: string;
  userId?: string;
}

export interface RetryFailedJob {
  type: 'retry_failed';
}

export interface DailyUpdateJob {
  type: 'daily_outdated';
}

export type AssetUpdateJobData =
  | SingleAssetUpdateJob
  | MultipleAssetsUpdateJob
  | PortfolioUpdateJob
  | SectorUpdateJob
  | RetryFailedJob
  | DailyUpdateJob;

@Processor('asset-updates')
export class AssetUpdateProcessor {
  private readonly logger = new Logger(AssetUpdateProcessor.name);

  constructor(
    private readonly assetsUpdateService: AssetsUpdateService,
    private readonly telemetryService: TelemetryService,
  ) {}

  // ✅ FIX: Reduced concurrency from 10 → 1 to prevent Playwright browser overload (FASE 1.1 - CRITICAL)
  // Each job spawns 6 parallel scrapers, so concurrency=1 means max 6 browser operations
  // Sequential scraper execution implemented (FASE 6 - DEFINITIVE)
  @Process({ name: 'update-single-asset', concurrency: 1 })
  async handleSingleAsset(job: Job<SingleAssetUpdateJob>) {
    const startTime = Date.now();
    this.logger.log(
      `[JOB-${job.id}] Starting single asset update: ${job.data.ticker} (trigger: ${job.data.triggeredBy})`,
    );

    try {
      const result = await this.assetsUpdateService.updateSingleAsset(
        job.data.ticker,
        job.data.userId,
        job.data.triggeredBy,
      );

      const duration = Date.now() - startTime;
      this.logger.log(
        `[JOB-${job.id}] ${result.success ? '✅' : '❌'} ${job.data.ticker} completed in ${duration}ms (traceId: ${result.traceId || 'N/A'})`,
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `[JOB-${job.id}] ❌ ${job.data.ticker} failed after ${duration}ms: ${error.message}`,
      );
      throw error;
    }
  }

  @Process('update-multiple-assets')
  async handleMultipleAssets(job: Job<MultipleAssetsUpdateJob>) {
    const startTime = Date.now();
    this.logger.log(
      `[JOB-${job.id}] Starting batch update: ${job.data.tickers.length} assets (trigger: ${job.data.triggeredBy})`,
    );

    try {
      const result = await this.assetsUpdateService.updateMultipleAssets(
        job.data.tickers,
        job.data.userId,
        job.data.triggeredBy,
      );

      const duration = Date.now() - startTime;
      const durationMinutes = (duration / 60000).toFixed(2);
      this.logger.log(
        `[JOB-${job.id}] ✅ Batch completed: ${result.successCount}/${result.totalAssets} successful in ${durationMinutes}min (traceId: ${result.traceId})`,
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`[JOB-${job.id}] ❌ Batch failed after ${duration}ms: ${error.message}`);
      throw error;
    }
  }

  @Process('update-portfolio')
  async handlePortfolio(job: Job<PortfolioUpdateJob>) {
    const startTime = Date.now();
    this.logger.log(`[JOB-${job.id}] Starting portfolio update: ${job.data.portfolioId}`);

    try {
      const result = await this.assetsUpdateService.updatePortfolioAssets(
        job.data.portfolioId,
        job.data.userId,
      );

      const duration = Date.now() - startTime;
      const durationMinutes = (duration / 60000).toFixed(2);
      this.logger.log(
        `[JOB-${job.id}] ✅ Portfolio completed: ${result.successCount}/${result.totalAssets} successful in ${durationMinutes}min (traceId: ${result.traceId})`,
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `[JOB-${job.id}] ❌ Portfolio failed after ${duration}ms: ${error.message}`,
      );
      throw error;
    }
  }

  @Process('update-sector')
  async handleSector(job: Job<SectorUpdateJob>) {
    const startTime = Date.now();
    this.logger.log(`[JOB-${job.id}] Starting sector update: ${job.data.sector}`);

    try {
      const result = await this.assetsUpdateService.updateAssetsBySector(
        job.data.sector,
        job.data.userId,
      );

      const duration = Date.now() - startTime;
      const durationMinutes = (duration / 60000).toFixed(2);
      this.logger.log(
        `[JOB-${job.id}] ✅ Sector completed: ${result.successCount}/${result.totalAssets} successful in ${durationMinutes}min (traceId: ${result.traceId})`,
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`[JOB-${job.id}] ❌ Sector failed after ${duration}ms: ${error.message}`);
      throw error;
    }
  }

  @Process('retry-failed')
  async handleRetryFailed(job: Job<RetryFailedJob>) {
    const startTime = Date.now();
    this.logger.log(`[JOB-${job.id}] Starting retry of failed assets`);

    try {
      const result = await this.assetsUpdateService.retryFailedAssets();

      const duration = Date.now() - startTime;
      const durationMinutes = (duration / 60000).toFixed(2);
      this.logger.log(
        `[JOB-${job.id}] ✅ Retry completed: ${result.successCount}/${result.totalAssets} successful in ${durationMinutes}min (traceId: ${result.traceId})`,
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`[JOB-${job.id}] ❌ Retry failed after ${duration}ms: ${error.message}`);
      throw error;
    }
  }

  @Process('daily-outdated-update')
  async handleDailyOutdated(job: Job<DailyUpdateJob>) {
    const startTime = Date.now();
    this.logger.log(`[JOB-${job.id}] Starting daily outdated assets update`);

    // 1. Get all outdated assets (all portfolios)
    const outdatedAssets = await this.assetsUpdateService.getOutdatedAssets();

    if (outdatedAssets.length === 0) {
      this.logger.log(`[JOB-${job.id}] No outdated assets found, skipping update`);
      return {
        traceId: 'no-assets',
        totalAssets: 0,
        successCount: 0,
        failedCount: 0,
        results: [],
        duration: 0,
      };
    }

    // 2. Extract tickers
    const tickers = outdatedAssets.map((asset) => asset.ticker);
    this.logger.log(`[JOB-${job.id}] Found ${tickers.length} outdated assets to update`);

    try {
      // 3. Update all
      const result = await this.assetsUpdateService.updateMultipleAssets(
        tickers,
        undefined,
        UpdateTrigger.CRON,
      );

      const duration = Date.now() - startTime;
      const durationMinutes = (duration / 60000).toFixed(2);
      this.logger.log(
        `[JOB-${job.id}] ✅ Daily update completed: ${result.successCount}/${result.totalAssets} successful in ${durationMinutes}min (traceId: ${result.traceId})`,
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `[JOB-${job.id}] ❌ Daily update failed after ${duration}ms: ${error.message}`,
      );
      throw error;
    }
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  @OnQueueActive()
  onActive(job: Job<AssetUpdateJobData>) {
    const jobType = job.data.type || job.name;
    const details = this.getJobDetails(job.data);
    this.logger.log(
      `[JOB-${job.id}] 🚀 Queue activated: ${jobType} (attempt ${job.attemptsMade + 1}) - ${details}`,
    );
  }

  @OnQueueCompleted()
  onCompleted(job: Job<AssetUpdateJobData>, result: any) {
    const traceId = result?.traceId || 'N/A';
    const successRate =
      result?.totalAssets > 0
        ? `${((result.successCount / result.totalAssets) * 100).toFixed(1)}%`
        : 'N/A';
    this.logger.debug(
      `[JOB-${job.id}] Queue event: completed (traceId: ${traceId}, successRate: ${successRate})`,
    );

    // Record queue job completion metric
    this.telemetryService.recordQueueJob('asset-updates', job.name, 'completed');
  }

  @OnQueueFailed()
  onFailed(job: Job<AssetUpdateJobData>, error: Error) {
    const details = this.getJobDetails(job.data);
    const maxAttempts = job.opts?.attempts || 3;
    const willRetry = job.attemptsMade < maxAttempts;

    if (willRetry) {
      this.logger.warn(
        `[JOB-${job.id}] ⚠️ Attempt ${job.attemptsMade}/${maxAttempts} failed: ${job.name} - ${details}. Will retry with exponential backoff.`,
        `Error: ${error.message}`,
      );
    } else {
      this.logger.error(
        `[JOB-${job.id}] 💥 All ${maxAttempts} attempts exhausted: ${job.name} - ${details}`,
        `Error: ${error.message}`,
      );
      // Record queue job failure metric only on final failure
      this.telemetryService.recordQueueJob('asset-updates', job.name, 'failed');
    }
  }

  /**
   * Helper to extract job details for logging
   */
  private getJobDetails(data: AssetUpdateJobData): string {
    switch (data.type) {
      case 'single':
        return `ticker=${data.ticker}`;
      case 'multiple':
        return `assets=${data.tickers.length}`;
      case 'portfolio':
        return `portfolioId=${data.portfolioId}`;
      case 'sector':
        return `sector=${data.sector}`;
      case 'retry_failed':
        return 'retrying failed assets';
      case 'daily_outdated':
        return 'daily outdated update';
      default:
        return 'unknown job type';
    }
  }
}
