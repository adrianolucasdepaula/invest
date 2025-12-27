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
import { AppWebSocketGateway } from '../../websocket/websocket.gateway';

@Injectable()
export class AssetUpdateJobsService implements OnModuleInit {
  private readonly logger = new Logger(AssetUpdateJobsService.name);
  private readonly isProductionOrStaging: boolean;

  constructor(
    @InjectQueue('asset-updates') private assetUpdatesQueue: Queue,
    private configService: ConfigService,
    private webSocketGateway: AppWebSocketGateway,
  ) {
    const env = this.configService.get<string>('NODE_ENV', 'development');
    this.isProductionOrStaging = env === 'production' || env === 'staging';
  }

  async onModuleInit() {
    // Log queue info on startup
    const jobCounts = await this.assetUpdatesQueue.getJobCounts();
    this.logger.log(`Asset Updates Queue initialized: ${JSON.stringify(jobCounts)}`);

    // Clean stale jobs on startup (jobs older than 2 hours that are still waiting)
    // This prevents "auto-start" behavior from orphaned jobs of previous sessions
    await this.cleanStaleJobs();

    // FASE 143.0: Auto-cleanup de jobs active presos (> 5 minutos)
    // Fix definitivo para KNOWN-ISSUES.md #JOBS_ACTIVE_STALE
    setInterval(async () => {
      try {
        const cleaned = await this.assetUpdatesQueue.clean(
          5 * 60 * 1000, // 5 minutos
          'active', // Apenas jobs active órfãos
        );

        if (cleaned && cleaned.length > 0) {
          this.logger.warn(
            `[AUTO-CLEANUP] Removed ${cleaned.length} stale active jobs (> 5min)`,
          );
        }
      } catch (error) {
        this.logger.error(`[AUTO-CLEANUP] Failed: ${error.message}`);
      }
    }, 60000); // Cada 60 segundos

    this.logger.log('[AUTO-CLEANUP] Stale jobs cleanup enabled (interval: 60s, threshold: 5min)');
    this.logger.log('🔄 Cron jobs ENABLED');
  }

