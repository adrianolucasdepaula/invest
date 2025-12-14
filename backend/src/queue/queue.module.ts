import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScrapersModule } from '../scrapers/scrapers.module';
import { AssetsModule } from '../api/assets/assets.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { NewsModule } from '../api/news/news.module';
import { ScrapingProcessor } from './processors/scraping.processor';
import { AssetUpdateProcessor } from './processors/asset-update.processor';
import { ScheduledJobsService } from './jobs/scheduled-jobs.service';
import { AssetUpdateJobsService } from './jobs/asset-update-jobs.service';
import { Asset } from '../database/entities/asset.entity';
import { News } from '../database/entities/news.entity';
import { FundamentalData } from '../database/entities/fundamental-data.entity';
import { AssetPrice } from '../database/entities/asset-price.entity';
import { DataSource } from '../database/entities/data-source.entity';
import { ScrapedData } from '../database/entities/scraped-data.entity';
import { OptionPrice } from '../database/entities/option-price.entity';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'scraping' },
      { name: 'analysis' },
      { name: 'reports' },
      {
        name: 'asset-updates',
        // ✅ FIX: Enable concurrency for parallelizing asset updates
        // Allows 10 jobs to process simultaneously, reducing total time from ~35min to ~2.9min
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          timeout: 180000, // ✅ FASE 4.1: 180s (3min) - Permite fila de inicialização Playwright (30s+) + scraping (150s máx)
        },
        // Note: Concurrency is configured in processor @Processor() decorator
        // See: asset-update.processor.ts
      },
    ),
    TypeOrmModule.forFeature([Asset, News, FundamentalData, AssetPrice, DataSource, ScrapedData, OptionPrice]),
    ScrapersModule,
    WebSocketModule, // ✅ FIX: Import WebSocketModule to make AppWebSocketGateway available for dependency injection
    forwardRef(() => AssetsModule),
    forwardRef(() => NewsModule), // For news collection and sentiment analysis jobs
  ],
  providers: [
    ScrapingProcessor,
    AssetUpdateProcessor,
    ScheduledJobsService,
    AssetUpdateJobsService,
  ],
  exports: [BullModule, ScheduledJobsService, AssetUpdateJobsService],
})
export class QueueModule {}
