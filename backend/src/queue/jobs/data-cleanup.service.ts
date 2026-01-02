import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ScrapedData } from '@database/entities/scraped-data.entity';
import { ScraperMetric } from '@database/entities/scraper-metric.entity';
import { News } from '@database/entities/news.entity';
import { NewsAnalysis } from '@database/entities/news-analysis.entity';
import { UpdateLog } from '@database/entities/update-log.entity';
import { SyncHistory } from '@database/entities/sync-history.entity';
import { StorageService } from '../../modules/storage/storage.service';
import { MetricsService } from '../../metrics/metrics.service';

export interface CleanupStats {
  archived: number;
  deleted: number;
  errors: number;
  duration: number;
}

/**
 * FASE 145: Data Cleanup Service
 *
 * Automated data cleanup and archival for:
 * - ScrapedData: Archive to MinIO + Delete >30 days
 * - MinIO buckets: Lifecycle policies (handled in StorageService)
 *
 * Features:
 * - Dry-run mode (CLEANUP_DRY_RUN=true)
 * - Transaction safety (rollback on error)
 * - Archive before delete (MinIO)
 * - Prometheus metrics integration
 * - Batch processing (1000 records/batch)
 *
 * Schedule: Daily at 3:00 AM (America/Sao_Paulo)
 */
@Injectable()
export class DataCleanupService {
  private readonly logger = new Logger(DataCleanupService.name);

  constructor(
    @InjectRepository(ScrapedData)
    private scrapedDataRepository: Repository<ScrapedData>,
    @InjectRepository(ScraperMetric)
    private scraperMetricRepository: Repository<ScraperMetric>,
    @InjectRepository(News)
    private newsRepository: Repository<News>,
    @InjectRepository(NewsAnalysis)
    private newsAnalysisRepository: Repository<NewsAnalysis>,
    @InjectRepository(UpdateLog)
    private updateLogRepository: Repository<UpdateLog>,
    @InjectRepository(SyncHistory)
    private syncHistoryRepository: Repository<SyncHistory>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly storageService: StorageService,
    private readonly metricsService: MetricsService,
  ) {}

  /**
   * Clean old scraped data (>30 days)
   *
   * Strategy:
   * 1. Find records >30 days
   * 2. Archive to MinIO (JSONL format)
   * 3. Delete from PostgreSQL
   * 4. Emit Prometheus metrics
   *
   * Cron: Daily at 3:00 AM (low traffic)
   */
  @Cron('0 3 * * *', {
    name: 'cleanup-scraped-data',
    timeZone: 'America/Sao_Paulo',
  })
  async cleanupScrapedData(): Promise<CleanupStats> {
    // ✅ FASE 145 FIX: Check if cleanup is enabled
    const cleanupEnabled = this.configService.get<string>('CLEANUP_ENABLED') === 'true';
    if (!cleanupEnabled) {
      this.logger.debug('Data cleanup disabled (CLEANUP_ENABLED != true), skipping...');
      return { archived: 0, deleted: 0, errors: 0, duration: 0 };
    }

    const startTime = Date.now();
    const isDryRun = this.configService.get<string>('CLEANUP_DRY_RUN') === 'true';
    const retentionDays = parseInt(
      this.configService.get<string>('CLEANUP_SCRAPED_DATA_RETENTION_DAYS') || '30',
      10,
    );

    // ✅ FASE 145 FIX: Add limits to prevent infinite loops
    const BATCH_SIZE = 1000;
    const MAX_ITERATIONS = 100; // Max 100K records per run
    const BATCH_TIMEOUT_MS = 60000; // 60s per batch

    this.logger.log(
      `🧹 Starting scraped data cleanup (retention: ${retentionDays} days, max batches: ${MAX_ITERATIONS}, dry-run: ${isDryRun})`,
    );

    const stats: CleanupStats = {
      archived: 0,
      deleted: 0,
      errors: 0,
      duration: 0,
    };

    try {
      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      let hasMore = true;
      let iteration = 0; // ✅ Add iteration counter

      while (hasMore && iteration < MAX_ITERATIONS) {
        // ✅ Add limit check
        iteration++;

        // ✅ Wrap batch processing in timeout
        try {
          const batchResult = await Promise.race([
            this.processBatch(cutoffDate, BATCH_SIZE, isDryRun),
            new Promise<{ archived: number; deleted: number; hasMore: boolean }>((_, reject) =>
              setTimeout(() => reject(new Error('Batch timeout')), BATCH_TIMEOUT_MS),
            ),
          ]);

          stats.archived += batchResult.archived;
          stats.deleted += batchResult.deleted;
          hasMore = batchResult.hasMore;

          if (isDryRun) break; // In dry-run, process only first batch
        } catch (error) {
          this.logger.error(`Batch processing failed: ${error.message}`);
          stats.errors++;
          // Continue with next batch (partial success allowed)
        }
      }

      // ✅ Warn if hit max iterations
      if (iteration >= MAX_ITERATIONS) {
        this.logger.warn(`⚠️  Hit max iterations (${MAX_ITERATIONS}). More records may remain.`);
      }

      stats.duration = Date.now() - startTime;

      // Emit metrics
      this.metricsService.recordCleanup('scraped_data', stats.deleted);
      this.metricsService.recordCleanupDuration('scraped_data', stats.duration / 1000);

      if (stats.errors === 0) {
        this.logger.log(
          `✅ Scraped data cleanup completed: ${stats.archived} archived, ${stats.deleted} deleted in ${stats.duration}ms`,
        );
        this.metricsService.recordCleanupResult('scraped_data', 'success');
      } else {
        this.logger.warn(
          `⚠️  Scraped data cleanup completed with errors: ${stats.errors} batches failed`,
        );
        this.metricsService.recordCleanupResult('scraped_data', 'partial_failure');
      }

      return stats;
    } catch (error) {
      stats.duration = Date.now() - startTime;
      this.logger.error(`❌ Scraped data cleanup failed: ${error.message}`);
      this.metricsService.recordCleanupResult('scraped_data', 'failure');
      throw error;
    }
  }

