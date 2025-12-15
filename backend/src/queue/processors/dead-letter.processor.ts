import { Processor, Process, OnQueueActive, OnQueueCompleted } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

/**
 * Dead Letter Job interface
 * Contains metadata about the original failed job
 */
export interface DeadLetterJob {
  originalQueue: string;
  originalJobName: string;
  originalJobId: string | number;
  originalData: unknown;
  error: string;
  stack?: string;
  attemptsMade: number;
  failedAt: Date;
  retriedAt?: Date;
  retryCount?: number;
}

/**
 * FASE 117: Dead Letter Processor
 *
 * Handles jobs that have been moved to the dead letter queue after
 * exhausting all retry attempts. This allows for:
 * - Manual review and retry
 * - Alerting and monitoring
 * - Analysis of systematic failures
 */
@Processor('dead-letter')
export class DeadLetterProcessor {
  private readonly logger = new Logger(DeadLetterProcessor.name);

  @OnQueueActive()
  onActive(job: Job<DeadLetterJob>) {
    this.logger.log(
      `[DLQ-${job.id}] Processing dead letter: ${job.data.originalQueue}/${job.data.originalJobName}`,
    );
  }

  @OnQueueCompleted()
  onCompleted(job: Job<DeadLetterJob>, result: any) {
    this.logger.log(
      `[DLQ-${job.id}] Dead letter processed: ${result?.action || 'logged'}`,
    );
  }

  /**
   * Process a dead letter job
   * Default action is to log and store for analysis
   */
  @Process('failed-job')
  async processFailedJob(job: Job<DeadLetterJob>) {
    const { originalQueue, originalJobName, originalJobId, error, attemptsMade, failedAt } = job.data;

    this.logger.warn(
      `[DLQ] Failed job analysis:\n` +
      `  Queue: ${originalQueue}\n` +
      `  Job: ${originalJobName} (ID: ${originalJobId})\n` +
      `  Attempts: ${attemptsMade}\n` +
      `  Error: ${error}\n` +
      `  Failed at: ${failedAt}`,
    );

    // TODO: Future enhancements
    // - Send notification to monitoring system
    // - Store in database for dashboard
    // - Trigger automatic alert if pattern detected

    return {
      action: 'logged',
      originalQueue,
      originalJobName,
      processedAt: new Date(),
    };
  }

  /**
   * Process a retry request from the dead letter queue
   */
  @Process('retry-failed')
  async processRetry(job: Job<DeadLetterJob & { retryToQueue: string }>) {
    const { originalQueue, originalJobName, originalData, retryCount = 0 } = job.data;

    this.logger.log(
      `[DLQ] Retrying job from dead letter:\n` +
      `  Queue: ${originalQueue}\n` +
      `  Job: ${originalJobName}\n` +
      `  Retry #: ${retryCount + 1}`,
    );

    // Update retry metadata
    job.data.retryCount = retryCount + 1;
    job.data.retriedAt = new Date();

    return {
      action: 'retry-scheduled',
      originalQueue,
      originalJobName,
      retryCount: retryCount + 1,
    };
  }
}
