import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { DeadLetterJob } from '../processors/dead-letter.processor';
import { MetricsService } from '../../metrics/metrics.service';

/**
 * FASE 117: Dead Letter Service
 *
 * Provides methods to:
 * - Move failed jobs to dead letter queue
 * - Query dead letter jobs
 * - Retry failed jobs from dead letter queue
 * - Get statistics about failures
 *
 * FASE 118: Integrated with MetricsService for Prometheus/Grafana observability
 */
@Injectable()
export class DeadLetterService {
  private readonly logger = new Logger(DeadLetterService.name);

  constructor(
    @InjectQueue('dead-letter') private deadLetterQueue: Queue<DeadLetterJob>,
    @InjectQueue('scraping') private scrapingQueue: Queue,
    @InjectQueue('analysis') private analysisQueue: Queue,
    @InjectQueue('reports') private reportsQueue: Queue,
    @InjectQueue('asset-updates') private assetUpdatesQueue: Queue,
    @Optional() private readonly metricsService?: MetricsService,
  ) {}

  /**
   * Move a failed job to the dead letter queue
   *
   * @param originalJob - The failed job
   * @param error - The error that caused the failure
   */
  async moveToDeadLetter(originalJob: Job, error: Error | string): Promise<Job<DeadLetterJob>> {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;

    const deadLetterData: DeadLetterJob = {
      originalQueue: originalJob.queue.name,
      originalJobName: originalJob.name,
      originalJobId: originalJob.id,
      originalData: originalJob.data,
      error: errorMessage,
      stack: errorStack,
      attemptsMade: originalJob.attemptsMade,
      failedAt: new Date(),
    };

    this.logger.warn(
      `[DLQ] Moving failed job to dead letter: ${originalJob.queue.name}/${originalJob.name} (ID: ${originalJob.id})`,
    );

    return this.deadLetterQueue.add('failed-job', deadLetterData, {
      attempts: 1, // Don't retry dead letter processing
    });
  }

  /**
   * Get all jobs in the dead letter queue
   */
  async getDeadLetterJobs(
    status: 'waiting' | 'completed' | 'failed' = 'waiting',
  ): Promise<Job<DeadLetterJob>[]> {
    switch (status) {
      case 'waiting':
        return this.deadLetterQueue.getWaiting();
      case 'completed':
        return this.deadLetterQueue.getCompleted();
      case 'failed':
        return this.deadLetterQueue.getFailed();
      default:
        return this.deadLetterQueue.getWaiting();
    }
  }

  /**
   * Get dead letter queue statistics
   */
  async getStats(): Promise<{
    waiting: number;
    completed: number;
    failed: number;
    byOriginalQueue: Record<string, number>;
  }> {
    const [waiting, completed, failed] = await Promise.all([
      this.deadLetterQueue.getWaitingCount(),
      this.deadLetterQueue.getCompletedCount(),
      this.deadLetterQueue.getFailedCount(),
    ]);

    // Get breakdown by original queue
    const waitingJobs = await this.deadLetterQueue.getWaiting();
    const byOriginalQueue: Record<string, number> = {};

    for (const job of waitingJobs) {
      const queue = job.data.originalQueue || 'unknown';
      byOriginalQueue[queue] = (byOriginalQueue[queue] || 0) + 1;
    }

    // FASE 118: Update Prometheus metrics with current DLQ state
    if (this.metricsService) {
      // Set overall counts
      this.metricsService.setDeadLetterJobsCount('waiting', 'all', waiting);
      this.metricsService.setDeadLetterJobsCount('completed', 'all', completed);
      this.metricsService.setDeadLetterJobsCount('failed', 'all', failed);

      // Set per-queue breakdown
      for (const [queue, count] of Object.entries(byOriginalQueue)) {
        this.metricsService.setDeadLetterJobsCount('waiting', queue, count);
      }
    }

    return {
      waiting,
      completed,
      failed,
      byOriginalQueue,
    };
  }

  /**
   * Retry a specific dead letter job
   *
   * @param jobId - ID of the dead letter job to retry
   */
  async retryJob(jobId: string | number): Promise<boolean> {
    const job = await this.deadLetterQueue.getJob(jobId);

    if (!job) {
      this.logger.warn(`[DLQ] Job ${jobId} not found in dead letter queue`);
      return false;
    }

    const { originalQueue, originalJobName, originalData, retryCount = 0 } = job.data;

    // Get the target queue
    const targetQueue = this.getQueueByName(originalQueue);

    if (!targetQueue) {
      this.logger.error(`[DLQ] Unknown queue: ${originalQueue}`);
      return false;
    }

    // Add job back to original queue
    await targetQueue.add(originalJobName, originalData, {
      attempts: 1, // Single attempt for manual retry
    });

    // Update dead letter job with retry info
    await this.deadLetterQueue.add('retry-failed', {
      ...job.data,
      retryCount: retryCount + 1,
      retriedAt: new Date(),
    });

    // Remove from waiting
    await job.remove();

    this.logger.log(
      `[DLQ] Retried job ${jobId} to ${originalQueue}/${originalJobName} (retry #${retryCount + 1})`,
    );

    // FASE 118: Update Prometheus metrics
    this.metricsService?.incrementDeadLetterProcessed('retried');

    return true;
  }

  /**
   * Retry all jobs from a specific original queue
   *
   * @param originalQueueName - Name of the original queue to retry jobs from
   */
  async retryAllFromQueue(originalQueueName: string): Promise<{ retried: number; failed: number }> {
    const waitingJobs = await this.deadLetterQueue.getWaiting();
    const jobsToRetry = waitingJobs.filter((j) => j.data.originalQueue === originalQueueName);

    let retried = 0;
    let failed = 0;

    for (const job of jobsToRetry) {
      const success = await this.retryJob(job.id);
      if (success) {
        retried++;
      } else {
        failed++;
      }
    }

    this.logger.log(`[DLQ] Retried ${retried} jobs from ${originalQueueName}, ${failed} failed`);

    return { retried, failed };
  }

  /**
   * Clear all completed dead letter jobs
   */
  async clearCompleted(): Promise<number> {
    const cleaned = await this.deadLetterQueue.clean(0, 'completed');
    this.logger.log(`[DLQ] Cleared ${cleaned.length} completed jobs`);

    // FASE 118: Update Prometheus metrics
    for (let i = 0; i < cleaned.length; i++) {
      this.metricsService?.incrementDeadLetterProcessed('cleared');
    }

    return cleaned.length;
  }

  /**
   * Clear all dead letter jobs older than specified age
   *
   * @param maxAgeMs - Maximum age in milliseconds
   */
  async clearOldJobs(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    const cleaned = await this.deadLetterQueue.clean(maxAgeMs, 'failed');
    this.logger.log(`[DLQ] Cleared ${cleaned.length} old failed jobs`);
    return cleaned.length;
  }

  // Helper to get queue by name
  private getQueueByName(name: string): Queue | null {
    switch (name) {
      case 'scraping':
        return this.scrapingQueue;
      case 'analysis':
        return this.analysisQueue;
      case 'reports':
        return this.reportsQueue;
      case 'asset-updates':
        return this.assetUpdatesQueue;
      default:
        return null;
    }
  }
}
