import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { AssetsUpdateService } from '../../api/assets/assets-update.service';
import { UpdateTrigger } from '@database/entities';

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

  constructor(private readonly assetsUpdateService: AssetsUpdateService) {}

  @Process('update-single-asset')
  async handleSingleAsset(job: Job<SingleAssetUpdateJob>) {
    this.logger.log(`[JOB ${job.id}] Processing single asset update: ${job.data.ticker}`);

    const result = await this.assetsUpdateService.updateSingleAsset(
      job.data.ticker,
      job.data.userId,
      job.data.triggeredBy,
    );

    return result;
  }

  @Process('update-multiple-assets')
  async handleMultipleAssets(job: Job<MultipleAssetsUpdateJob>) {
    this.logger.log(`[JOB ${job.id}] Processing batch update: ${job.data.tickers.length} assets`);

    const result = await this.assetsUpdateService.updateMultipleAssets(
      job.data.tickers,
      job.data.userId,
      job.data.triggeredBy,
    );

    return result;
  }

  @Process('update-portfolio')
  async handlePortfolio(job: Job<PortfolioUpdateJob>) {
    this.logger.log(`[JOB ${job.id}] Processing portfolio update: ${job.data.portfolioId}`);

    const result = await this.assetsUpdateService.updatePortfolioAssets(
      job.data.portfolioId,
      job.data.userId,
    );

    return result;
  }

  @Process('update-sector')
  async handleSector(job: Job<SectorUpdateJob>) {
    this.logger.log(`[JOB ${job.id}] Processing sector update: ${job.data.sector}`);

    const result = await this.assetsUpdateService.updateAssetsBySector(
      job.data.sector,
      job.data.userId,
    );

    return result;
  }

  @Process('retry-failed')
  async handleRetryFailed(job: Job<RetryFailedJob>) {
    this.logger.log(`[JOB ${job.id}] Processing retry failed assets`);

    const result = await this.assetsUpdateService.retryFailedAssets();

    return result;
  }

  @Process('daily-outdated-update')
  async handleDailyOutdated(job: Job<DailyUpdateJob>) {
    this.logger.log(`[JOB ${job.id}] Processing daily outdated assets update`);

    // 1. Get all outdated assets (all portfolios)
    const outdatedAssets = await this.assetsUpdateService.getOutdatedAssets();

    if (outdatedAssets.length === 0) {
      this.logger.log(`[JOB ${job.id}] No outdated assets found`);
      return {
        totalAssets: 0,
        successCount: 0,
        failedCount: 0,
        results: [],
        duration: 0,
      };
    }

    // 2. Extract tickers
    const tickers = outdatedAssets.map((asset) => asset.ticker);
    this.logger.log(`[JOB ${job.id}] Found ${tickers.length} outdated assets to update`);

    // 3. Update all
    const result = await this.assetsUpdateService.updateMultipleAssets(
      tickers,
      undefined,
      UpdateTrigger.CRON,
    );

    return result;
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  @OnQueueActive()
  onActive(job: Job<AssetUpdateJobData>) {
    this.logger.log(
      `[JOB ${job.id}] Started processing: ${job.name} (attempt ${job.attemptsMade + 1})`,
    );
  }

  @OnQueueCompleted()
  onCompleted(job: Job<AssetUpdateJobData>, result: any) {
    this.logger.log(
      `[JOB ${job.id}] ✅ Completed ${job.name}: ${JSON.stringify(result).substring(0, 200)}`,
    );
  }

  @OnQueueFailed()
  onFailed(job: Job<AssetUpdateJobData>, error: Error) {
    this.logger.error(`[JOB ${job.id}] ❌ Failed ${job.name}: ${error.message}`, error.stack);
  }
}
