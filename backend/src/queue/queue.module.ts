import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScrapersModule } from '../scrapers/scrapers.module';
import { ScrapingProcessor } from './processors/scraping.processor';
import { ScheduledJobsService } from './jobs/scheduled-jobs.service';
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
    ),
    TypeOrmModule.forFeature([
      Asset,
      FundamentalData,
      AssetPrice,
      DataSource,
      ScrapedData,
    ]),
    ScrapersModule,
  ],
  providers: [ScrapingProcessor, ScheduledJobsService],
  exports: [BullModule, ScheduledJobsService],
})
export class QueueModule {}