  /**
   * Clean stale jobs that have been waiting for too long (> 2 hours)
   * This prevents orphaned jobs from previous sessions showing as "in progress"
   */
  async cleanStaleJobs() {
    const maxAge = 2 * 60 * 60 * 1000; // 2 hours in ms
    const now = Date.now();

    try {
      const waiting = await this.assetUpdatesQueue.getWaiting();
      let cleanedCount = 0;

      for (const job of waiting) {
        const jobAge = now - job.timestamp;
        if (jobAge > maxAge) {
          await job.remove();
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        this.logger.log(`🧹 Cleaned ${cleanedCount} stale jobs (older than 2 hours)`);
      }
    } catch (error) {
      this.logger.warn(`Could not clean stale jobs: ${error.message}`);
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
   * Generate unique batch ID for tracking batch operations
   */
  private generateBatchId(): string {
    return `batch-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Queue multiple assets update
   * ✅ FIX: Create individual jobs for each asset to enable parallelization
   * and prevent job stalling on large batches (e.g., 861 assets)
   *
   * ✅ ENHANCEMENT: Emit batch WebSocket events for frontend progress tracking
   * ✅ FIX FASE 114: Added batchId to prevent race condition between multiple batches
   */
  async queueMultipleAssets(
    tickers: string[],
    userId?: string,
    triggeredBy: UpdateTrigger = UpdateTrigger.MANUAL,
  ) {
    const batchId = this.generateBatchId();
    this.logger.log(`Queueing ${tickers.length} individual asset update jobs (batchId: ${batchId})`);

    // DEBUG: Check if WebSocketGateway is injected
    this.logger.debug(`[DEBUG] WebSocketGateway instance: ${this.webSocketGateway ? 'INJECTED' : 'UNDEFINED'}`);

    // Emit batch started event
    try {
      this.logger.debug(`[DEBUG] Calling emitBatchUpdateStarted with ${tickers.length} assets (batchId: ${batchId})...`);
      this.webSocketGateway.emitBatchUpdateStarted({
        batchId,
        totalAssets: tickers.length,
        tickers,
      });
      this.logger.debug(`[DEBUG] emitBatchUpdateStarted completed successfully`);
    } catch (error) {
      this.logger.error(`[ERROR] Failed to emit batch started event: ${error.message}`, error.stack);
    }

    // ✅ Create individual job for each asset (allows BullMQ concurrency)
    const jobPromises = tickers.map((ticker) =>
      this.assetUpdatesQueue.add(
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
      ),
    );

    const jobs = await Promise.all(jobPromises);
    const jobIds = jobs.map((j) => j.id);

    this.logger.log(`✅ Queued ${jobs.length} individual jobs: ${jobIds[0]} to ${jobIds[jobIds.length - 1]}`);

    // Monitor job completion in background and emit batch completed event
    this.logger.debug(`[DEBUG] Starting monitorBatchCompletion for ${jobIds.length} jobs (batchId: ${batchId})...`);
    this.monitorBatchCompletion(jobIds, tickers.length, batchId).catch((error) => {
      this.logger.error(`[ERROR] Error monitoring batch completion: ${error.message}`, error.stack);
    });

    // Return first job ID for tracking (frontend can poll this)
    return jobIds[0];
  }

  /**
   * Monitor batch job completion and emit WebSocket events
   * Runs in background, checks periodically for job completion
   * ✅ FIX FASE 114: Added batchId parameter to track specific batch
   */
  private async monitorBatchCompletion(jobIds: any[], totalAssets: number, batchId: string) {
    this.logger.log(`[MONITOR] Starting batch monitoring for ${totalAssets} assets (batchId: ${batchId})`);
    const startTime = Date.now();
    const checkInterval = 5000; // Check every 5 seconds
    let completed = 0;
    let failed = 0;
    let lastProgress = 0;

    const checkJobs = async () => {
      this.logger.debug(`[MONITOR] Checking job status (iteration)...`);
      const jobs = await Promise.all(
        jobIds.map((id) => this.assetUpdatesQueue.getJob(id)),
      );

      completed = 0;
      failed = 0;
      let inProgress = 0;

      for (const job of jobs) {
        if (!job) continue;

        const state = await job.getState();
        if (state === 'completed') {
          completed++;
        } else if (state === 'failed') {
          failed++;
        } else if (state === 'active') {
          inProgress++;
        }
      }

      const currentProgress = completed + failed;
      const progressPercent = Math.round((currentProgress / totalAssets) * 100);

      // Emit progress update if changed significantly (every 5%)
      if (progressPercent >= lastProgress + 5 || currentProgress === totalAssets) {
        const activeJob = jobs.find(async (j) => j && (await j.getState()) === 'active');
        const currentTicker = activeJob ? (activeJob.data as any).ticker : '';

        this.logger.debug(`[MONITOR] Emitting progress: ${currentProgress}/${totalAssets} (${progressPercent}%, batchId: ${batchId})`);
        try {
          this.webSocketGateway.emitBatchUpdateProgress({
            batchId,
            current: currentProgress,
            total: totalAssets,
            currentTicker,
          });
        } catch (error) {
          this.logger.error(`[ERROR] Failed to emit progress: ${error.message}`);
        }

        lastProgress = progressPercent;
      }

      // Check if all jobs completed
      if (currentProgress >= totalAssets) {
        const duration = Date.now() - startTime;

        this.logger.log(`[MONITOR] All jobs complete! Emitting completion event (batchId: ${batchId})...`);
        try {
          this.webSocketGateway.emitBatchUpdateCompleted({
            batchId,
            totalAssets,
            successCount: completed,
            failedCount: failed,
            duration,
          });
          this.logger.debug(`[MONITOR] Completion event emitted successfully`);
        } catch (error) {
          this.logger.error(`[ERROR] Failed to emit completion: ${error.message}`);
        }

        this.logger.log(
          `✅ Batch monitoring complete: ${completed}/${totalAssets} successful, ${failed} failed (${duration}ms)`,
        );

        return true; // Stop monitoring
      }

      return false; // Continue monitoring
    };

    // Poll until all jobs complete (with max 2 hour timeout)
    const maxIterations = (2 * 60 * 60 * 1000) / checkInterval;
    for (let i = 0; i < maxIterations; i++) {
      const isDone = await checkJobs();
      if (isDone) break;

      await new Promise((resolve) => setTimeout(resolve, checkInterval));
    }
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

  /**
   * Cancel all pending jobs (waiting + active)
   * Useful for stopping a bulk update in progress
   */
  async cancelAllPendingJobs() {
    this.logger.warn('🛑 Cancelling all pending jobs...');

    // Get all waiting and active jobs
    const waiting = await this.assetUpdatesQueue.getWaiting();
    const active = await this.assetUpdatesQueue.getActive();

    let removedWaitingCount = 0;
    let removedActiveCount = 0;

    // Remove waiting jobs
    for (const job of waiting) {
      await job.remove();
      removedWaitingCount++;
    }

    // ✅ FIX: Also remove active jobs to truly "cancel all"
    // Note: Jobs in execution will still complete (Playwright can't be aborted),
    // but removing them from queue prevents retry and clears UI immediately
    for (const job of active) {
      try {
        await job.remove();
        removedActiveCount++;
      } catch (error) {
        this.logger.warn(`Failed to remove active job ${job.id}: ${error.message}`);
      }
    }

    const totalRemoved = removedWaitingCount + removedActiveCount;

    this.logger.log(`✅ Removed ${removedWaitingCount} waiting jobs + ${removedActiveCount} active jobs. Total: ${totalRemoved}`);

    // Emit WebSocket event to notify frontend (cancelled batch)
    this.webSocketGateway.emitBatchUpdateCompleted({
      batchId: `cancelled-${Date.now()}`,
      totalAssets: totalRemoved,
      successCount: 0,
      failedCount: 0,
      duration: 0,
    });

    return {
      removedWaitingJobs: removedWaitingCount,
      removedActiveJobs: removedActiveCount,
      totalRemoved,
      message: `✅ Cancelados ${totalRemoved} jobs (${removedWaitingCount} waiting + ${removedActiveCount} active)`,
    };
  }

  /**
   * Check if queue is paused
   */
  async isQueuePaused() {
    return this.assetUpdatesQueue.isPaused();
  }

  /**
   * Get job status by ID
   */
  async getJobStatus(jobId: string) {
    const job = await this.assetUpdatesQueue.getJob(jobId);

    if (!job) {
      return {
        jobId,
        status: 'not_found',
        message: 'Job not found',
      };
    }

    const state = await job.getState();
    const progress = job.progress();
    const result = job.returnvalue;
    const failedReason = job.failedReason;

    return {
      jobId,
      status: state,
      progress,
      result,
      failedReason,
      createdAt: new Date(job.timestamp),
      processedOn: job.processedOn ? new Date(job.processedOn) : null,
      finishedOn: job.finishedOn ? new Date(job.finishedOn) : null,
      attemptsMade: job.attemptsMade,
    };
  }
}