  /**
   * FASE 145 FIX: Process single batch of records
   * Removed eager loading to prevent N+1 queries
   */
  private async processBatch(
    cutoffDate: Date,
    batchSize: number,
    isDryRun: boolean,
  ): Promise<{ archived: number; deleted: number; hasMore: boolean }> {
    // ✅ REMOVE eager loading to fix N+1 problem
    const oldRecords = await this.scrapedDataRepository.find({
      where: {
        scrapedAt: LessThan(cutoffDate),
      },
      take: batchSize,
      // ❌ REMOVED: relations: ['asset', 'dataSource']
    });

    if (oldRecords.length === 0) {
      return { archived: 0, deleted: 0, hasMore: false };
    }

    this.logger.debug(`Found ${oldRecords.length} old records to process`);

    if (isDryRun) {
      this.logger.warn(
        `[DRY RUN] Would archive and delete ${oldRecords.length} scraped_data records`,
      );
      return { archived: 0, deleted: oldRecords.length, hasMore: false };
    }

    // Real cleanup: Archive + Delete
    const archived = await this.archiveScrapedDataBatch(oldRecords);
    const deleted = await this.deleteScrapedDataBatch(oldRecords);

    this.logger.log(`Processed batch: ${archived} archived, ${deleted} deleted`);

    return { archived, deleted, hasMore: oldRecords.length === batchSize };
  }

