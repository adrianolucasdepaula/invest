import { Controller, Post, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CronService } from './cron.service';

/**
 * Controller for manual cron job triggers (testing/debugging)
 *
 * FASE 34.3: Daily COTAHIST Sync
 * - Endpoint POST /api/v1/cron/trigger-daily-sync
 * - Useful for testing cron logic without waiting for schedule
 * - Returns sync result summary (success count, failures, duration)
 */
@ApiTags('cron')
@Controller('cron')
export class CronController {
  private readonly logger = new Logger(CronController.name);

  constructor(private readonly cronService: CronService) {}

  /**
   * Manually trigger daily COTAHIST sync
   *
   * Useful for:
   * - Testing cron job logic
   * - Manual sync after adding new tickers
   * - Debugging sync issues
   *
   * @returns Sync result summary
   */
  @Post('trigger-daily-sync')
  @ApiOperation({
    summary: 'Manually trigger daily COTAHIST sync',
    description:
      'Syncs current year data for top 5 liquid tickers (ABEV3, VALE3, PETR4, ITUB4, BBDC4). Useful for testing cron job logic.',
  })
  @ApiResponse({
    status: 200,
    description: 'Sync completed (may have partial failures)',
    schema: {
      example: {
        success: true,
        message: 'Synced 5/5 tickers in 5432ms',
        details: {
          successCount: 5,
          failureCount: 0,
          totalTickers: 5,
          duration: 5432,
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async triggerDailySync() {
    return this.cronService.triggerDailySyncManually();
  }
}
