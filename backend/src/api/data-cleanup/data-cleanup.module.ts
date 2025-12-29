import { Module } from '@nestjs/common';
import { DataCleanupController } from './data-cleanup.controller';
import { DataCleanupService } from '../../queue/jobs/data-cleanup.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScrapedData } from '../../database/entities/scraped-data.entity';
import { ScraperMetric } from '../../database/entities/scraper-metric.entity';
import { News } from '../../database/entities/news.entity';
import { NewsAnalysis } from '../../database/entities/news-analysis.entity';
import { UpdateLog } from '../../database/entities/update-log.entity';
import { SyncHistory } from '../../database/entities/sync-history.entity';
import { StorageModule } from '../../modules/storage/storage.module';
import { MetricsModule } from '../../metrics/metrics.module';

/**
 * FASE 145: Data Cleanup API Module
 *
 * Provides REST endpoints for manual cleanup triggering and monitoring
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ScrapedData,
      ScraperMetric,
      News,
      NewsAnalysis,
      UpdateLog,
      SyncHistory,
    ]),
    StorageModule,
    MetricsModule,
  ],
  controllers: [DataCleanupController],
  providers: [DataCleanupService],
})
export class DataCleanupModule {}
