import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { CronController } from './cron.controller';
import { MarketDataModule } from '../../api/market-data/market-data.module';

/**
 * Module for scheduled tasks (cron jobs)
 *
 * FASE 34.3: Daily COTAHIST Sync
 * - Registers CronService with NestJS ScheduleModule
 * - Imports MarketDataModule for sync functionality
 * - Exports CronService for manual trigger endpoints
 * - CronController exposes POST /api/v1/cron/trigger-daily-sync
 */
@Module({
  imports: [MarketDataModule],
  controllers: [CronController],
  providers: [CronService],
  exports: [CronService],
})
export class CronModule {}
