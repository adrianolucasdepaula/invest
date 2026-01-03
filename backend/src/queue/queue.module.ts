import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScrapersModule } from '../scrapers/scrapers.module';
import { AssetsModule } from '../api/assets/assets.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { NewsModule } from '../api/news/news.module';
import { StorageModule } from '../modules/storage/storage.module';
import { MetricsModule } from '../metrics/metrics.module';
import { ScrapingProcessor } from './processors/scraping.processor';
import { AssetUpdateProcessor } from './processors/asset-update.processor';
import { DeadLetterProcessor } from './processors/dead-letter.processor';
import { ScheduledJobsService } from './jobs/scheduled-jobs.service';
import { AssetUpdateJobsService } from './jobs/asset-update-jobs.service';
import { DeadLetterService } from './jobs/dead-letter.service';
import { DataCleanupService } from './jobs/data-cleanup.service';
import { Asset } from '../database/entities/asset.entity';
import { News } from '../database/entities/news.entity';
import { NewsAnalysis } from '../database/entities/news-analysis.entity';
import { FundamentalData } from '../database/entities/fundamental-data.entity';
import { AssetPrice } from '../database/entities/asset-price.entity';
import { DataSource } from '../database/entities/data-source.entity';
import { ScrapedData } from '../database/entities/scraped-data.entity';
import { OptionPrice } from '../database/entities/option-price.entity';
import { Analysis } from '../database/entities/analysis.entity';
import { ScraperMetric } from '../database/entities/scraper-metric.entity';
import { UpdateLog } from '../database/entities/update-log.entity';
import { SyncHistory } from '../database/entities/sync-history.entity';

/**
 * FASE 117: Retry Logic with Exponential Backoff
 * Default job options for all queues to ensure resilience
 */
const defaultRetryOptions = {
  attempts: 3, // Max 3 attempts
  backoff: {
    type: 'exponential' as const,
    delay: 2000, // Initial delay: 2s, then 4s, then 8s
  },
  removeOnComplete: 100, // Keep last 100 completed jobs for debugging
  removeOnFail: 50, // Keep last 50 failed jobs for analysis
};

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: 'scraping',
        defaultJobOptions: {
          ...defaultRetryOptions,
          timeout: 120000, // 2 min - scraping should be fast
        },
      },
      {
        name: 'analysis',
        defaultJobOptions: {
          ...defaultRetryOptions,
          timeout: 60000, // 1 min - analysis processing
        },
      },
      {
        name: 'reports',
        defaultJobOptions: {
          ...defaultRetryOptions,
          timeout: 90000, // 1.5 min - report generation
        },
      },
      {
        name: 'asset-updates',
        // ✅ FIX: Enable concurrency for parallelizing asset updates
        // Allows 10 jobs to process simultaneously, reducing total time from ~35min to ~2.9min
        defaultJobOptions: {
          ...defaultRetryOptions,
          timeout: 180000, // ✅ FASE 4.1: 180s (3min) - Permite fila de inicialização Playwright (30s+) + scraping (150s máx)
        },
        // FASE 152: Configure stalledInterval to prevent false "job stalled" errors
        // With fallback taking up to 5min, we need higher stalledInterval
        settings: {
          stalledInterval: 360000, // 6min - FASE 152: Increased from default 30s (fallback can take 5min)
          maxStalledCount: 2, // Allow 2 stalls before marking as failed
          lockDuration: 420000, // 7min - Must be > stalledInterval
          lockRenewTime: 120000, // Renew lock every 2min
        },
        // Note: Concurrency is configured in processor @Processor() decorator
        // See: asset-update.processor.ts
      },
      {
        // FASE 117: Dead Letter Queue for failed jobs
        name: 'dead-letter',
        defaultJobOptions: {
          removeOnComplete: 1000, // Keep more for analysis
          removeOnFail: false, // Never auto-remove failed in DLQ
        },
      },
    ),
    TypeOrmModule.forFeature([
      Asset,
      News,
      NewsAnalysis,
      FundamentalData,
      AssetPrice,
      DataSource,
      ScrapedData,
      OptionPrice,
      Analysis,
      ScraperMetric,
      UpdateLog,
      SyncHistory,
    ]),
    ScrapersModule,
    WebSocketModule, // ✅ FIX: Import WebSocketModule to make AppWebSocketGateway available for dependency injection
    StorageModule, // FASE 145: For MinIO archival in DataCleanupService
    MetricsModule, // FASE 145: For cleanup metrics
    forwardRef(() => AssetsModule),
    forwardRef(() => NewsModule), // For news collection and sentiment analysis jobs
  ],
  providers: [
    ScrapingProcessor,
    AssetUpdateProcessor,
    DeadLetterProcessor,
    ScheduledJobsService,
    AssetUpdateJobsService,
    DeadLetterService,
    // ✅ FASE 145 FIX: DataCleanupService checks CLEANUP_ENABLED internally
    // Service always initializes but only executes if CLEANUP_ENABLED=true
    DataCleanupService,
  ],
  exports: [BullModule, ScheduledJobsService, AssetUpdateJobsService, DeadLetterService],
})
export class QueueModule {}