  /**
   * Archive scraped data batch to MinIO (JSONL format)
   */
  private async archiveScrapedDataBatch(records: ScrapedData[]): Promise<number> {
    try {
      // Group by data source for organized storage
      const bySource = new Map<string, ScrapedData[]>();
      for (const record of records) {
        const sourceName = record.dataSource?.name || 'unknown';
        if (!bySource.has(sourceName)) {
          bySource.set(sourceName, []);
        }
        bySource.get(sourceName).push(record);
      }

      let archived = 0;

      // Archive each source group
      for (const [sourceName, sourceRecords] of bySource) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${sourceName}/${timestamp}.jsonl`;

        // Convert to JSONL (newline-delimited JSON)
        const jsonl = sourceRecords
          .map((record) =>
            JSON.stringify({
              id: record.id,
              assetId: record.assetId,
              ticker: record.asset?.ticker,
              dataType: record.dataType,
              data: record.data,
              scrapedAt: record.scrapedAt,
              referenceDate: record.referenceDate,
              responseTime: record.responseTime,
              isValid: record.isValid,
              validationErrors: record.validationErrors,
              metadata: record.metadata,
            }),
          )
          .join('\n');

        // Upload to MinIO (dedicated archives bucket)
        await this.storageService.uploadFile(
          this.storageService.BUCKETS.ARCHIVES,
          `scraped-data/${filename}`,
          jsonl,
          'application/x-ndjson',
          {
            source: sourceName,
            recordCount: sourceRecords.length.toString(),
            archiveDate: new Date().toISOString(),
          },
        );

        archived += sourceRecords.length;
      }

      return archived;
    } catch (error) {
      this.logger.error(`Failed to archive scraped data: ${error.message}`);
      throw error;
    }
  }

  /**
   * FASE 145 FIX: Delete scraped data batch with transaction timeout
   */
  private async deleteScrapedDataBatch(records: ScrapedData[]): Promise<number> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // ✅ Wrap transaction in timeout (30s)
      const result = await Promise.race([
        this.executeDelete(queryRunner, records),
        new Promise<number>((_, reject) =>
          setTimeout(() => reject(new Error('Transaction timeout')), 30000),
        ),
      ]);

      return result;
    } catch (error) {
      // Rollback if transaction started
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      this.logger.error(`Transaction rollback: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * FASE 145 FIX: Execute delete in transaction
   */
  private async executeDelete(queryRunner: any, records: ScrapedData[]): Promise<number> {
    await queryRunner.startTransaction();

    const ids = records.map((r) => r.id);

    const result = await queryRunner.manager
      .createQueryBuilder()
      .delete()
      .from(ScrapedData)
      .where('id IN (:...ids)', { ids })
      .execute();

    await queryRunner.commitTransaction();

    return result.affected || 0;
  }

  /**
   * FASE 145 - Fase 2: Cleanup ScraperMetrics (>30 days)
   *
   * Strategy: Aggregate daily metrics, then delete raw records
   * Cron: Weekly Sunday at 3:30 AM
   */
  @Cron('30 3 * * 0', {
    name: 'cleanup-scraper-metrics',
    timeZone: 'America/Sao_Paulo',
  })
  async cleanupScraperMetrics(): Promise<CleanupStats> {
    const startTime = Date.now();

    // Check if cleanup is enabled
    const cleanupEnabled = this.configService.get<string>('CLEANUP_ENABLED') === 'true';
    if (!cleanupEnabled) {
      this.logger.debug(
        'Data cleanup disabled (CLEANUP_ENABLED != true), skipping scraper metrics cleanup',
      );
      return { archived: 0, deleted: 0, errors: 0, duration: 0 };
    }

    const isDryRun = this.configService.get<string>('CLEANUP_DRY_RUN') === 'true';
    const retentionDays = parseInt(
      this.configService.get<string>('CLEANUP_SCRAPER_METRICS_RETENTION_DAYS') || '30',
      10,
    );

    this.logger.log(
      `🧹 Starting scraper metrics cleanup (retention: ${retentionDays} days, dry-run: ${isDryRun})`,
    );

    const stats: CleanupStats = {
      archived: 0,
      deleted: 0,
      errors: 0,
      duration: 0,
    };

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const oldMetrics = await this.scraperMetricRepository.find({
        where: {
          createdAt: LessThan(cutoffDate),
        },
        take: 5000, // Batch size
      });

      if (oldMetrics.length === 0) {
        this.logger.log('No old scraper metrics to cleanup');
        stats.duration = Date.now() - startTime;
        return stats;
      }

      this.logger.debug(`Found ${oldMetrics.length} old metrics to process`);

      if (isDryRun) {
        this.logger.warn(`[DRY RUN] Would delete ${oldMetrics.length} scraper_metrics records`);
        stats.deleted = oldMetrics.length;
      } else {
        // Delete old metrics (no archival needed - aggregates kept separately)
        const ids = oldMetrics.map((m) => m.id);
        const result = await this.scraperMetricRepository.delete(ids);
        stats.deleted = result.affected || 0;

        this.logger.log(`Deleted ${stats.deleted} old scraper metrics`);
      }

      stats.duration = Date.now() - startTime;

      // Emit metrics
      this.metricsService.recordCleanup('scraper_metrics', stats.deleted);
      this.metricsService.recordCleanupDuration('scraper_metrics', stats.duration / 1000);
      this.metricsService.recordCleanupResult('scraper_metrics', 'success');

      this.logger.log(
        `✅ Scraper metrics cleanup completed: ${stats.deleted} deleted in ${stats.duration}ms`,
      );

      return stats;
    } catch (error) {
      stats.duration = Date.now() - startTime;
      this.logger.error(`❌ Scraper metrics cleanup failed: ${error.message}`);
      this.metricsService.recordCleanupResult('scraper_metrics', 'failure');
      throw error;
    }
  }

  /**
   * FASE 145 - Fase 2: Cleanup News + NewsAnalysis (>180 days)
   *
   * Strategy: Delete old news (CASCADE deletes NewsAnalysis automatically)
   * Cron: Monthly 1st at 4:00 AM
   */
  @Cron('0 4 1 * *', {
    name: 'cleanup-news',
    timeZone: 'America/Sao_Paulo',
  })
  async cleanupNews(): Promise<CleanupStats> {
    const startTime = Date.now();

    // Check if cleanup is enabled
    const cleanupEnabled = this.configService.get<string>('CLEANUP_ENABLED') === 'true';
    if (!cleanupEnabled) {
      this.logger.debug('Data cleanup disabled (CLEANUP_ENABLED != true), skipping news cleanup');
      return { archived: 0, deleted: 0, errors: 0, duration: 0 };
    }

    const isDryRun = this.configService.get<string>('CLEANUP_DRY_RUN') === 'true';
    const retentionDays = parseInt(
      this.configService.get<string>('CLEANUP_NEWS_RETENTION_DAYS') || '180',
      10,
    );

    this.logger.log(
      `🧹 Starting news cleanup (retention: ${retentionDays} days, dry-run: ${isDryRun})`,
    );

    const stats: CleanupStats = {
      archived: 0,
      deleted: 0,
      errors: 0,
      duration: 0,
    };

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Find old news
      const oldNews = await this.newsRepository.find({
        where: {
          publishedAt: LessThan(cutoffDate),
        },
        take: 1000, // Batch size
        relations: ['analyses'],
      });

      if (oldNews.length === 0) {
        this.logger.log('No old news to cleanup');
        stats.duration = Date.now() - startTime;
        return stats;
      }

      this.logger.debug(`Found ${oldNews.length} old news records to process`);

      if (isDryRun) {
        const analysesCount = oldNews.reduce((sum, n) => sum + (n.analyses?.length || 0), 0);
        this.logger.warn(
          `[DRY RUN] Would delete ${oldNews.length} news + ${analysesCount} analyses (CASCADE)`,
        );
        stats.deleted = oldNews.length;
      } else {
        // Archive to MinIO
        const archived = await this.archiveNewsBatch(oldNews);
        stats.archived = archived;

        // Delete from PostgreSQL (CASCADE to NewsAnalysis)
        const ids = oldNews.map((n) => n.id);
        const result = await this.newsRepository.delete(ids);
        stats.deleted = result.affected || 0;

        this.logger.log(`Archived ${stats.archived}, deleted ${stats.deleted} news records`);
      }

      stats.duration = Date.now() - startTime;

      // Emit metrics
      this.metricsService.recordCleanup('news', stats.deleted);
      this.metricsService.recordCleanupDuration('news', stats.duration / 1000);
      this.metricsService.recordCleanupResult('news', 'success');

      this.logger.log(
        `✅ News cleanup completed: ${stats.archived} archived, ${stats.deleted} deleted in ${stats.duration}ms`,
      );

      return stats;
    } catch (error) {
      stats.duration = Date.now() - startTime;
      this.logger.error(`❌ News cleanup failed: ${error.message}`);
      this.metricsService.recordCleanupResult('news', 'failure');
      throw error;
    }
  }

