import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScrapersModule } from '../scrapers/scrapers.module';
import { AssetsModule } from '../api/assets/assets.module';
import { ScrapingProcessor } from './processors/scraping.processor';
import { AssetUpdateProcessor } from './processors/asset-update.processor';
import { ScheduledJobsService } from './jobs/scheduled-jobs.service';
import { AssetUpdateJobsService } from './jobs/asset-update-jobs.service';
import { Asset } from '../database/entities/asset.entity';
import { FundamentalData } from '../database/entities/fundamental-data.entity';
import { AssetPrice } from '../database/entities/asset-price.entity';
import { DataSource } from '../database/entities/data-source.entity';
import { ScrapedData } from '../database/entities/scraped-data.entity';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'scraping' },
      { name: 'analysis' },
      { name: 'reports' },
      { name: 'asset-updates' },
    ),
    TypeOrmModule.forFeature([Asset, FundamentalData, AssetPrice, DataSource, ScrapedData]),
    ScrapersModule,
    AssetsModule,
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