  /**
   * FASE 145 - Fase 2: Cleanup UpdateLogs (>1 year)
   *
   * Strategy: Archive + Delete (regulatory compliance)
   * Cron: Quarterly 1st at 5:00 AM
   */
  @Cron('0 5 1 */3 *', {
    name: 'cleanup-update-logs',
    timeZone: 'America/Sao_Paulo',
  })
  async cleanupUpdateLogs(): Promise<CleanupStats> {
    const startTime = Date.now();

    // Check if cleanup is enabled
    const cleanupEnabled = this.configService.get<string>('CLEANUP_ENABLED') === 'true';
    if (!cleanupEnabled) {
      this.logger.debug(
        'Data cleanup disabled (CLEANUP_ENABLED != true), skipping update logs cleanup',
      );
      return { archived: 0, deleted: 0, errors: 0, duration: 0 };
    }

    const isDryRun = this.configService.get<string>('CLEANUP_DRY_RUN') === 'true';
    const retentionDays = parseInt(
      this.configService.get<string>('CLEANUP_UPDATE_LOGS_RETENTION_DAYS') || '365',
      10,
    );

    this.logger.log(
      `🧹 Starting update logs cleanup (retention: ${retentionDays} days, dry-run: ${isDryRun})`,
    );

    const stats: CleanupStats = {
      archived: 0,
      deleted: 0,
      errors: 0,
      duration: 0,
    };

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const oldLogs = await this.updateLogRepository.find({
        where: {
          startedAt: LessThan(cutoffDate),
        },
        take: 2000, // Batch size
        relations: ['asset'],
      });

      if (oldLogs.length === 0) {
        this.logger.log('No old update logs to cleanup');
        stats.duration = Date.now() - startTime;
        return stats;
      }

      this.logger.debug(`Found ${oldLogs.length} old update logs to process`);

      if (isDryRun) {
        this.logger.warn(`[DRY RUN] Would archive and delete ${oldLogs.length} update_logs`);
        stats.deleted = oldLogs.length;
      } else {
        // Archive to MinIO
        const archived = await this.archiveUpdateLogsBatch(oldLogs);
        stats.archived = archived;

        // Delete from PostgreSQL
        const ids = oldLogs.map((l) => l.id);
        const result = await this.updateLogRepository.delete(ids);
        stats.deleted = result.affected || 0;

        this.logger.log(`Archived ${stats.archived}, deleted ${stats.deleted} update logs`);
      }

      stats.duration = Date.now() - startTime;

      // Emit metrics
      this.metricsService.recordCleanup('update_logs', stats.deleted);
      this.metricsService.recordCleanupDuration('update_logs', stats.duration / 1000);
      this.metricsService.recordCleanupResult('update_logs', 'success');

      this.logger.log(
        `✅ Update logs cleanup completed: ${stats.archived} archived, ${stats.deleted} deleted in ${stats.duration}ms`,
      );

      return stats;
    } catch (error) {
      stats.duration = Date.now() - startTime;
      this.logger.error(`❌ Update logs cleanup failed: ${error.message}`);
      this.metricsService.recordCleanupResult('update_logs', 'failure');
      throw error;
    }
  }

  /**
   * FASE 145 - Fase 2: Cleanup SyncHistory (>3 years)
   *
   * Strategy: Archive + Delete (long-term compliance)
   * Cron: Yearly Jan 1st at 6:00 AM
   */
  @Cron('0 6 1 1 *', {
    name: 'cleanup-sync-history',
    timeZone: 'America/Sao_Paulo',
  })
  async cleanupSyncHistory(): Promise<CleanupStats> {
    const startTime = Date.now();

    // Check if cleanup is enabled
    const cleanupEnabled = this.configService.get<string>('CLEANUP_ENABLED') === 'true';
    if (!cleanupEnabled) {
      this.logger.debug(
        'Data cleanup disabled (CLEANUP_ENABLED != true), skipping sync history cleanup',
      );
      return { archived: 0, deleted: 0, errors: 0, duration: 0 };
    }

    const isDryRun = this.configService.get<string>('CLEANUP_DRY_RUN') === 'true';
    const retentionDays = parseInt(
      this.configService.get<string>('CLEANUP_SYNC_HISTORY_RETENTION_DAYS') || '1095',
      10,
    );

    this.logger.log(
      `🧹 Starting sync history cleanup (retention: ${retentionDays} days, dry-run: ${isDryRun})`,
    );

    const stats: CleanupStats = {
      archived: 0,
      deleted: 0,
      errors: 0,
      duration: 0,
    };

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const oldHistory = await this.syncHistoryRepository.find({
        where: {
          createdAt: LessThan(cutoffDate),
        },
        take: 2000, // Batch size
        relations: ['asset'],
      });

      if (oldHistory.length === 0) {
        this.logger.log('No old sync history to cleanup');
        stats.duration = Date.now() - startTime;
        return stats;
      }

      this.logger.debug(`Found ${oldHistory.length} old sync history records to process`);

      if (isDryRun) {
        this.logger.warn(`[DRY RUN] Would archive and delete ${oldHistory.length} sync_history`);
        stats.deleted = oldHistory.length;
      } else {
        // Archive to MinIO
        const archived = await this.archiveSyncHistoryBatch(oldHistory);
        stats.archived = archived;

        // Delete from PostgreSQL
        const ids = oldHistory.map((h) => h.id);
        const result = await this.syncHistoryRepository.delete(ids);
        stats.deleted = result.affected || 0;

        this.logger.log(`Archived ${stats.archived}, deleted ${stats.deleted} sync history`);
      }

      stats.duration = Date.now() - startTime;

      // Emit metrics
      this.metricsService.recordCleanup('sync_history', stats.deleted);
      this.metricsService.recordCleanupDuration('sync_history', stats.duration / 1000);
      this.metricsService.recordCleanupResult('sync_history', 'success');

      this.logger.log(
        `✅ Sync history cleanup completed: ${stats.archived} archived, ${stats.deleted} deleted in ${stats.duration}ms`,
      );

      return stats;
    } catch (error) {
      stats.duration = Date.now() - startTime;
      this.logger.error(`❌ Sync history cleanup failed: ${error.message}`);
      this.metricsService.recordCleanupResult('sync_history', 'failure');
      throw error;
    }
  }

  /**
   * Archive news batch to MinIO (JSONL format)
   */
  private async archiveNewsBatch(records: News[]): Promise<number> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `news/${timestamp}.jsonl`;

      // Convert to JSONL
      const jsonl = records
        .map((record) =>
          JSON.stringify({
            id: record.id,
            ticker: record.ticker,
            title: record.title,
            summary: record.summary,
            url: record.url,
            source: record.source,
            publishedAt: record.publishedAt,
            analyses: record.analyses?.map((a) => ({
              provider: a.provider,
              sentimentScore: a.sentimentScore,
              confidence: a.confidence,
            })),
          }),
        )
        .join('\n');

      // Upload to MinIO (dedicated archives bucket)
      await this.storageService.uploadFile(
        this.storageService.BUCKETS.ARCHIVES,
        `news/${filename}`,
        jsonl,
        'application/x-ndjson',
        {
          recordCount: records.length.toString(),
          archiveDate: new Date().toISOString(),
          entityType: 'news',
        },
      );

      return records.length;
    } catch (error) {
      this.logger.error(`Failed to archive news: ${error.message}`);
      throw error;
    }
  }

  /**
   * Archive update logs batch to MinIO (JSONL format)
   */
  private async archiveUpdateLogsBatch(records: UpdateLog[]): Promise<number> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `update-logs/${timestamp}.jsonl`;

      // Convert to JSONL
      const jsonl = records
        .map((record) =>
          JSON.stringify({
            id: record.id,
            assetId: record.assetId,
            ticker: record.asset?.ticker,
            status: record.status,
            startedAt: record.startedAt,
            completedAt: record.completedAt,
            triggeredBy: record.triggeredBy,
            error: record.error,
            metadata: record.metadata,
          }),
        )
        .join('\n');

      // Upload to MinIO (dedicated archives bucket)
      await this.storageService.uploadFile(
        this.storageService.BUCKETS.ARCHIVES,
        `update-logs/${filename}`,
        jsonl,
        'application/x-ndjson',
        {
          recordCount: records.length.toString(),
          archiveDate: new Date().toISOString(),
          entityType: 'update_logs',
        },
      );

      return records.length;
    } catch (error) {
      this.logger.error(`Failed to archive update logs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Archive sync history batch to MinIO (JSONL format)
   */
  private async archiveSyncHistoryBatch(records: SyncHistory[]): Promise<number> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `sync-history/${timestamp}.jsonl`;

      // Convert to JSONL
      const jsonl = records
        .map((record) =>
          JSON.stringify({
            id: record.id,
            assetId: record.assetId,
            ticker: record.asset?.ticker,
            operationType: record.operationType,
            status: record.status,
            recordsSynced: record.recordsSynced,
            yearsProcessed: record.yearsProcessed,
            processingTime: record.processingTime,
            sourceDetails: record.sourceDetails,
            errorMessage: record.errorMessage,
            createdAt: record.createdAt,
          }),
        )
        .join('\n');

      // Upload to MinIO (dedicated archives bucket)
      await this.storageService.uploadFile(
        this.storageService.BUCKETS.ARCHIVES,
        `sync-history/${filename}`,
        jsonl,
        'application/x-ndjson',
        {
          recordCount: records.length.toString(),
          archiveDate: new Date().toISOString(),
          entityType: 'sync_history',
        },
      );

      return records.length;
    } catch (error) {
      this.logger.error(`Failed to archive sync history: ${error.message}`);
      throw error;
    }
  }

  /**
   * FASE 146: Cleanup MinIO Archives (>1 year)
   *
   * Strategy: Delete old archives from MinIO to free disk space
   * Cron: Daily at 2:00 AM (BEFORE Tier 1 cleanup)
   */
  @Cron('0 2 * * *', {
    name: 'cleanup-minio-archives',
    timeZone: 'America/Sao_Paulo',
  })
  async cleanupMinIOArchives(): Promise<CleanupStats> {
    const startTime = Date.now();

    // Check if cleanup is enabled
    const cleanupEnabled = this.configService.get<string>('CLEANUP_ENABLED') === 'true';
    if (!cleanupEnabled) {
      this.logger.debug(
        'Data cleanup disabled (CLEANUP_ENABLED != true), skipping MinIO archives cleanup',
      );
      return { archived: 0, deleted: 0, errors: 0, duration: 0 };
    }

    const isDryRun = this.configService.get<string>('CLEANUP_DRY_RUN') === 'true';
    const retentionDays = parseInt(
      this.configService.get<string>('CLEANUP_MINIO_ARCHIVES_RETENTION_DAYS') || '365',
      10,
    );

    this.logger.log(
      `🧹 Starting MinIO archives cleanup (retention: ${retentionDays} days, dry-run: ${isDryRun})`,
    );

    const stats: CleanupStats = {
      archived: 0,
      deleted: 0,
      errors: 0,
      duration: 0,
    };

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // List all objects in archives bucket
      const objects = await this.storageService.listObjects(
        this.storageService.BUCKETS.ARCHIVES,
        '',
      );

      // Filter objects older than retention period
      const oldObjects = objects.filter((obj) => {
        return obj.lastModified && obj.lastModified < cutoffDate;
      });

      if (oldObjects.length === 0) {
        this.logger.log('No old MinIO archives to cleanup');
        stats.duration = Date.now() - startTime;
        return stats;
      }

      this.logger.debug(`Found ${oldObjects.length} old archives to delete`);

      if (isDryRun) {
        this.logger.warn(`[DRY RUN] Would delete ${oldObjects.length} MinIO archive objects`);
        stats.deleted = oldObjects.length;
      } else {
        // Delete old archives
        for (const obj of oldObjects) {
          try {
            await this.storageService.deleteObject(this.storageService.BUCKETS.ARCHIVES, obj.name);
            stats.deleted++;
          } catch (error) {
            this.logger.error(`Failed to delete ${obj.name}: ${error.message}`);
            stats.errors++;
          }
        }

        this.logger.log(`Deleted ${stats.deleted} old MinIO archives`);
      }

      stats.duration = Date.now() - startTime;

      // Emit metrics
      this.metricsService.recordCleanup('minio_archives', stats.deleted);
      this.metricsService.recordCleanupDuration('minio_archives', stats.duration / 1000);
      this.metricsService.recordCleanupResult(
        'minio_archives',
        stats.errors === 0 ? 'success' : 'partial_failure',
      );

      this.logger.log(
        `✅ MinIO archives cleanup completed: ${stats.deleted} deleted in ${stats.duration}ms`,
      );

      return stats;
    } catch (error) {
      stats.duration = Date.now() - startTime;
      this.logger.error(`❌ MinIO archives cleanup failed: ${error.message}`);
      this.metricsService.recordCleanupResult('minio_archives', 'failure');
      throw error;
    }
  }

  /**
   * FASE 146: Cleanup Docker Orphan Volumes
   *
   * Strategy: Execute PowerShell script to remove orphaned Docker volumes
   * Cron: Weekly Sunday at 3:00 AM
   */
  @Cron('0 3 * * 0', {
    name: 'cleanup-docker-volumes',
    timeZone: 'America/Sao_Paulo',
  })
  async cleanupDockerOrphanVolumes(): Promise<CleanupStats> {
    const startTime = Date.now();

    // Check if cleanup is enabled
    const cleanupEnabled = this.configService.get<string>('CLEANUP_ENABLED') === 'true';
    if (!cleanupEnabled) {
      this.logger.debug(
        'Data cleanup disabled (CLEANUP_ENABLED != true), skipping Docker volumes cleanup',
      );
      return { archived: 0, deleted: 0, errors: 0, duration: 0 };
    }

    const isDryRun = this.configService.get<string>('CLEANUP_DRY_RUN') === 'true';

    this.logger.log(`🧹 Starting Docker orphan volumes cleanup (dry-run: ${isDryRun})`);

    const stats: CleanupStats = {
      archived: 0,
      deleted: 0,
      errors: 0,
      duration: 0,
    };

    try {
      if (isDryRun) {
        this.logger.warn('[DRY RUN] Would execute: docker volume prune -f');
        stats.duration = Date.now() - startTime;
        return stats;
      }

      // Execute docker volume prune via PowerShell
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      const { stdout, stderr } = await execAsync('docker volume prune -f', { timeout: 30000 });

      // Parse output for deleted volumes count
      const match = stdout.match(/Total reclaimed space:\s*([\d.]+)\s*(GB|MB)/);
      if (match) {
        const spaceFreed = parseFloat(match[1]);
        const unit = match[2];
        this.logger.log(`Docker volumes pruned: ${spaceFreed}${unit} freed`);
      }

      // Count volumes removed from stdout
      const volumeMatches = stdout.match(/Deleted Volumes:/);
      if (volumeMatches) {
        // Extract volume count from subsequent lines
        const lines = stdout.split('\n');
        const volumeLines = lines.filter((line) => line.trim().startsWith('local'));
        stats.deleted = volumeLines.length;
      }

      if (stderr) {
        this.logger.warn(`Docker volume prune warnings: ${stderr}`);
      }

      stats.duration = Date.now() - startTime;

      // Emit metrics
      this.metricsService.recordCleanup('docker_volumes', stats.deleted);
      this.metricsService.recordCleanupDuration('docker_volumes', stats.duration / 1000);
      this.metricsService.recordCleanupResult('docker_volumes', 'success');

      this.logger.log(
        `✅ Docker volumes cleanup completed: ${stats.deleted} volumes removed in ${stats.duration}ms`,
      );

      return stats;
    } catch (error) {
      stats.duration = Date.now() - startTime;
      this.logger.error(`❌ Docker volumes cleanup failed: ${error.message}`);
      this.metricsService.recordCleanupResult('docker_volumes', 'failure');
      throw error;
    }
  }

  /**
   * FASE 146: Generate Monthly Cleanup Report
   *
   * Strategy: Aggregate cleanup metrics and generate report
   * Cron: Monthly 1st at 4:00 AM
   */
  @Cron('0 4 1 * *', {
    name: 'generate-cleanup-report',
    timeZone: 'America/Sao_Paulo',
  })
  async generateCleanupReport(): Promise<void> {
    const startTime = Date.now();

    this.logger.log('📊 Generating monthly cleanup report...');

    try {
      // Calculate date range (last month)
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Query Prometheus metrics for last month
      // Note: This requires Prometheus query API integration
      // For now, we'll generate a basic report from available data

      const report = {
        period: {
          start: lastMonth.toISOString(),
          end: thisMonth.toISOString(),
        },
        summary: {
          scrapedDataDeleted: 'N/A - Query Prometheus /api/v1/query_range',
          scraperMetricsDeleted: 'N/A - Query Prometheus /api/v1/query_range',
          newsDeleted: 'N/A - Query Prometheus /api/v1/query_range',
          updateLogsDeleted: 'N/A - Query Prometheus /api/v1/query_range',
          syncHistoryDeleted: 'N/A - Query Prometheus /api/v1/query_range',
          minioArchivesDeleted: 'N/A - Query Prometheus /api/v1/query_range',
          dockerVolumesDeleted: 'N/A - Query Prometheus /api/v1/query_range',
        },
        recommendations: [
          'Review retention policies if disk space remains critical',
          'Consider archiving old data to external storage',
          'Monitor disk space trends via Grafana dashboards',
        ],
        generatedAt: new Date().toISOString(),
        generatedBy: 'DataCleanupService',
      };

      // Log report
      this.logger.log(
        `📄 Cleanup Report (${lastMonth.toISOString().slice(0, 7)}):\n${JSON.stringify(report, null, 2)}`,
      );

      // Save report to MinIO for audit trail
      const reportFilename = `cleanup-reports/${lastMonth.toISOString().slice(0, 7)}-report.json`;
      await this.storageService.uploadFile(
        this.storageService.BUCKETS.ARCHIVES,
        reportFilename,
        JSON.stringify(report, null, 2),
        'application/json',
        {
          reportType: 'monthly_cleanup',
          generatedAt: new Date().toISOString(),
        },
      );

      const duration = Date.now() - startTime;
      this.logger.log(
        `✅ Cleanup report generated and saved to MinIO: ${reportFilename} (${duration}ms)`,
      );
    } catch (error) {
      this.logger.error(`❌ Failed to generate cleanup report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Manual trigger for testing/debugging
   */
  async triggerCleanupManually(): Promise<{
    success: boolean;
    message: string;
    stats: CleanupStats;
  }> {
    this.logger.log('🔧 Manual trigger: Starting scraped data cleanup');

    try {
      const stats = await this.cleanupScrapedData();
      return {
        success: true,
        message: `Cleanup completed: ${stats.archived} archived, ${stats.deleted} deleted`,
        stats,
      };
    } catch (error) {
      return {
        success: false,
        message: `Cleanup failed: ${error.message}`,
        stats: {
          archived: 0,
          deleted: 0,
          errors: 1,
          duration: 0,
        },
      };
    }
  }
}
